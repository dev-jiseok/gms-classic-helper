import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const launcher = fileURLToPath(new URL('./rea.mjs', import.meta.url));
const output = `${root}research/output`;
const build = `${root}.local/rea-verification`;
await mkdir(output, { recursive: true });
await mkdir(build, { recursive: true });

async function cli(args, name) {
  const { stdout, stderr } = await exec(process.execPath, [launcher, ...args, '--json'], {
    cwd: root, timeout: 240_000, maxBuffer: 32 * 1024 * 1024,
  });
  await writeFile(`${output}/${name}.json`, stdout);
  if (stderr) await writeFile(`${output}/${name}.stderr.log`, stderr);
  return JSON.parse(stdout);
}

console.log('1/4 Codex registration, skill and Ghidra readiness');
const doctor = await cli(['doctor', '--client', 'codex', '--provider', 'ghidra', '--skill'], 'doctor');
assert.equal(doctor.healthy, true, 'Selected Codex/Ghidra readiness checks failed');

console.log('2/4 JavaScript module and import analysis (authored fixture)');
const js = await cli(['analyze-javascript-application', `${root}research/fixtures/javascript`], 'javascript-smoke');
assert.equal(js.operation, 'analyze_javascript_application');
const sourceModules = js.normalized_result.graph.nodes.filter((node) =>
  node.observations.some((item) => item.properties?.semantic_role === 'source-module'));
assert.equal(sourceModules.length, 2);
assert(sourceModules.some((node) => node.observations.some((item) => item.properties?.import_relationships === 1)));

console.log('3/4 Ghidra native decompilation (authored C fixture; target is never executed)');
assert.equal(process.platform, 'darwin', 'Native smoke compilation currently uses macOS clang');
const binary = `${build}/native-fixture`;
await exec('xcrun', ['clang', '-O0', '-g', `${root}research/fixtures/native.c`, '-o', binary], { cwd: root });
const native = await cli(['decompile', binary, '_rea_fixture_score', '--provider', 'ghidra'], 'native-smoke');
assert.equal(native.provider.id, 'ghidra');
assert(JSON.stringify(native).includes('rea_fixture_score'), 'Expected fixture function in decompilation');

console.log('4/4 MCP initialize, tools/list and binary_session');
const child = spawn(process.execPath, [launcher, 'mcp'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
const lines = createInterface({ input: child.stdout });
const pending = new Map();
let id = 0;
let diagnostics = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => { diagnostics = (diagnostics + chunk).slice(-64_000); });
function rejectPending(error) {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(error); }
  pending.clear();
}
lines.on('line', (line) => {
  let message;
  try { message = JSON.parse(line); } catch { rejectPending(new Error(`Invalid MCP stdout: ${line}`)); return; }
  const waiter = pending.get(message.id);
  if (!waiter) return;
  clearTimeout(waiter.timer);
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
  else waiter.resolve(message.result);
});
child.on('error', rejectPending);
child.on('exit', (code) => rejectPending(new Error(`MCP exited (${code}): ${diagnostics}`)));
function request(method, params) {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`MCP ${method} timed out: ${diagnostics}`)); }, 30_000);
    pending.set(requestId, { resolve, reject, timer });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params })}\n`);
  });
}
let mcp;
try {
  const initialized = await request('initialize', {
    protocolVersion: '2025-03-26', capabilities: {},
    clientInfo: { name: 'gms-classic-helper-environment-check', version: '0.1.0' },
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
  const tools = [];
  let cursor;
  do {
    const page = await request('tools/list', cursor ? { cursor } : {});
    tools.push(...page.tools);
    cursor = page.nextCursor;
  } while (cursor);
  assert(tools.some((tool) => tool.name === 'open_binary'));
  assert(tools.some((tool) => tool.name === 'binary_session'));
  const session = await request('tools/call', { name: 'binary_session', arguments: {} });
  assert(!session.isError, JSON.stringify(session));
  mcp = { initialized, tool_count: tools.length, tools: tools.map((tool) => tool.name), session };
  await writeFile(`${output}/mcp-smoke.json`, JSON.stringify(mcp, null, 2));
} finally {
  lines.close();
  child.stdin.end();
  child.kill('SIGTERM');
}

const summary = {
  checked_at: new Date().toISOString(),
  platform: `${process.platform}/${process.arch}`, node: process.version,
  healthy: doctor.healthy,
  javascript_evidence: js.evidence_id,
  native_evidence: native.evidence_id,
  mcp_tool_count: mcp.tool_count,
};
await writeFile(`${output}/verification.json`, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
