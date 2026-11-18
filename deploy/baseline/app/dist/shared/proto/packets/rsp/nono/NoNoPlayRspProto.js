"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoPlayRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9013 NONO_PLAY] NoNo 玩耍响应
 *
 * 玩耍会增加 NoNo 的心情值
 */
class NoNoPlayRspProto extends BaseProto_1.BaseProto {
    itemId = 0; // 物品ID（占位）
    power = 0; // 体力
    ai = 0; // AI (2字节)
    mate = 0; // 心情
    iq = 0; // 智商
    constructor() {
        super(CommandID_1.CommandID.NONO_PLAY);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(64);
        // result (4 bytes)
        writer.WriteUInt32(this.result);
        // itemId (4 bytes)
        writer.WriteUInt32(this.itemId);
        // power (4 bytes)
        writer.WriteUInt32(this.power);
        // ai (2 bytes) - 注意这里是 UInt16
        writer.WriteUInt16(this.ai);
        // mate (4 bytes)
        writer.WriteUInt32(this.mate);
        // iq (4 bytes)
        writer.WriteUInt32(this.iq);
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setPower(value) {
        this.power = value;
        return this;
    }
    setAi(value) {
        this.ai = value;
        return this;
    }
    setMate(value) {
        this.mate = value;
        return this;
    }
    setIq(value) {
        this.iq = value;
        return this;
    }
}
exports.NoNoPlayRspProto = NoNoPlayRspProto;
//# sourceMappingURL=NoNoPlayRspProto.js.map