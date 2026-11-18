"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeTask96Buffer = DecodeTask96Buffer;
/** Decode KOSE's legacy five-UInt32 storage or canonical twenty-byte progress. */
function DecodeTask96Buffer(buffer) {
    if (!buffer || Object.prototype.hasOwnProperty.call(buffer, 'xinBytes')) {
        throw new Error('Unknown persisted task buffer shape');
    }
    const keys = Object.keys(buffer).filter(key => /^\d+$/.test(key)).sort();
    const legacyKeys = ['0', '1', '2', '3', '4'];
    const progressKeys = Array.from({ length: 20 }, (_, index) => String(index));
    const sortedProgressKeys = [...progressKeys].sort();
    if (!keys.length)
        return new Array(20).fill(0);
    const legacy = keys.length === legacyKeys.length && keys.every((key, index) => key === legacyKeys[index]);
    const progress = keys.length === progressKeys.length &&
        keys.every((key, index) => key === sortedProgressKeys[index]);
    if (legacy) {
        const bytes = [];
        for (let index = 0; index < 5; index++) {
            const value = buffer[index];
            if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
                throw new Error('Invalid legacy task UInt32 buffer');
            }
            const encoded = Buffer.alloc(4);
            encoded.writeUInt32BE(value, 0);
            bytes.push(...encoded);
        }
        return bytes;
    }
    if (progress) {
        const bytes = Array.from({ length: 20 }, (_, index) => buffer[index]);
        if (bytes.some(value => !Number.isInteger(value) || value < 0 || value > 0xff)) {
            throw new Error('Invalid persisted task progress byte');
        }
        return bytes;
    }
    throw new Error('Unknown persisted task buffer shape');
}
//# sourceMappingURL=Task96Buffer.js.map