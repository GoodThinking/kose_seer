'use strict';
// Start the web server on a temporary client tree and exercise revalidation, aborts and open failures.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const modules = path.resolve(process.argv[2]);
const source = path.resolve(process.argv[3] || path.join(__dirname, '../compat/client-patches/versioned-assets'));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-web-cache-'));
for (const name of ['server.cjs', 'battle-asset-cache.cjs', 'index.html']) fs.copyFileSync(path.join(source, name), path.join(root, name));
fs.writeFileSync(path.join(root, 'asset-cache.cjs'), 'module.exports = async () => null;\n');
fs.symlinkSync(modules, path.join(root, 'node_modules'));
const write = (relative, bytes) => {
  const file = path.join(root, 'assets', relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  return file;
};
const map = write('resource/map/1.swf', crypto.randomBytes(8 * 1024 * 1024));
write('resource/fightResource/pet/swf/1.swf', crypto.randomBytes(1024));
const locked = write('resource/map/2.swf', Buffer.from('locked'));
fs.chmodSync(locked, 0);
const port = 18000 + Math.floor(Math.random() * 1000), origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.cjs'], { cwd: root, env: { ...process.env, PORT: String(port), PUBLIC_ORIGIN: origin }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
const get = (pathname, headers = {}) => new Promise((resolve, reject) => {
  const req = http.get({ host: '127.0.0.1', port, path: pathname, headers: { host: `127.0.0.1:${port}`, ...headers } }, res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
  });
  req.on('error', reject);
});
// lsof reports resolved paths (macOS temp directories are symlinks).
const openFiles = file => {
  const target = fs.realpathSync(file);
  try { return execFileSync('lsof', ['-p', String(child.pid), '-Fn'], { encoding: 'utf8' }).split('\n').filter(line => line === 'n' + target).length; }
  catch { return 0; }
};
const results = [];
(async () => {
  for (let i = 0; i < 50 && !output.includes('CLIENT_LAB'); i++) await new Promise(r => setTimeout(r, 100));
  assert.ok(output.includes('CLIENT_LAB'), 'Server did not start: ' + output);

  const first = await get('/resource/map/1.swf');
  assert.equal(first.status, 200);
  assert.equal(first.headers['cache-control'], 'no-cache');
  assert.ok(first.headers.etag);
  assert.equal(first.body.length, 8 * 1024 * 1024);
  const again = await get('/resource/map/1.swf', { 'if-none-match': first.headers.etag });
  assert.equal(again.status, 304);
  assert.equal(again.body.length, 0);
  results.push('Unchanged files answer 304 without a body');

  fs.writeFileSync(path.join(root, 'assets/resource/map/1.swf.next'), crypto.randomBytes(1024));
  fs.renameSync(path.join(root, 'assets/resource/map/1.swf.next'), map);
  const changed = await get('/resource/map/1.swf', { 'if-none-match': first.headers.etag });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.length, 1024);
  assert.notEqual(changed.headers.etag, first.headers.etag);
  results.push('A deployed file is served again despite the old ETag');

  const { version } = JSON.parse((await get('/battle-assets-version.json')).body);
  const battle = await get(`/resource/fightResource/pet/swf/1.swf?__battle_v=${version}`);
  assert.equal(battle.headers['cache-control'], 'public, max-age=31536000, immutable');
  results.push('Versioned battle assets keep the immutable policy');

  fs.writeFileSync(map, crypto.randomBytes(8 * 1024 * 1024));
  await new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: '/resource/map/1.swf', headers: { host: `127.0.0.1:${port}` } }, res => {
      res.once('data', () => { req.destroy(); setTimeout(resolve, 300); });
    });
    req.on('error', () => {});
  });
  assert.equal(openFiles(map), 0, 'Aborted download left the file open');
  results.push('An aborted download releases its file');

  assert.equal((await get('/resource/map/2.swf')).status, 500);
  assert.equal((await get('/resource/map/1.swf')).status, 200);
  results.push('An unreadable file answers 500 and the server keeps running');
  console.log('WEB_CACHE_SMOKE=' + JSON.stringify({ passed: results.length, results }));
})().catch(error => { console.error(error, output); process.exitCode = 1; }).finally(() => {
  child.kill(); fs.chmodSync(locked, 0o644); fs.rmSync(root, { recursive: true, force: true });
});
