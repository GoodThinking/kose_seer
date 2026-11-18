"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewSessionKey = NewSessionKey;
exports.SessionKeyToWire = SessionKeyToWire;
exports.SessionKeyFromWire = SessionKeyFromWire;
const crypto_1 = require("crypto");
/** 16 opaque wire bytes, persisted losslessly as canonical 32-character hex. */
function NewSessionKey() { return (0, crypto_1.randomBytes)(16).toString('hex'); }
function SessionKeyToWire(key) {
    if (typeof key !== 'string' || !/^[0-9a-f]{32}$/.test(key))
        throw new Error('Invalid stored session key');
    return Buffer.from(key, 'hex');
}
function SessionKeyFromWire(wire) {
    if (!Buffer.isBuffer(wire) || wire.length !== 16)
        throw new Error('Invalid session wire length');
    return wire.toString('hex');
}
//# sourceMappingURL=SessionToken.js.map