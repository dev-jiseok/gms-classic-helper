import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { startBrowser, root } from './rea-browser.mjs';

const exec = promisify(execFile);
const output = `${root}research/output`;
await mkdir(output, { recursive: true });
const html = await readFile(`${root}research/fixtures/web/index.html`);
const script = await readFile(`${root}research/fixtures/web/app.js`);
const server = createServer((request, response) => {
  const routes = {
    '/': ['text/html; charset=utf-8', html],
    '/app.js': ['text/javascript; charset=utf-8', script],
    '/api/score': ['application/json', '{"score":725}'],
  };
  const route = routes[request.url];
  response.writeHead(route ? 200 : 404, { 'content-type': route?.[0] ?? 'text/plain' });
  response.end(route?.[1] ?? 'Not found');
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
async function cli(args, name) {
  const { stdout, stderr } = await exec(process.execPath, [`${root}scripts/rea.mjs`, ...args, '--json'], {
    cwd: root, timeout: 120_000, maxBuffer: 64 * 1024 * 1024,
  });
  await writeFile(`${output}/${name}.json`, stdout);
  if (stderr) await writeFile(`${output}/${name}.stderr.log`, stderr);
  const evidence = JSON.parse(stdout);
  assert(evidence.evidence_id, `No REA Evidence returned: ${stdout.slice(0, 1000)}`);
  return evidence;
}

try {
  console.log('1/4 별도 Chrome 프로필 시작 및 REA 탭 탐색');
  browser = await startBrowser({ headless: true, url: origin });
  const targets = await cli(['list-browser-targets', browser.endpoint], 'web-targets');
  const pages = await (await fetch(`${browser.endpoint}/json/list`)).json();
  const target = pages.find((page) => page.type === 'page' && page.url.startsWith(origin));
  assert(target, 'Local fixture tab not found');
  assert(JSON.stringify(targets.normalized_result).includes(target.id));

  console.log('2/4 DOM·JavaScript 소스 수집');
  const page = await cli(['inspect-web-page', browser.endpoint, target.id,
    '--include-script-sources', '--include-accessibility-text'], 'web-page');
  assert(JSON.stringify(page.normalized_result).includes('load-score'));

  console.log('3/4 브라우저 JavaScript 번들 정적 분석');
  const bundle = await cli(['analyze-web-bundle', browser.endpoint, target.id], 'web-bundle');
  assert(JSON.stringify(bundle.normalized_result).includes('app.js'));

  console.log('4/4 샘플 버튼 클릭 → API 요청 → DOM 변경 및 스크린샷');
  const scenario = {
    browser: { mode: 'connect', cdp_endpoint: browser.endpoint, target_id: target.id },
    start_url: { url: origin },
    actions: [
      { step_id: 'load-score', action: 'click', locator: { kind: 'css', selector: '#load-score' }, timeout_ms: 10_000 },
      { step_id: 'wait-for-score', action: 'wait_for', locator: { kind: 'css', selector: '#result[data-loaded="true"]' }, state: 'visible', timeout_ms: 10_000 },
    ],
    capture: { at_end: ['url', 'dom', 'screenshot'], events: ['network'] },
  };
  const scenarioPath = `${output}/web-scenario-input.json`;
  await writeFile(scenarioPath, JSON.stringify(scenario, null, 2));
  const capture = await cli(['capture-browser-scenario', scenarioPath], 'web-scenario');
  const result = capture.normalized_result;
  assert(result.steps.every((step) => step.status === 'completed'));
  assert(result.events.items.some((event) => event.kind === 'response' && JSON.stringify(event).includes('/api/score')));
  const final = result.steps.at(-1).artifacts;
  assert.equal(final.dom.state, 'captured');
  assert(final.dom.value.text.includes('score:725'));
  assert.equal(final.screenshot.state, 'captured');
  await writeFile(`${output}/web-verification.json`, `${JSON.stringify({
    checked_at: new Date().toISOString(), healthy: true,
    chrome: result.browser, fixture_origin: origin,
    evidence: { targets: targets.evidence_id, page: page.evidence_id, bundle: bundle.evidence_id, scenario: capture.evidence_id },
  }, null, 2)}\n`);
  console.log('웹 환경 검증 완료: 탭 탐색, DOM·스크립트, 번들 분석, 클릭·API·스크린샷');
} finally {
  if (browser) {
    browser.child.kill('SIGTERM');
    if (browser.child.exitCode === null && browser.child.signalCode === null) {
      await once(browser.child, 'exit');
    }
  }
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
