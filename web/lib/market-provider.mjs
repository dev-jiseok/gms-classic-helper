import { dedupeQuotes, normalizeQuote, MARKET_INTERVAL_SECONDS } from './market-core.mjs';

// No browser-supplied endpoint or credentials are accepted. Operators can enable
// a feed only after confirming the provider permits this use.
export function feedConfig(env = {}) {
  const raw = env.MARKET_FEED_URL;
  const name = String(env.MARKET_FEED_NAME || '허가된 가격 공급원').slice(0, 120);
  const intervalSeconds = Math.max(30, Math.min(3600, Number(env.MARKET_FEED_MIN_INTERVAL_SECONDS) || MARKET_INTERVAL_SECONDS));
  if (!raw) return { enabled: false, name, intervalSeconds, reason: '외부 실시간 가격 공급원 연결 전' };
  if (String(env.MARKET_FEED_REUSE_ALLOWED) !== 'true') return { enabled: false, name, intervalSeconds, reason: '공급원의 자동 수집·재사용 허용 확인 필요' };
  try {
    const url = new URL(raw), host = url.hostname.toLowerCase();
    const allow = String(env.MARKET_FEED_ALLOWED_HOSTS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
    const privateHost = /(^localhost$|\.localhost$|\.local$|\.internal$|^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^172\.(1[6-9]|2\d|3[01])\.|^\[|^[\d.]+$)/.test(host);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || privateHost || !allow.includes(host)) return { enabled: false, name, intervalSeconds, reason: '허용된 HTTPS 공급원 주소 설정 필요' };
    return { enabled: true, name, id: 'licensed-feed', url: url.href, token: env.MARKET_FEED_TOKEN ? String(env.MARKET_FEED_TOKEN) : '', intervalSeconds };
  } catch { return { enabled: false, name, intervalSeconds, reason: '공급원 주소 설정 오류' }; }
}
async function boundedJson(response, maxBytes = 2_000_000) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('공급원 응답 용량 초과');
  if (!response.body) throw new Error('공급원이 빈 응답을 반환했습니다.');
  const reader = response.body.getReader(), chunks = []; let bytes = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > maxBytes) { await reader.cancel(); throw new Error('공급원 응답 용량 초과'); } chunks.push(value); } } finally { reader.releaseLock(); }
  const all = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(all));
}
export function createMarketConnector({ fetchFn = fetch, clock = Date.now } = {}) {
  let cache = null, inFlight = null, configKey = '', failureCount = 0, retryAt = 0;
  return async function read(config) {
    const now = clock();
    if (!config.enabled) return { provider: { id: 'licensed-feed', name: config.name, configured: false, status: 'unconfigured', message: config.reason }, quotes: [], intervalSeconds: config.intervalSeconds, nextPollAt: new Date(now + config.intervalSeconds * 1000).toISOString(), fetchedAt: null, sourceUpdatedAt: null, stale: true };
    const nextKey = `${config.url}|${config.token}`;
    if (configKey !== nextKey) { cache = null; failureCount = 0; retryAt = 0; configKey = nextKey; }
    const payload = (status, message = '') => ({ provider: { id: config.id, name: config.name, configured: true, status, message }, quotes: cache?.quotes ?? [], intervalSeconds: config.intervalSeconds, fetchedAt: cache?.fetchedAt ?? null, sourceUpdatedAt: cache?.sourceUpdatedAt ?? null, nextPollAt: new Date(Math.max(retryAt, (cache?.checkedAt ?? 0) + config.intervalSeconds * 1000, now + 1000)).toISOString(), stale: !cache || now - cache.checkedAt > config.intervalSeconds * 2000, invalidRows: cache?.invalidRows ?? 0 });
    if (now < retryAt) return payload('backoff', '공급원 재시도를 기다리는 중입니다. 마지막 정상 자료의 확인 시각을 참고하세요.');
    if (cache && now - cache.checkedAt < config.intervalSeconds * 1000) return payload('cached');
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const headers = { Accept: 'application/json', ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}), ...(cache?.etag ? { 'If-None-Match': cache.etag } : {}) };
        const response = await fetchFn(config.url, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
        if (response.status === 304 && cache) { cache.checkedAt = clock(); failureCount = 0; return payload('unchanged'); }
        if (!response.ok) { const e = new Error(`공급원 HTTP ${response.status}`); e.retrySeconds = parseRetryAfter(response.headers.get('retry-after'), now); throw e; }
        const json = await boundedJson(response);
        const input = Array.isArray(json) ? json : json.quotes;
        if (!Array.isArray(input) || input.length > 20_000) throw new Error('공급원 quotes 형식 오류');
        const quotes = input.map(q => normalizeQuote(q, { id: config.id, name: config.name }, clock())).filter(Boolean);
        if (input.length && !quotes.length) throw new Error('확인 시각·가격을 갖춘 공급원 기록이 없습니다.');
        const sourceUpdatedAt = !Array.isArray(json) && Number.isFinite(Date.parse(json.updatedAt)) ? new Date(json.updatedAt).toISOString() : quotes.reduce((latest, q) => !latest || q.at > latest ? q.at : latest, null);
        cache = { quotes: dedupeQuotes(quotes), checkedAt: clock(), fetchedAt: new Date(clock()).toISOString(), sourceUpdatedAt, etag: response.headers.get('etag'), invalidRows: input.length - quotes.length };
        failureCount = 0; retryAt = 0; return payload('connected');
      } catch (error) {
        failureCount++;
        const delay = Math.max(config.intervalSeconds, Math.min(3600, 30 * 2 ** Math.min(failureCount, 7)), Math.min(3600, error.retrySeconds || 0));
        retryAt = clock() + delay * 1000;
        return payload('backoff', error.message?.startsWith('공급원') ? error.message : '가격 공급원에 연결하지 못했습니다.');
      } finally { inFlight = null; }
    })();
    return inFlight;
  };
}
export function parseRetryAfter(value, now = Date.now()) { if (!value) return 0; if (/^\d+$/.test(value)) return Number(value); const t = Date.parse(value); return Number.isFinite(t) ? Math.max(0, Math.ceil((t - now) / 1000)) : 0; }
