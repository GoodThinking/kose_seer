// Fixed Nieo ExpAdmPanel: fit the full ten-digit balance in the existing text box.
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

function patch(input) {
  const signature = input.subarray(0, 3).toString();
  if (signature !== 'CWS' && signature !== 'FWS') throw new Error('Unsupported SWF signature');
  const body = signature === 'CWS' ? zlib.inflateSync(input.subarray(8)) : Buffer.from(input.subarray(8));
  if (body.length + 8 !== input.readUInt32LE(4)) throw new Error('SWF length mismatch');
  const rectLength = offset => Math.ceil((5 + 4 * (body[offset] >> 3)) / 8);
  let offset = rectLength(0) + 4, changed = 0;
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2;
    const code = header >> 6;
    let length = header & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    if (offset + length > body.length) throw new Error('Invalid SWF tag length');
    if (code === 37 && body.readUInt16LE(offset) === 24) {
      const flagsOffset = offset + 2 + rectLength(offset + 2);
      const flags = body.readUInt16BE(flagsOffset);
      if (!(flags & 0x100) || (flags & 0x80)) throw new Error('Unexpected balance font format');
      const heightOffset = flagsOffset + 4;
      if (body.readUInt16LE(heightOffset) !== 280) throw new Error('Balance font baseline changed');
      body.writeUInt16LE(240, heightOffset); changed++;
    }
    offset += length;
    if (code === 0) break;
  }
  if (changed !== 1) throw new Error('Expected one balance text definition');
  return Buffer.concat([input.subarray(0, 8), signature === 'CWS' ? zlib.deflateSync(body) : body]);
}

if (require.main === module) {
  const [, , source, target] = process.argv;
  if (!source || !target) throw new Error('Usage: node patch-exp-panel.cjs source.swf target.swf');
  const input = fs.readFileSync(source);
  if (crypto.createHash('sha256').update(input).digest('hex') !== 'dc33f997cf21acb7adf337d5b97de8f5d6e46aa09c67a3a801bc2ae98f49af8e') {
    throw new Error('Fixed Nieo ExpAdmPanel input hash mismatch');
  }
  fs.writeFileSync(target, patch(input), {flag: 'wx'});
}
module.exports = {patch};
