'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { execFileSync } = require('node:child_process');
const { values } = parseArgs({ options: { 'client-dir': { type: 'string' }, out: { type: 'string' } } });
if (!values['client-dir'] || !values.out) throw new Error('Required: --client-dir <current-client> --out <release>');
const before = {
  'server.cjs': 'f952c9754f491561efa8574783ca73e4106969d0ba8d03fcd5c2b206a84db7e9',
  'index.html': 'b3fe0c0d1c027c34202e2926f912a1bef1ba8f3aacb05013fb40fd3baeb418cf',
  'battle-asset-cache.cjs': null
};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = path.join(__dirname, '../compat/client-patches/versioned-assets');
const files = [];
for (const [name, expected] of Object.entries(before)) {
  const current = path.join(values['client-dir'], name);
  const actual = fs.existsSync(current) ? sha(fs.readFileSync(current)) : null;
  if (actual !== expected) throw new Error('Client baseline changed: ' + name);
  if (name.endsWith('.cjs')) execFileSync(process.execPath, ['--check', path.join(source, name)]);
  const bytes = fs.readFileSync(path.join(source, name));
  const relative = 'client/' + name;
  const destination = path.join(values.out, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  files.push({ path: relative, before: expected, after: sha(bytes), bytes: bytes.length });
}
fs.writeFileSync(path.join(values.out, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
console.log(JSON.stringify({ output: path.resolve(values.out), files }, null, 2));
