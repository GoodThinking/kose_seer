"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMoreUserInfoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取详细用户信息响应
 * CMD: 2052 GET_MORE_USERINFO
 */
class GetMoreUserInfoRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    nick = '';
    regTime = 0;
    petAllNum = 0;
    petMaxLev = 0;
    bossAchievement = '';
    graduationCount = 0;
    monKingWin = 0;
    messWin = 0;
    maxStage = 0;
    maxArenaWins = 0;
    curTitle = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_MORE_USERINFO);
    }
    // 链式调用方法
    setUserId(value) { this.userId = value; return this; }
    setNick(value) { this.nick = value; return this; }
    setRegTime(value) { this.regTime = value; return this; }
    setPetAllNum(value) { this.petAllNum = value; return this; }
    setPetMaxLev(value) { this.petMaxLev = value; return this; }
    setBossAchievement(value) { this.bossAchievement = value; return this; }
    setGraduationCount(value) { this.graduationCount = value; return this; }
    setMonKingWin(value) { this.monKingWin = value; return this; }
    setMessWin(value) { this.messWin = value; return this; }
    setMaxStage(value) { this.maxStage = value; return this; }
    setMaxArenaWins(value) { this.maxArenaWins = value; return this; }
    setCurTitle(value) { this.curTitle = value; return this; }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.nick = buffer.toString('utf8', offset, offset + 16).replace(/\0/g, '');
        offset += 16;
        this.regTime = buffer.readUInt32BE(offset);
        offset += 4;
        this.petAllNum = buffer.readUInt32BE(offset);
        offset += 4;
        this.petMaxLev = buffer.readUInt32BE(offset);
        offset += 4;
        this.bossAchievement = buffer.toString('utf8', offset, offset + 200).replace(/\0/g, '');
        offset += 200;
        this.graduationCount = buffer.readUInt32BE(offset);
        offset += 4;
        this.monKingWin = buffer.readUInt32BE(offset);
        offset += 4;
        this.messWin = buffer.readUInt32BE(offset);
        offset += 4;
        this.maxStage = buffer.readUInt32BE(offset);
        offset += 4;
        this.maxArenaWins = buffer.readUInt32BE(offset);
        offset += 4;
        this.curTitle = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(260);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        const nickBuf = Buffer.alloc(16);
        nickBuf.write(this.nick, 0, 16, 'utf8');
        nickBuf.copy(buffer, offset);
        offset += 16;
        buffer.writeUInt32BE(this.regTime, offset);
        offset += 4;
        buffer.writeUInt32BE(this.petAllNum, offset);
        offset += 4;
        buffer.writeUInt32BE(this.petMaxLev, offset);
        offset += 4;
        const bossBuf = Buffer.alloc(200);
        bossBuf.write(this.bossAchievement, 0, 200, 'utf8');
        bossBuf.copy(buffer, offset);
        offset += 200;
        buffer.writeUInt32BE(this.graduationCount, offset);
        offset += 4;
        buffer.writeUInt32BE(this.monKingWin, offset);
        offset += 4;
        buffer.writeUInt32BE(this.messWin, offset);
        offset += 4;
        buffer.writeUInt32BE(this.maxStage, offset);
        offset += 4;
        buffer.writeUInt32BE(this.maxArenaWins, offset);
        offset += 4;
        buffer.writeUInt32BE(this.curTitle, offset);
        offset += 4;
        return buffer;
    }
}
exports.GetMoreUserInfoRspProto = GetMoreUserInfoRspProto;
//# sourceMappingURL=GetMoreUserInfoRspProto.js.map