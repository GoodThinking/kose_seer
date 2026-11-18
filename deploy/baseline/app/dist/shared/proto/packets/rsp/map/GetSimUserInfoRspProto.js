"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSimUserInfoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取简单用户信息响应
 * CMD: 2051 GET_SIM_USERINFO
 */
class GetSimUserInfoRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    nick = '';
    color = 0;
    texture = 0;
    vip = 0;
    status = 0;
    mapType = 0;
    mapId = 0;
    isCanBeTeacher = 0;
    teacherID = 0;
    studentID = 0;
    graduationCount = 0;
    vipLevel = 0;
    teamId = 0;
    teamIsShow = 0;
    clothes = [];
    constructor() {
        super(CommandID_1.CommandID.GET_SIM_USERINFO);
    }
    // 链式调用方法
    setUserId(value) { this.userId = value; return this; }
    setNick(value) { this.nick = value; return this; }
    setColor(value) { this.color = value; return this; }
    setTexture(value) { this.texture = value; return this; }
    setVip(value) { this.vip = value; return this; }
    setStatus(value) { this.status = value; return this; }
    setMapType(value) { this.mapType = value; return this; }
    setMapId(value) { this.mapId = value; return this; }
    setIsCanBeTeacher(value) { this.isCanBeTeacher = value; return this; }
    setTeacherID(value) { this.teacherID = value; return this; }
    setStudentID(value) { this.studentID = value; return this; }
    setGraduationCount(value) { this.graduationCount = value; return this; }
    setVipLevel(value) { this.vipLevel = value; return this; }
    setTeamId(value) { this.teamId = value; return this; }
    setTeamIsShow(value) { this.teamIsShow = value; return this; }
    setClothes(value) { this.clothes = value; return this; }
    deserialize(buffer) {
        let offset = 0;
        this.userId = buffer.readUInt32BE(offset);
        offset += 4;
        this.nick = buffer.toString('utf8', offset, offset + 16).replace(/\0/g, '');
        offset += 16;
        this.color = buffer.readUInt32BE(offset);
        offset += 4;
        this.texture = buffer.readUInt32BE(offset);
        offset += 4;
        this.vip = buffer.readUInt32BE(offset);
        offset += 4;
        this.status = buffer.readUInt32BE(offset);
        offset += 4;
        this.mapType = buffer.readUInt32BE(offset);
        offset += 4;
        this.mapId = buffer.readUInt32BE(offset);
        offset += 4;
        this.isCanBeTeacher = buffer.readUInt32BE(offset);
        offset += 4;
        this.teacherID = buffer.readUInt32BE(offset);
        offset += 4;
        this.studentID = buffer.readUInt32BE(offset);
        offset += 4;
        this.graduationCount = buffer.readUInt32BE(offset);
        offset += 4;
        this.vipLevel = buffer.readUInt32BE(offset);
        offset += 4;
        this.teamId = buffer.readUInt32BE(offset);
        offset += 4;
        this.teamIsShow = buffer.readUInt32BE(offset);
        offset += 4;
        const clothCount = buffer.readUInt32BE(offset);
        offset += 4;
        this.clothes = [];
        for (let i = 0; i < clothCount; i++) {
            const id = buffer.readUInt32BE(offset);
            offset += 4;
            const level = buffer.readUInt32BE(offset);
            offset += 4;
            this.clothes.push({ id, level });
        }
    }
    serialize() {
        const nickBuf = Buffer.alloc(16);
        nickBuf.write(this.nick, 0, 16, 'utf8');
        // 计算总大小：
        // userId(4) + nick(16) + color(4) + texture(4) + vip(4) + status(4) + 
        // mapType(4) + mapId(4) + isCanBeTeacher(4) + teacherID(4) + studentID(4) + 
        // graduationCount(4) + vipLevel(4) + teamId(4) + teamIsShow(4) + clothCount(4) = 76字节
        // + clothes数组 (每个8字节)
        const clothBufSize = 4 + this.clothes.length * 8;
        const buffer = Buffer.alloc(76 + clothBufSize);
        let offset = 0;
        buffer.writeUInt32BE(this.userId, offset);
        offset += 4;
        nickBuf.copy(buffer, offset);
        offset += 16;
        buffer.writeUInt32BE(this.color, offset);
        offset += 4;
        buffer.writeUInt32BE(this.texture, offset);
        offset += 4;
        buffer.writeUInt32BE(this.vip, offset);
        offset += 4;
        buffer.writeUInt32BE(this.status, offset);
        offset += 4;
        buffer.writeUInt32BE(this.mapType, offset);
        offset += 4;
        buffer.writeUInt32BE(this.mapId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.isCanBeTeacher, offset);
        offset += 4;
        buffer.writeUInt32BE(this.teacherID, offset);
        offset += 4;
        buffer.writeUInt32BE(this.studentID, offset);
        offset += 4;
        buffer.writeUInt32BE(this.graduationCount, offset);
        offset += 4;
        buffer.writeUInt32BE(this.vipLevel, offset);
        offset += 4;
        buffer.writeUInt32BE(this.teamId, offset);
        offset += 4;
        buffer.writeUInt32BE(this.teamIsShow, offset);
        offset += 4;
        buffer.writeUInt32BE(this.clothes.length, offset);
        offset += 4;
        for (const cloth of this.clothes) {
            buffer.writeUInt32BE(cloth.id, offset);
            offset += 4;
            buffer.writeUInt32BE(cloth.level, offset);
            offset += 4;
        }
        return buffer;
    }
}
exports.GetSimUserInfoRspProto = GetSimUserInfoRspProto;
//# sourceMappingURL=GetSimUserInfoRspProto.js.map