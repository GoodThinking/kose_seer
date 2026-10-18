'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { execFileSync } = require('node:child_process');
const { values } = parseArgs({ options: { 'client-dir': { type: 'string' }, out: { type: 'string' } } });
if (!values['client-dir'] || !values.out) throw new Error('Required: --client-dir <current-client> --out <release>');
// R51's web server is the only accepted baseline; the cache helper and page stay as deployed.
const expected = {
  'server.cjs': 'c05083eb23a32e25cd127d0bc75404fb87297ccc7ae8753afbf9f12cc944e58b',
  'battle-asset-cache.cjs': '0faafed90a0ba0e314a2a5fd983586692cc9e6e0dc6843087c00e4a3c764b015',
};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [name, hash] of Object.entries(expected)) {
  if (sha(fs.readFileSync(path.join(values['client-dir'], name))) !== hash) throw new Error('Client baseline changed: ' + name);
}
const source = path.join(__dirname, '../compat/client-patches/versioned-assets/server.cjs');
execFileSync(process.execPath, ['--check', source]);
const bytes = fs.readFileSync(source);
const destination = path.join(values.out, 'client/server.cjs');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, bytes);
const files = [{ path: 'client/server.cjs', before: expected['server.cjs'], after: sha(bytes) }];
fs.writeFileSync(path.join(values.out, 'manifest.json'), JSON.stringify({ files, restartWeb: true }, null, 2) + '\n');
console.log(JSON.stringify({ files }));
