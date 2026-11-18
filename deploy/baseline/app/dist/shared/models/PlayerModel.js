"use strict";
/**
 * 玩家数据模型
 * 基于客户端 UserInfo.as 结构定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountStatus = void 0;
exports.createDefaultAccountInfo = createDefaultAccountInfo;
exports.createSessionInfo = createSessionInfo;
exports.generateSessionKey = generateSessionKey;
exports.generateEmailCode = generateEmailCode;
exports.createEmailCodeInfo = createEmailCodeInfo;
exports.createDefaultTeamInfo = createDefaultTeamInfo;
exports.createDefaultTeamPKInfo = createDefaultTeamPKInfo;
exports.createDefaultPetSkill = createDefaultPetSkill;
exports.createDefaultPetInfo = createDefaultPetInfo;
exports.createDefaultPlayerInfo = createDefaultPlayerInfo;
// ============================================================================
// 账号相关模型
// ============================================================================
/**
 * 账号状态枚举
 */
var AccountStatus;
(function (AccountStatus) {
    AccountStatus[AccountStatus["NORMAL"] = 0] = "NORMAL";
    AccountStatus[AccountStatus["BANNED"] = 1] = "BANNED";
    AccountStatus[AccountStatus["FROZEN"] = 2] = "FROZEN";
    AccountStatus[AccountStatus["PENDING"] = 3] = "PENDING"; // 待激活
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
/**
 * 创建默认账号信息
 */
function createDefaultAccountInfo(id, email, passwordHash) {
    const now = Math.floor(Date.now() / 1000);
    return {
        id,
        email,
        passwordHash,
        status: AccountStatus.NORMAL,
        createTime: now,
        lastLoginTime: 0,
        lastLoginIP: '',
        roleCreated: false
    };
}
/**
 * 创建Session信息
 */
function createSessionInfo(accountId, loginIP, expireSeconds = 3600) {
    const now = Math.floor(Date.now() / 1000);
    // 生成16字节的随机session key
    const sessionKey = generateSessionKey();
    return {
        sessionKey,
        accountId,
        createTime: now,
        expireTime: now + expireSeconds,
        loginIP,
        serverId: 0,
        isOnline: false
    };
}
/**
 * 生成Session Key (16字节hex字符串)
 */
function generateSessionKey() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
}
/**
 * 生成邮箱验证码
 */
function generateEmailCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * 创建邮箱验证码信息
 */
function createEmailCodeInfo(email, expireSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const code = generateEmailCode();
    // 生成验证码响应 (用于后续验证)
    const codeRes = generateSessionKey().substring(0, 32);
    return {
        email,
        code,
        codeRes,
        createTime: now,
        expireTime: now + expireSeconds,
        used: false
    };
}
/**
 * 创建默认的战队信息
 */
function createDefaultTeamInfo() {
    return {
        id: 0,
        level: 0,
        priv: 0,
        superCore: false,
        coreCount: 0,
        isShow: false,
        logoBg: 0,
        logoIcon: 0,
        logoColor: 0,
        txtColor: 0,
        logoWord: '',
        allContribution: 0,
        canExContribution: 0
    };
}
/**
 * 创建默认的战队PK信息
 */
function createDefaultTeamPKInfo() {
    return {
        groupID: 0,
        homeTeamID: 0
    };
}
/**
 * 创建默认的精灵技能
 */
function createDefaultPetSkill() {
    return {
        id: 0,
        pp: 0
    };
}
/**
 * 创建默认的精灵信息
 */
function createDefaultPetInfo() {
    return {
        id: 0,
        name: '',
        dv: 0,
        nature: 0,
        level: 1,
        exp: 0,
        lvExp: 0,
        nextLvExp: 100,
        hp: 100,
        maxHp: 100,
        attack: 10,
        defence: 10,
        s_a: 10,
        s_d: 10,
        speed: 10,
        ev_hp: 0,
        ev_attack: 0,
        ev_defence: 0,
        ev_sa: 0,
        ev_sd: 0,
        ev_sp: 0,
        skillNum: 0,
        skills: [
            createDefaultPetSkill(),
            createDefaultPetSkill(),
            createDefaultPetSkill(),
            createDefaultPetSkill()
        ],
        catchTime: 0,
        catchMap: 0,
        catchRect: 0,
        catchLevel: 1,
        effectCount: 0,
        effects: [],
        skinID: 0,
        isDefault: false
    };
}
/**
 * 创建默认的玩家信息
 */
function createDefaultPlayerInfo(userID, nick) {
    return {
        userID,
        regTime: Math.floor(Date.now() / 1000),
        nick,
        vip: 0,
        viped: 0,
        dsFlag: 0,
        color: 0,
        texture: 0,
        energy: 100,
        coins: 1000,
        gold: 0,
        fightBadge: 0,
        mapID: 1,
        posX: 300,
        posY: 300,
        actionType: 0,
        action: 0,
        direction: 0,
        changeShape: 0,
        playerForm: false,
        transTime: 0,
        fightFlag: 0,
        timeToday: 0,
        timeLimit: 0,
        isClothHalfDay: false,
        isRoomHalfDay: false,
        iFortressHalfDay: false,
        isHQHalfDay: false,
        loginCnt: 0, // 0 for first login to trigger novice rewards
        inviter: 0,
        newInviteeCnt: 0,
        vipLevel: 0,
        vipValue: 0,
        vipStage: 1,
        autoCharge: 0,
        vipEndTime: 0,
        freshManBonus: 0,
        nonoChipList: new Array(80).fill(0),
        dailyResArr: new Array(50).fill(0),
        teacherID: 0,
        studentID: 0,
        graduationCount: 0,
        maxPuniLv: 0,
        petMaxLev: 0,
        petAllNum: 0,
        monKingWin: 0,
        messWin: 0,
        curStage: 1,
        maxStage: 0,
        curFreshStage: 0,
        maxFreshStage: 0,
        maxArenaWins: 0,
        twoTimes: 0,
        threeTimes: 0,
        autoFight: 0,
        autoFightTimes: 0,
        energyTimes: 0,
        learnTimes: 0,
        monBtlMedal: 0,
        recordCnt: 0,
        obtainTm: 0,
        soulBeadItemID: 0,
        expireTm: 0,
        fuseTimes: 0,
        hasNono: true,
        superNono: false,
        nonoState: 0,
        nonoColor: 0xFFFFFF,
        nonoNick: 'NoNo',
        nonoFlag: 1,
        nonoPower: 10000,
        nonoMate: 10000,
        nonoIq: 0,
        nonoAi: 0,
        nonoBirth: Math.floor(Date.now() / 1000),
        nonoChargeTime: 500,
        nonoSuperEnergy: 0,
        nonoSuperLevel: 0,
        nonoSuperStage: 0,
        teamInfo: createDefaultTeamInfo(),
        teamPKInfo: createDefaultTeamPKInfo(),
        badge: 0,
        taskList: new Array(500).fill(0),
        petNum: 0,
        pets: [],
        clothCount: 0,
        clothes: [],
        curTitle: 0,
        bossAchievement: new Array(200).fill(false)
    };
}
//# sourceMappingURL=PlayerModel.js.map