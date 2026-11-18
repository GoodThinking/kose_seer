"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 8002 SYSTEM_MESSAGE] 系统消息响应
 *
 * 用途：
 * 1. 系统通知消息
 * 2. NPC 消息
 * 3. GM 操作通知
 */
class SystemMessageRspProto extends BaseProto_1.BaseProto {
    type = 0; // 消息类型 (0 = 普通消息)
    npc = 0; // NPC ID (0 = 系统消息, 1-8 = 各种NPC)
    msgTime = 0; // 时间戳（秒）
    msg = ''; // 消息内容
    constructor(message = '', npcId = 0, type = 0) {
        super(CommandID_1.CommandID.SYSTEM_MESSAGE);
        this.msg = message;
        this.npc = npcId;
        this.type = type;
        this.msgTime = Math.floor(Date.now() / 1000);
    }
    serialize() {
        const msgBuffer = Buffer.from(this.msg, 'utf8');
        const msgLen = msgBuffer.length;
        const writer = new utils_1.BufferWriter(12 + msgLen);
        writer.WriteUInt16(this.type); // type (2 bytes)
        writer.WriteUInt16(this.npc); // npc (2 bytes)
        writer.WriteUInt32(this.msgTime); // msgTime (4 bytes)
        writer.WriteUInt32(msgLen); // msgLen (4 bytes)
        writer.WriteBytes(msgBuffer); // msg (msgLen bytes)
        return writer.ToBuffer();
    }
    // 链式调用
    setType(value) {
        this.type = value;
        return this;
    }
    setNpc(value) {
        this.npc = value;
        return this;
    }
    setMsgTime(value) {
        this.msgTime = value;
        return this;
    }
    setMessage(value) {
        this.msg = value;
        return this;
    }
}
exports.SystemMessageRspProto = SystemMessageRspProto;
//# sourceMappingURL=SystemMessageRspProto.js.map