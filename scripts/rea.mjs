import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../node_modules/rea-agents/scripts/rea.mjs', import.meta.url));
if (!existsSync(cli)) {
  console.error('REA가 없습니다. 프로젝트 폴더에서 npm ci를 먼저 실행하세요.');
  process.exit(1);
}

// Keep explicit settings; otherwise discover Homebrew installations on macOS.
const env = { ...process.env };
if (process.platform === 'darwin') {
  for (const prefix of ['/opt/homebrew', '/usr/local']) {
    const ghidra = `${prefix}/opt/ghidra/libexec`;
    const java = `${prefix}/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`;
    if (!env.GHIDRA_INSTALL_DIR && existsSync(`${ghidra}/support/analyzeHeadless`)) {
      env.GHIDRA_INSTALL_DIR = ghidra;
    }
    if (!env.JAVA_HOME && existsSync(`${java}/bin/javac`)) env.JAVA_HOME = java;
  }
}

const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
