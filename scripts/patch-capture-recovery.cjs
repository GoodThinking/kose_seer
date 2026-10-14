'use strict';
// Rebuild the pinned Nieo fight module with the rejected-capture UI callback.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const [input, output, java, ffdec] = process.argv.slice(2);
assert(input && output && java && ffdec, 'Usage: node patch-capture-recovery.cjs INPUT OUTPUT JAVA FFDEC_JAR');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const original = fs.readFileSync(input);
assert.equal(hash(original), '8f9827b56a5071b42bebcd455a3c0b7e84e1c0aadd7789c5302588e668ad9893');
assert(!fs.existsSync(output), 'Output already exists');
function tags(raw) {
  const body = raw.toString('ascii', 0, 3) === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  const prefix = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4;
  const result = [{code: -1, hash: hash(body.subarray(0, prefix))}];
  let offset = prefix;
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2;
    let length = header & 63;
    if (length === 63) {length = body.readUInt32LE(offset); offset += 4;}
    assert(offset + length <= body.length);
    result.push({code: header >> 6, hash: hash(body.subarray(offset, offset + length))});
    offset += length;
  }
  return result;
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-capture-'));
try {
  const candidate = path.join(temp, 'PetFightDLL.swf');
  const compile = cp.spawnSync(java, ['-jar', ffdec, '-onerror', 'abort', '-importScript', input, candidate,
    path.join(__dirname, 'client/capture-recovery')], {encoding: 'utf8'});
  assert.equal(compile.status, 0, compile.stderr);
  const bytes = fs.readFileSync(candidate), before = tags(original), after = tags(bytes);
  assert.equal(before.length, after.length);
  const changed = before.flatMap((tag, i) => {
    assert.equal(tag.code, after[i].code);
    return tag.hash === after[i].hash ? [] : [tag.code];
  });
  assert.deepEqual(changed, [82], 'Only one ABC tag may change');
  fs.writeFileSync(output, bytes, {flag: 'wx'});
  process.stdout.write(JSON.stringify({inputSha256: hash(original), outputSha256: hash(bytes),
    unchangedTags: before.length - changed.length, changedABCTags: changed.length}) + '\n');
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
