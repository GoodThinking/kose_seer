"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 玩家基础信息Proto
 * 可在多个协议中复用
 */
class PlayerInfoProto extends BaseProto_1.BaseProto {
    userId = 0;
    nickname = '';
    level = 1;
    exp = 0;
    coins = 0;
    energy = 0;
    constructor() {
        super(0); // 通用Proto不需要cmdId
    }
    serialize() {
        const writer = new utils_1.BufferWriter(100);
        writer.WriteUInt32(this.userId);
        writer.WriteBytes(this.buildString(this.nickname, 20));
        writer.WriteUInt32(this.level);
        writer.WriteUInt32(this.exp);
        writer.WriteUInt32(this.coins);
        writer.WriteUInt32(this.energy);
        return writer.ToBuffer();
    }
}
exports.PlayerInfoProto = PlayerInfoProto;
//# sourceMappingURL=PlayerInfoProto.js.map