"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeerMapUserInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 赛尔号地图用户信息
 * 对应前端: com.robot.core.info.UserInfo.setForPeoleInfo
 * 这是一个通用数据结构，用于多个命令的响应中
 */
class SeerMapUserInfoProto extends BaseProto_1.BaseProto {
    // 基本信息
    sysTime = 0; // 系统时间
    userID = 0; // 用户ID
    nick = ''; // 昵称 (16字节)
    color = 0xFFFFFF; // 颜色
    texture = 0; // 纹理
    // VIP信息
    vipFlags = 0; // VIP标志 (bit 0=vip, bit 1=viped)
    vipStage = 0; // VIP阶段
    // 位置和动作
    actionType = 0; // 动作类型 (0=正常, 1=飞行)
    x = 500; // X坐标
    y = 300; // Y坐标
    action = 0; // 动作
    direction = 0; // 方向
    changeShape = 0; // 变身
    // 精灵信息
    spiritTime = 0; // 精灵捕获时间 (catchTime)
    spiritID = 0; // 精灵ID
    petDV = 31; // 精灵DV值
    petShiny = 0; // XIN 异色，来自持久化宠物 shiny
    petSkin = 0; // 精灵皮肤
    fightFlag = 0; // 战斗标志
    // 师徒信息
    teacherID = 0; // 师傅ID
    studentID = 0; // 徒弟ID
    // NoNo信息
    nonoState = 0; // NoNo状态 (bit flags)
    nonoColor = 0; // NoNo颜色
    superNono = 0; // 超级NoNo (0/1)
    playerForm = 0; // 玩家形态
    transTime = 0; // 变身时间
    // 战队信息
    teamId = 0;
    teamCoreCount = 0;
    teamIsShow = 0;
    teamLogoBg = 0;
    teamLogoIcon = 0;
    teamLogoColor = 0;
    teamTxtColor = 0;
    teamLogoWord = ''; // 4字节
    // 服装列表
    clothes = [];
    // 称号
    curTitle = 0;
    constructor() {
        super(0); // 通用Proto不需要cmdId
    }
    serialize(protocol = 'kose') {
        const xin = protocol === 'xin-20261013';
        const writer = new utils_1.BufferWriter(1024);
        // 1. 基本信息
        // XIN 的 MapController/UserListCmdListener 直接从 userID 开始读取。
        if (!xin)
            writer.WriteUInt32(this.sysTime);
        writer.WriteUInt32(this.userID);
        writer.WriteBytes(this.buildString(this.nick, 16));
        writer.WriteUInt32(this.color);
        writer.WriteUInt32(this.texture);
        // 2. VIP信息
        writer.WriteUInt32(this.vipFlags);
        writer.WriteUInt32(this.vipStage);
        // 3. 位置和动作
        writer.WriteUInt32(this.actionType);
        writer.WriteUInt32(this.x);
        writer.WriteUInt32(this.y);
        writer.WriteUInt32(this.action);
        writer.WriteUInt32(this.direction);
        writer.WriteUInt32(this.changeShape);
        // 4. 精灵信息
        writer.WriteUInt32(this.spiritTime);
        writer.WriteUInt32(this.spiritID);
        writer.WriteUInt32(this.petDV);
        if (xin)
            writer.WriteUInt32(this.petShiny);
        writer.WriteUInt32(this.petSkin);
        if (xin) {
            // 尚未建立 KOSE 到 XIN 的成就、坐骑、装饰、特殊属性映射。
            writer.WriteUInt32(0); // achievementsId
            writer.WriteUInt32(0); // petRide
            writer.WriteUInt32(0); // petOrnament
            writer.WriteUInt32(0); // petAbilityType
        }
        writer.WriteUInt32(this.fightFlag);
        // 5. 师徒信息
        writer.WriteUInt32(this.teacherID);
        writer.WriteUInt32(this.studentID);
        // 6. NoNo信息 - nonoState需要作为bit flags (32位)
        // bit 0-31对应32个NoNo状态位
        writer.WriteUInt32(this.nonoState || 0);
        writer.WriteUInt32(this.nonoColor);
        writer.WriteUInt32(this.superNono);
        writer.WriteUInt32(this.playerForm);
        writer.WriteUInt32(this.transTime);
        // 7. 战队信息
        writer.WriteUInt32(this.teamId);
        writer.WriteUInt32(this.teamCoreCount);
        writer.WriteUInt32(this.teamIsShow);
        if (xin) {
            // UserInfo.setForPeoleInfo 使用四个大端 readShort。
            const logo = Buffer.alloc(8);
            logo.writeInt16BE(this.teamLogoBg, 0);
            logo.writeInt16BE(this.teamLogoIcon, 2);
            logo.writeInt16BE(this.teamLogoColor, 4);
            logo.writeInt16BE(this.teamTxtColor, 6);
            writer.WriteBytes(logo);
        }
        else {
            writer.WriteUInt16(this.teamLogoBg);
            writer.WriteUInt16(this.teamLogoIcon);
            writer.WriteUInt16(this.teamLogoColor);
            writer.WriteUInt16(this.teamTxtColor);
        }
        writer.WriteBytes(this.buildString(this.teamLogoWord, 4));
        // 8. 服装列表
        writer.WriteUInt32(this.clothes.length);
        for (const cloth of this.clothes) {
            writer.WriteUInt32(cloth.id);
            writer.WriteUInt32(cloth.level);
        }
        // 9. XIN 的列表探测器优先读取完整尾部；每条记录都写两个字段。
        if (xin) {
            writer.WriteUInt32(0); // goldenName
            writer.WriteUInt32(0); // nonoChangeToPet
        }
        else {
            writer.WriteUInt32(this.curTitle);
        }
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setUserID(value) {
        this.userID = value;
        return this;
    }
    setNick(value) {
        this.nick = value;
        return this;
    }
    setColor(value) {
        this.color = value;
        return this;
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    setVipFlags(value) {
        this.vipFlags = value;
        return this;
    }
    setNonoState(value) {
        this.nonoState = value;
        return this;
    }
    setClothes(clothes) {
        this.clothes = clothes;
        return this;
    }
}
exports.SeerMapUserInfoProto = SeerMapUserInfoProto;
//# sourceMappingURL=SeerMapUserInfoProto.js.map