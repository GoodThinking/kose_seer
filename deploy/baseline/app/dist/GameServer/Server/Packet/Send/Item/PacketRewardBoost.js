"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketRewardBoost = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
/** Fixed Nieo private extension: ordered uint32 words, big endian. */
class PacketRewardBoost extends BaseProto_1.BaseProto {
    data;
    constructor(command, words) {
        super(command);
        this.data = Buffer.alloc(words.length * 4);
        words.forEach((value, index) => this.data.writeUInt32BE(value, index * 4));
    }
    serialize() { return this.data; }
}
exports.PacketRewardBoost = PacketRewardBoost;
//# sourceMappingURL=PacketRewardBoost.js.map