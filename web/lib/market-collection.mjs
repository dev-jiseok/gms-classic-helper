import { createMarketStore, readStoredCozy } from './market-store.mjs';

// This shared-data operation is hosted behind the owner-private Site boundary.
// It never reads a visitor's profile, watchlist, messages, or connected accounts.
export function collectionSummary(payload, stored = null) {
  return {
    fetchedAt: payload?.fetchedAt ?? null,
    sourceUpdatedAt: payload?.sourceUpdatedAt ?? null,
    nextPollAt: payload?.nextPollAt ?? null,
    quoteCount: Array.isArray(payload?.quotes) ? payload.quotes.length : 0,
    providerStatus: payload?.provider?.status ?? 'unavailable',
    storageStatus: payload?.storageStatus ?? (stored ? 'connected' : 'unavailable'),
    cached: payload?.cached === true,
    stale: payload?.stale === true,
    history: stored,
  };
}
export async function collectPublicMarket(reader, db) {
  const store = createMarketStore(db);
  if (!store) throw new Error('시세 이력 저장소에 연결하지 못했습니다.');
  const result = await readStoredCozy(reader, store);
  if (result.storageStatus !== 'connected' || !result.fetchedAt || !result.quotes?.length) throw new Error('공개 시세를 저장하지 못했습니다.');
  const history = await db.prepare('SELECT COUNT(*) AS rows, MAX(observed_at) AS newestAt FROM market_observations WHERE provider_id=?').bind('cozy').first();
  return collectionSummary(result, history);
}
export async function publicMarketCollectionStatus(db) {
  const store = createMarketStore(db);
  if (!store) throw new Error('시세 이력 저장소에 연결하지 못했습니다.');
  const snapshot = await store.snapshot();
  const history = await db.prepare('SELECT COUNT(*) AS rows, MAX(observed_at) AS newestAt FROM market_observations WHERE provider_id=?').bind('cozy').first();
  return collectionSummary(snapshot?.payload, history);
}
