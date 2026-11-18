"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFightLevel = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
/** 2414 / 2415：当前层 + 这一层要出现的精灵编号。 */
class PacketFightLevel extends BaseProto_1.BaseProto {
    body;
    constructor(cmdId, level, bosses) {
        super(cmdId);
        const body = Buffer.alloc(8 + bosses.length * 4);
        body.writeUInt32BE(level, 0);
        body.writeUInt32BE(bosses.length, 4);
        bosses.forEach((id, index) => body.writeUInt32BE(id, 8 + index * 4));
        this.body = body;
    }
    serialize() {
        return this.body;
    }
}
exports.PacketFightLevel = PacketFightLevel;
//# sourceMappingURL=PacketFightLevel.js.map