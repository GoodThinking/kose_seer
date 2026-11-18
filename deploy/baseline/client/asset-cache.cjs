'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const commit = '29bf4ac9db970cec3e98cd1a64f233600c1ad162';
const tree = JSON.parse(fs.readFileSync(path.join(__dirname, 'resource-tree.json')));
if (tree.sha !== commit) throw new Error('Unexpected resource commit');
const entries = new Map(tree.tree.filter(e => e.type === 'blob').map(e => [e.path, e]));
const pending = new Map();
const manifestPath = path.join(__dirname, 'download-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath));
module.exports = async function fetchAsset(relative) {
  const source = 'gameres/root/' + relative;
  const entry = entries.get(source);
  if (!entry) return null;
  if (pending.has(source)) return pending.get(source);
  const task = (async () => {
    const response = await fetch(`https://raw.githubusercontent.com/hex3f/Reseer/${commit}/${source.split('/').map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}: ${relative}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (bytes.length !== entry.size || blob !== entry.sha) throw new Error(`Asset checksum failed: ${relative}`);
    const target = path.join(__dirname, 'assets', relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    manifest[relative] = {path: relative, size: bytes.length, git_blob: blob, sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log('VERIFIED', relative, bytes.length);
    return target;
  })();
  pending.set(source, task);
  try { return await task; } finally { pending.delete(source); }
};
