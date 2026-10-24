'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const NONO_CLASS = 'com/robot/core/mode/NonoModel';
const nonoVisibilityPatch = {
    class: NONO_CLASS,
    beforeSha256: '3e92c76e76a40a4e73ac94d1f1018693fe7d246afb92f48998a8260ddbd2087f',
    afterSha256: '8376551d129ea878321415c1ad5be9b94f4a92fdc92bec317575d23e6088cbb6',
    payloadOpcodeOffset: 5298,
    beforeCode: 'd030d0d1612d47',
    afterCode: 'd030d0d1052d47'
};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function fixNonoVisibleAbc(payload) {
    // Original visible setter recurses through this.visible. Dispatch to super.visible instead.
    // Pin the entire DoABC payload: do not apply this offset to a different client class.
    assert.equal(sha(payload), nonoVisibilityPatch.beforeSha256, 'NonoModel changed; reconcile visibility setter before patching');
    const offset = nonoVisibilityPatch.payloadOpcodeOffset;
    assert.equal(payload.subarray(offset - 4, offset + 3).toString('hex'), nonoVisibilityPatch.beforeCode);
    const fixed = Buffer.from(payload);
    fixed[offset] = 0x05; // AVM2 setsuper, replacing setproperty (0x61); operand and stack shape stay unchanged.
    assert.equal(sha(fixed), nonoVisibilityPatch.afterSha256);
    return fixed;
}

function fixCoreNonoVisibility(raw) {
    assert.equal(raw.subarray(0, 3).toString(), 'CWS', 'Expected compressed client Core');
    const body = zlib.inflateSync(raw.subarray(8));
    assert.equal(body.length + 8, raw.readUInt32LE(4), 'Invalid SWF length');
    let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
    let matches = 0;
    while (offset < body.length) {
        const short = body.readUInt16LE(offset); offset += 2;
        const code = short >> 6;
        let size = short & 63;
        if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
        assert.ok(offset + size <= body.length, 'Truncated SWF tag');
        const payload = body.subarray(offset, offset + size);
        if (code === 82) {
            const end = payload.indexOf(0, 4);
            assert.ok(end >= 4, 'Invalid DoABC name');
            if (payload.subarray(4, end).toString() === NONO_CLASS) {
                fixNonoVisibleAbc(payload).copy(body, offset);
                matches++;
            }
        }
        offset += size;
        if (code === 0) break;
    }
    assert.equal(offset, body.length, 'Unexpected trailing SWF data');
    assert.equal(matches, 1, 'Expected exactly one NonoModel class');
    return Buffer.concat([raw.subarray(0, 8), zlib.deflateSync(body, { level: 9 })]);
}

module.exports = { NONO_CLASS, nonoVisibilityPatch, fixNonoVisibleAbc, fixCoreNonoVisibility };

if (require.main === module) {
    const { values } = require('node:util').parseArgs({ options: { input: { type: 'string' }, output: { type: 'string' } } });
    assert.ok(values.input && values.output, 'Usage: node scripts/fix-nono-visibility.cjs --input <current Core.swf> --output <new Core.swf>');
    const original = fs.readFileSync(values.input);
    const fixed = fixCoreNonoVisibility(original);
    fs.mkdirSync(path.dirname(path.resolve(values.output)), { recursive: true });
    fs.writeFileSync(values.output, fixed, { flag: 'wx' });
    console.log(JSON.stringify({ beforeCoreSha256: sha(original), afterCoreSha256: sha(fixed), binaryPatch: nonoVisibilityPatch }, null, 2));
}
