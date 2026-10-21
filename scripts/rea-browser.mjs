import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const root = fileURLToPath(new URL('../', import.meta.url));

export async function startBrowser({ headless = false, url = 'about:blank' } = {}) {
  const executable = [
    process.env.REA_CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].find((path) => path && existsSync(path));
  if (!executable) throw new Error('Chrome 실행 파일을 REA_CHROME_PATH로 지정하세요.');
  if (url !== 'about:blank' && !['http:', 'https:'].includes(new URL(url).protocol)) {
    throw new Error('웹사이트 URL은 http:// 또는 https://로 시작해야 합니다.');
  }

  await mkdir(`${root}.local`, { recursive: true });
  const profile = await mkdtemp(`${root}.local/chrome-rea-`);
  const child = spawn(executable, [
    `--user-data-dir=${profile}`, '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1', '--no-first-run', '--no-default-browser-check',
    ...(headless ? ['--headless=new'] : []), url,
  ], { detached: !headless, stdio: 'ignore' });
  let failure;
  child.on('error', (error) => { failure = error; });
  for (let attempt = 0; attempt < 150; attempt++) {
    if (failure) throw failure;
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('분석용 Chrome이 시작 중 종료됐습니다.');
    try {
      const [port] = (await readFile(`${profile}/DevToolsActivePort`, 'utf8')).split('\n');
      if (!/^\d+$/.test(port)) throw new Error('Chrome 디버깅 포트가 유효하지 않습니다.');
      const endpoint = `http://127.0.0.1:${port}`;
      const response = await fetch(`${endpoint}/json/version`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return { child, endpoint, profile, executable };
    } catch { /* Wait for this newly created profile's debugging endpoint. */ }
    await delay(200);
  }
  child.kill('SIGTERM');
  throw new Error('분석용 Chrome의 CDP 연결 시간이 초과됐습니다.');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const browser = await startBrowser({ url: process.argv[2] });
  const state = { endpoint: browser.endpoint, pid: browser.child.pid, profile: browser.profile };
  await writeFile(`${root}.local/rea-browser.json`, `${JSON.stringify(state, null, 2)}\n`);
  browser.child.unref();
  console.log('분석용 Chrome을 열었습니다. 이 창에서 분석할 사이트를 열어주세요.');
  console.log(JSON.stringify(state, null, 2));
  console.log(`탭 조회: npm run rea -- list-browser-targets ${browser.endpoint} --json`);
}
