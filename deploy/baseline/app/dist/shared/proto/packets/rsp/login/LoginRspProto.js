"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应
 *
 * 完整协议格式（基于 UserInfo.setForLoginInfo）:
 * - userID (4)
 * - regTime (4)
 * - nick (16 UTF bytes)
 * - vipFlags (4): bit0=vip, bit1=viped
 * - dsFlag (4)
 * - color (4)
 * - texture (4)
 * - energy (4)
 * - coins (4)
 * - fightBadge (4)
 * - mapID (4)
 * - posX (4)
 * - posY (4)
 * - timeToday (4)
 * - timeLimit (4)
 * - isClothHalfDay (1)
 * - isRoomHalfDay (1)
 * - iFortressHalfDay (1)
 * - isHQHalfDay (1)
 * - loginCnt (4)
 * - inviter (4)
 * - newInviteeCnt (4)
 * - vipLevel (4)
 * - vipValue (4)
 * - vipStage (4)
 * - autoCharge (4)
 * - vipEndTime (4)
 * - freshManBonus (4)
 * - nonoChipList (80 bytes)
 * - dailyResArr (50 bytes)
 * - teacherID (4)
 * - studentID (4)
 * - graduationCount (4)
 * - maxPuniLv (4)
 * - petMaxLev (4)
 * - petAllNum (4)
 * - monKingWin (4)
 * - curStage (4)
 * - maxStage (4)
 * - curFreshStage (4)
 * - maxFreshStage (4)
 * - maxArenaWins (4)
 * - twoTimes (4)
 * - threeTimes (4)
 * - autoFight (4)
 * - autoFightTimes (4)
 * - energyTimes (4)
 * - learnTimes (4)
 * - monBtlMedal (4)
 * - recordCnt (4)
 * - obtainTm (4)
 * - soulBeadItemID (4)
 * - expireTm (4)
 * - fuseTimes (4)
 * - hasNono (4)
 * - superNono (4)
 * - nonoState (4): 32 bits
 * - nonoColor (4)
 * - nonoNick (16 UTF bytes)
 * - teamInfo (variable)
 * - teamPKInfo (variable)
 * - padding (1)
 * - badge (4)
 * - reserved (27 bytes)
 */
class LoginRspProto extends BaseProto_1.BaseProto {
    // 基础信息
    userId = 0;
    regTime = 0;
    nickname = '';
    vip = false;
    viped = false;
    dsFlag = 0;
    color = 0;
    texture = 0;
    energy = 0;
    coins = 0;
    fightBadge = 0;
    mapId = 0;
    posX = 0;
    posY = 0;
    timeToday = 0;
    timeLimit = 0;
    isClothHalfDay = false;
    isRoomHalfDay = false;
    iFortressHalfDay = false;
    isHQHalfDay = false;
    loginCnt = 0;
    inviter = 0;
    newInviteeCnt = 0;
    vipLevel = 0;
    vipValue = 0;
    vipStage = 1;
    autoCharge = 0;
    vipEndTime = 0;
    freshManBonus = 0;
    nonoChipList = new Array(80).fill(false);
    dailyResArr = new Array(50).fill(0);
    teacherID = 0;
    studentID = 0;
    graduationCount = 0;
    maxPuniLv = 0;
    petMaxLev = 0;
    petAllNum = 0;
    monKingWin = 0;
    curStage = 0;
    maxStage = 0;
    curFreshStage = 0;
    maxFreshStage = 0;
    maxArenaWins = 0;
    twoTimes = 0;
    threeTimes = 0;
    autoFight = 0;
    autoFightTimes = 0;
    energyTimes = 0;
    learnTimes = 0;
    monBtlMedal = 0;
    recordCnt = 0;
    obtainTm = 0;
    soulBeadItemID = 0;
    expireTm = 0;
    fuseTimes = 0;
    hasNono = false;
    superNono = false;
    nonoState = 0;
    nonoColor = 0;
    nonoNick = '';
    badge = 0;
    // 任务列表 (500个任务状态)
    taskList = new Array(500).fill(0);
    // 精灵列表
    petList = [];
    // 服装列表
    clothList = [];
    // 当前称号
    curTitle = 0;
    // Boss成就列表 (200个)
    bossAchievement = new Array(200).fill(false);
    // Extra XIN records have no persisted KOSE equivalent yet.
    bufferRecordArr = new Array(200).fill(0);
    curKingStage = 0;
    maxKingStage = 0;
    maxKingHeroStage = 0;
    serverID = 0;
    constructor() {
        super(CommandID_1.CommandID.LOGIN_IN);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(2048);
        // 基础信息
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.regTime);
        writer.WriteBytes(this.buildString(this.nickname, 16));
        // VIP flags (bit0=vip, bit1=viped)
        let vipFlags = 0;
        if (this.vip)
            vipFlags |= 1;
        if (this.viped)
            vipFlags |= 2;
        writer.WriteUInt32(vipFlags);
        writer.WriteUInt32(this.dsFlag);
        writer.WriteUInt32(this.color);
        writer.WriteUInt32(this.texture);
        writer.WriteUInt32(this.energy);
        writer.WriteUInt32(this.coins);
        writer.WriteUInt32(this.fightBadge);
        writer.WriteUInt32(this.mapId);
        writer.WriteUInt32(this.posX);
        writer.WriteUInt32(this.posY);
        writer.WriteUInt32(this.timeToday);
        writer.WriteUInt32(this.timeLimit);
        writer.WriteUInt8(this.isClothHalfDay ? 1 : 0);
        writer.WriteUInt8(this.isRoomHalfDay ? 1 : 0);
        writer.WriteUInt8(this.iFortressHalfDay ? 1 : 0);
        writer.WriteUInt8(this.isHQHalfDay ? 1 : 0);
        writer.WriteUInt32(this.loginCnt);
        writer.WriteUInt32(this.inviter);
        writer.WriteUInt32(this.newInviteeCnt);
        writer.WriteUInt32(this.vipLevel);
        writer.WriteUInt32(this.vipValue);
        writer.WriteUInt32(this.vipStage);
        writer.WriteUInt32(this.autoCharge);
        writer.WriteUInt32(this.vipEndTime);
        writer.WriteUInt32(this.freshManBonus);
        // nonoChipList (80 bytes)
        for (let i = 0; i < 80; i++) {
            writer.WriteUInt8(this.nonoChipList[i] ? 1 : 0);
        }
        // dailyResArr (50 bytes)
        for (let i = 0; i < 50; i++) {
            writer.WriteUInt8(this.dailyResArr[i]);
        }
        if (protocol === 'xin-20261013') {
            for (let i = 0; i < 200; i++)
                writer.WriteUInt8(this.bufferRecordArr[i] ?? 0);
        }
        writer.WriteUInt32(this.teacherID);
        writer.WriteUInt32(this.studentID);
        writer.WriteUInt32(this.graduationCount);
        writer.WriteUInt32(this.maxPuniLv);
        writer.WriteUInt32(this.petMaxLev);
        writer.WriteUInt32(this.petAllNum);
        writer.WriteUInt32(this.monKingWin);
        writer.WriteUInt32(this.curStage);
        writer.WriteUInt32(this.maxStage);
        writer.WriteUInt32(this.curFreshStage);
        writer.WriteUInt32(this.maxFreshStage);
        if (protocol === 'xin-20261013') {
            writer.WriteUInt32(this.curKingStage);
            writer.WriteUInt32(this.maxKingStage);
            writer.WriteUInt32(this.maxKingHeroStage);
        }
        writer.WriteUInt32(this.maxArenaWins);
        writer.WriteUInt32(this.twoTimes);
        writer.WriteUInt32(this.threeTimes);
        writer.WriteUInt32(this.autoFight);
        writer.WriteUInt32(this.autoFightTimes);
        writer.WriteUInt32(this.energyTimes);
        writer.WriteUInt32(this.learnTimes);
        writer.WriteUInt32(this.monBtlMedal);
        writer.WriteUInt32(this.recordCnt);
        writer.WriteUInt32(this.obtainTm);
        writer.WriteUInt32(this.soulBeadItemID);
        writer.WriteUInt32(this.expireTm);
        writer.WriteUInt32(this.fuseTimes);
        writer.WriteUInt32(this.hasNono ? 1 : 0);
        writer.WriteUInt32(this.superNono ? 1 : 0);
        writer.WriteUInt32(this.nonoState);
        writer.WriteUInt32(this.nonoColor);
        writer.WriteBytes(this.buildString(this.nonoNick, 16));
        // teamInfo (24 bytes: 6 x uint32)
        writer.WriteUInt32(0); // id
        writer.WriteUInt32(0); // priv
        writer.WriteUInt32(0); // superCore
        writer.WriteUInt32(0); // isShow
        writer.WriteUInt32(0); // allContribution
        writer.WriteUInt32(0); // canExContribution
        // teamPKInfo (8 bytes: 2 x uint32)
        writer.WriteUInt32(0); // groupID
        writer.WriteUInt32(0); // homeTeamID
        // padding
        writer.WriteUInt8(0);
        // badge
        writer.WriteUInt32(this.badge);
        // reserved (27 bytes)
        writer.WriteBytes(Buffer.alloc(27));
        const baseInfoSize = writer.ToBuffer().length;
        console.log(`[LoginRspProto] 基础信息大小: ${baseInfoSize} bytes`);
        // ========== 任务列表 (500 bytes) ==========
        // TasksManager.taskList - 每个任务1字节状态
        for (let i = 0; i < 500; i++) {
            writer.WriteUInt8(this.taskList[i] || 0);
        }
        console.log(`[LoginRspProto] 任务列表后大小: ${writer.ToBuffer().length} bytes (应该是 ${baseInfoSize + 500})`);
        // ========== 精灵数据 ==========
        // petNum (4 bytes)
        const petCount = this.petList?.length || 0;
        writer.WriteUInt32(petCount);
        console.log(`[LoginRspProto] 精灵数量: ${petCount}`);
        // PetManager.initData - 如果 petNum > 0，写入精灵数据
        if (petCount > 0 && this.petList) {
            for (let i = 0; i < this.petList.length; i++) {
                const pet = this.petList[i];
                const beforeSize = writer.ToBuffer().length;
                // 写入完整的精灵信息（使用 PetInfoProto 的简化版本）
                const petBytes = pet.serialize(protocol);
                writer.WriteBytes(petBytes);
                const afterSize = writer.ToBuffer().length;
                console.log(`[LoginRspProto] 精灵 ${i + 1}/${petCount}: ${petBytes.length} bytes (总大小: ${afterSize})`);
            }
        }
        // ========== 服装数据 ==========
        // clothes count (4 bytes)
        const clothCount = this.clothList?.length || 0;
        writer.WriteUInt32(clothCount);
        console.log(`[LoginRspProto] 服装数量: ${clothCount}`);
        // clothes data - 每个服装 8 bytes (id + level)
        if (clothCount > 0 && this.clothList) {
            for (let i = 0; i < this.clothList.length; i++) {
                const cloth = this.clothList[i];
                writer.WriteUInt32(cloth.id);
                writer.WriteUInt32(cloth.level || 0);
                console.log(`[LoginRspProto] 服装 ${i + 1}/${clothCount}: id=${cloth.id}, level=${cloth.level || 0}`);
            }
        }
        if (protocol === 'xin-20261013') {
            // Achievement title IDs are not yet mapped to KOSE curTitle.
            writer.WriteUInt32(0);
            writer.WriteUInt32(this.serverID);
            // ignored word, goldenName, totalAchieve, achieRank, nonoChangeToPet
            writer.WriteBytes(Buffer.alloc(5 * 4));
            return writer.ToBuffer();
        }
        // ========== 当前称号 ==========
        writer.WriteUInt32(this.curTitle);
        console.log(`[LoginRspProto] 当前称号: ${this.curTitle}`);
        // ========== Boss成就 (200 bytes) ==========
        for (let i = 0; i < 200; i++) {
            writer.WriteUInt8(this.bossAchievement[i] ? 1 : 0);
        }
        const achievementCount = this.bossAchievement.filter(a => a).length;
        console.log(`[LoginRspProto] Boss成就: ${achievementCount}/200`);
        const buffer = writer.ToBuffer();
        console.log(`[LoginRspProto] 最终大小: ${buffer.length} bytes`);
        return buffer;
    }
}
exports.LoginRspProto = LoginRspProto;
//# sourceMappingURL=LoginRspProto.js.map