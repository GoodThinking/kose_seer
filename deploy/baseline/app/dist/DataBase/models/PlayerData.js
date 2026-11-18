"use strict";
/**
 * 玩家数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：使用 Proxy 实现属性修改时自动保存到数据库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerData = void 0;
const DatabaseHelper_1 = require("../DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 不需要自动保存的字段列表（黑名单）
 * - 只读字段：userID, regTime
 * - 临时字段：pets, clothes, taskList（从其他表加载）
 * - 内部状态：_saveTimer, _pendingSave
 *
 * 注意：hasNono, superNono 等NoNo字段已从黑名单移除，允许自动保存
 */
const NO_SAVE_FIELDS = new Set([
    'userID', // 主键，不可修改
    'regTime', // 注册时间，不可修改
    'pets', // 从 pet_bag 表加载
    'petNum', // 从 pet_bag 表计算
    'clothes', // 从 items 表加载
    'clothCount', // 从 items 表计算
    'taskList', // 从 tasks 表加载
    'teamInfo', // 复杂对象，单独处理
    'teamPKInfo', // 复杂对象，单独处理
    'bossAchievement', // 复杂对象，单独处理
    '_saveTimer', // 内部状态
    '_pendingSave', // 内部状态
    '_dirtyFields', // 内部状态
    '_expAllocation',
    '_publishingExp',
    '_balanceReward', '_currencyOperations', '_currencyWait', '_currencyDone'
]);
/**
 * 玩家数据（对应数据库表 players）
 *
 * 架构说明：
 * - 这是一个数据类，直接映射数据库表
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 使用 Proxy 实现属性修改时自动保存（黑名单模式）
 * - 提供静态方法 GetPlayerByUid 便捷访问
 */
class PlayerData {
    _expAllocation = null;
    _publishingExp = false;
    _balanceReward = false;
    _currencyOperations = 0;
    _currencyWait = null;
    _currencyDone = null;
    async WaitForCurrencyOperations() { await this._currencyWait; }
    /** Covers DB-first currency writes until their cache publication finishes. */
    BeginCurrencyOperation() {
        if (this._balanceReward)
            return null;
        if (!this._currencyOperations) {
            this._currencyWait = new Promise(resolve => { this._currencyDone = resolve; });
        }
        this._currencyOperations++;
        return () => {
            if (!--this._currencyOperations) {
                this._currencyDone?.();
                this._currencyWait = null;
                this._currencyDone = null;
            }
        };
    }
    /** Reuses the pool/save gate; inventories are reserved by the caller first. */
    BeginBalanceReward() {
        if (this._currencyOperations)
            throw new Error('Currency operation pending');
        const pool = this.BeginExpAllocation();
        this._balanceReward = true;
        return {
            publish: (coins, gold, experience) => {
                this._publishingExp = true;
                try {
                    this.coins = coins;
                    this.gold = gold;
                }
                finally {
                    this._publishingExp = false;
                }
                pool.publish(experience);
                this.ClearDirtyFields(['coins', 'gold', 'allocatableExp']);
            },
            release: () => { this._balanceReward = false; pool.release(); },
        };
    }
    HasExpAllocation() { return !!this._expAllocation; }
    async WaitForExpAllocation() { await this._expAllocation; }
    /** Hold the pool field stable without blocking unrelated player dirty fields. */
    BeginExpAllocation() {
        if (this._expAllocation)
            throw new Error('Experience allocation already pending');
        let done;
        this._expAllocation = new Promise(resolve => { done = resolve; });
        return {
            publish: balance => {
                this._publishingExp = true;
                try {
                    this.allocatableExp = balance;
                }
                finally {
                    this._publishingExp = false;
                }
                this.ClearDirtyFields(['allocatableExp']);
            },
            release: () => { this._expAllocation = null; done(); },
        };
    }
    // ============ 基本信息 ============
    userID;
    regTime;
    nick;
    vip;
    viped;
    dsFlag;
    color;
    texture;
    // ============ 货币信息 ============
    energy;
    coins; // 赛尔豆
    gold; // 金豆（充值货币）
    fightBadge;
    // ============ 精灵分配仪 ============
    allocatableExp;
    // ============ 位置信息 ============
    mapID;
    posX;
    posY;
    actionType = 0; // 动作类型
    action = 0; // 动作
    direction = 0; // 方向
    changeShape = 0; // 变形
    playerForm = false; // 玩家形态
    transTime = 0; // 变形时间
    fightFlag = 0; // 战斗标志
    // ============ 时间信息 ============
    timeToday;
    timeLimit;
    // ============ 半价标志 ============
    isClothHalfDay;
    isRoomHalfDay;
    iFortressHalfDay;
    isHQHalfDay;
    // ============ 登录信息 ============
    loginCnt;
    inviter;
    newInviteeCnt;
    // ============ VIP信息 ============
    vipLevel;
    vipValue;
    vipStage;
    autoCharge;
    vipEndTime;
    freshManBonus;
    // ============ NONO芯片 ============
    nonoChipList;
    // ============ 每日资源 ============
    dailyResArr;
    // ============ 师徒信息 ============
    teacherID;
    studentID;
    graduationCount;
    // ============ 挑战进度 ============
    maxPuniLv; // 谱尼封印进度（0-8：0=未开启，1-7=封印进度，8=解锁真身）
    towerBossIndex; // 勇者之塔当前层已击败的BOSS数（0/1/2）
    // ============ 精灵统计 ============
    petMaxLev;
    petAllNum;
    // ============ 战斗统计 ============
    monKingWin;
    messWin; // 混战胜利次数
    curStage;
    maxStage;
    curFreshStage;
    maxFreshStage;
    maxArenaWins;
    // ============ 倍率信息 ============
    twoTimes;
    threeTimes;
    autoFight;
    autoFightTimes;
    energyTimes;
    learnTimes;
    monBtlMedal;
    // ============ 魂珠信息 ============
    recordCnt;
    obtainTm;
    soulBeadItemID;
    expireTm;
    fuseTimes;
    // ============ NONO信息（对齐官方字段）============
    hasNono;
    superNono;
    nonoState;
    nonoColor;
    nonoNick;
    nonoFlag;
    nonoPower;
    nonoMate;
    nonoIq;
    nonoAi;
    nonoBirth;
    nonoChargeTime;
    // func字段（160位）在数据库中不存储，默认全部开启
    nonoSuperEnergy;
    nonoSuperLevel;
    nonoSuperStage;
    // ============ 战队信息 ============
    teamInfo;
    teamPKInfo;
    // ============ 其他信息 ============
    badge;
    taskList;
    // ============ 精灵列表 ============
    petNum;
    pets;
    // ============ 装备列表 ============
    clothCount;
    clothes;
    clothIds; // 当前穿戴的服装ID列表
    // ============ 成就信息 ============
    curTitle;
    bossAchievement;
    // ============ 内部状态 ============
    _saveTimer = null;
    _pendingSave = false;
    _dirtyFields = new Set();
    constructor(data) {
        // 基本信息
        this.userID = data.userID;
        this.regTime = data.regTime;
        this.nick = data.nick;
        this.vip = data.vip;
        this.viped = data.viped;
        this.dsFlag = data.dsFlag;
        this.color = data.color;
        this.texture = data.texture;
        // 货币信息
        this.energy = data.energy;
        this.coins = data.coins;
        this.gold = data.gold || 0;
        this.fightBadge = data.fightBadge;
        // 精灵分配仪
        this.allocatableExp = data.allocatableExp || 0;
        // 位置信息
        this.mapID = data.mapID;
        this.posX = data.posX;
        this.posY = data.posY;
        this.actionType = data.actionType || 0;
        this.action = data.action || 0;
        this.direction = data.direction || 0;
        this.changeShape = data.changeShape || 0;
        this.playerForm = data.playerForm || false;
        this.transTime = data.transTime || 0;
        this.fightFlag = data.fightFlag || 0;
        // 时间信息
        this.timeToday = data.timeToday;
        this.timeLimit = data.timeLimit;
        // 半价标志
        this.isClothHalfDay = data.isClothHalfDay;
        this.isRoomHalfDay = data.isRoomHalfDay;
        this.iFortressHalfDay = data.iFortressHalfDay;
        this.isHQHalfDay = data.isHQHalfDay;
        // 登录信息
        this.loginCnt = data.loginCnt;
        this.inviter = data.inviter;
        this.newInviteeCnt = data.newInviteeCnt;
        // VIP信息
        this.vipLevel = data.vipLevel;
        this.vipValue = data.vipValue;
        this.vipStage = data.vipStage;
        this.autoCharge = data.autoCharge;
        this.vipEndTime = data.vipEndTime;
        this.freshManBonus = data.freshManBonus;
        // NONO芯片
        this.nonoChipList = data.nonoChipList;
        // 每日资源
        this.dailyResArr = data.dailyResArr;
        // 师徒信息
        this.teacherID = data.teacherID;
        this.studentID = data.studentID;
        this.graduationCount = data.graduationCount;
        // 挑战进度
        this.maxPuniLv = data.maxPuniLv || 0;
        this.towerBossIndex = data.towerBossIndex || 0;
        // 精灵统计
        this.petMaxLev = data.petMaxLev;
        this.petAllNum = data.petAllNum;
        // 战斗统计
        this.monKingWin = data.monKingWin;
        this.messWin = data.messWin || 0;
        this.curStage = data.curStage;
        this.maxStage = data.maxStage;
        this.curFreshStage = data.curFreshStage;
        this.maxFreshStage = data.maxFreshStage;
        this.maxArenaWins = data.maxArenaWins;
        // 倍率信息
        this.twoTimes = data.twoTimes;
        this.threeTimes = data.threeTimes;
        this.autoFight = data.autoFight;
        this.autoFightTimes = data.autoFightTimes;
        this.energyTimes = data.energyTimes;
        this.learnTimes = data.learnTimes;
        this.monBtlMedal = data.monBtlMedal;
        // 魂珠信息
        this.recordCnt = data.recordCnt;
        this.obtainTm = data.obtainTm;
        this.soulBeadItemID = data.soulBeadItemID;
        this.expireTm = data.expireTm;
        this.fuseTimes = data.fuseTimes;
        // NONO信息（对齐官方字段）
        this.hasNono = data.hasNono;
        this.superNono = data.superNono;
        this.nonoState = data.nonoState;
        this.nonoColor = data.nonoColor;
        this.nonoNick = data.nonoNick;
        this.nonoFlag = data.nonoFlag;
        this.nonoPower = data.nonoPower;
        this.nonoMate = data.nonoMate;
        this.nonoIq = data.nonoIq;
        this.nonoAi = data.nonoAi;
        this.nonoBirth = data.nonoBirth;
        this.nonoChargeTime = data.nonoChargeTime;
        this.nonoSuperEnergy = data.nonoSuperEnergy || 0;
        this.nonoSuperLevel = data.nonoSuperLevel || 0;
        this.nonoSuperStage = data.nonoSuperStage || 0;
        // 战队信息
        this.teamInfo = data.teamInfo;
        this.teamPKInfo = data.teamPKInfo;
        // 其他信息
        this.badge = data.badge;
        this.taskList = data.taskList;
        // 精灵列表
        this.petNum = data.petNum;
        this.pets = data.pets;
        // 装备列表
        this.clothCount = data.clothCount;
        this.clothes = data.clothes;
        this.clothIds = data.clothIds || []; // 当前穿戴的服装ID列表
        // 成就信息
        this.curTitle = data.curTitle;
        this.bossAchievement = data.bossAchievement;
        // 返回 Proxy 包装的对象，实现自动保存
        return this.createProxy();
    }
    /**
     * 创建 Proxy 包装，实现属性修改时自动保存
     */
    createProxy() {
        return new Proxy(this, {
            set: (target, property, value) => {
                if (((property === 'allocatableExp' && this._expAllocation) ||
                    (this._balanceReward && (property === 'coins' || property === 'gold'))) && !this._publishingExp) {
                    throw new Error('Experience allocation pending persistence');
                }
                const oldValue = target[property];
                // 调试日志
                // Logger.Debug(`[PlayerData] Proxy set: ${property} = ${value}, 黑名单=${NO_SAVE_FIELDS.has(property)}`);
                // 设置新值
                target[property] = value;
                // 如果不在黑名单中，触发保存
                if (!NO_SAVE_FIELDS.has(property) && oldValue !== value) {
                    this._dirtyFields.add(property);
                    // Logger.Debug(`[PlayerData] 触发自动保存: ${property}`);
                    this.scheduleSave();
                }
                return true;
            }
        });
    }
    /**
     * 调度保存操作（防抖，100ms内的多次修改只保存一次）
     */
    scheduleSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }
        this._pendingSave = true;
        this._saveTimer = setTimeout(async () => {
            if (this._pendingSave) {
                await this.save();
                this._pendingSave = false;
            }
            this._saveTimer = null;
        }, 100); // 100ms 防抖
    }
    /**
     * 立即保存到数据库
     */
    async save() {
        try {
            // 清理定时器
            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
                this._saveTimer = null;
            }
            this._pendingSave = false;
            await DatabaseHelper_1.DatabaseHelper.Instance.SavePlayerData(this);
            Logger_1.Logger.Debug(`[PlayerData] 自动保存成功: uid=${this.userID}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerData] 自动保存失败: uid=${this.userID}`, error);
        }
    }
    /**
     * 清理定时器（用于关闭时清理资源）
     */
    cleanup() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        this._pendingSave = false;
    }
    /**
     * 获取当前脏字段列表
     */
    GetDirtyFields() {
        return Array.from(this._dirtyFields);
    }
    /**
     * 清理脏字段
     */
    ClearDirtyFields(fields) {
        if (!fields) {
            this._dirtyFields.clear();
            return;
        }
        for (const field of fields) {
            this._dirtyFields.delete(field);
        }
    }
    /**
     * 手动标记字段为脏
     */
    MarkDirty(field) {
        if (field && !NO_SAVE_FIELDS.has(field)) {
            this._dirtyFields.add(field);
        }
    }
    /**
     * 静态方法：根据 UID 获取玩家数据
     *
     *
     * @example
     * // 在 FriendManager 中使用
     * const player = await PlayerData.GetPlayerByUid(friendUid);
     * if (player) {
     *   console.log(player.nick);
     * }
     *
     * // 在 Handler 中使用
     * const targetPlayer = await PlayerData.GetPlayerByUid(req.Uid);
     */
    static async GetPlayerByUid(uid) {
        const data = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(uid);
        return data;
    }
    /**
     * 转换为简单信息（用于好友列表等）
     */
    ToSimpleInfo() {
        return {
            userID: this.userID,
            nick: this.nick,
            color: this.color,
            texture: this.texture,
            vip: this.vip,
            vipLevel: this.vipLevel,
            mapID: this.mapID
        };
    }
    /**
     * 转换为详细信息（用于查看资料）
     */
    ToDetailInfo() {
        return {
            userID: this.userID,
            nick: this.nick,
            regTime: this.regTime,
            petAllNum: this.petAllNum,
            petMaxLev: this.petMaxLev,
            monKingWin: this.monKingWin,
            maxStage: this.maxStage,
            maxArenaWins: this.maxArenaWins,
            curTitle: this.curTitle,
            bossAchievement: this.bossAchievement
        };
    }
}
exports.PlayerData = PlayerData;
//# sourceMappingURL=PlayerData.js.map