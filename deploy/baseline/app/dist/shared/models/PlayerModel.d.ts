/**
 * 玩家数据模型
 * 基于客户端 UserInfo.as 结构定义
 */
/**
 * 账号状态枚举
 */
export declare enum AccountStatus {
    NORMAL = 0,// 正常
    BANNED = 1,// 封禁
    FROZEN = 2,// 冻结
    PENDING = 3
}
/**
 * 账号信息 (用于注册和登录)
 */
export interface IAccountInfo {
    id: number;
    email: string;
    passwordHash: string;
    status: AccountStatus;
    createTime: number;
    lastLoginTime: number;
    lastLoginIP: string;
    roleCreated: boolean;
}
/**
 * Session信息 (用于登录会话管理)
 */
export interface ISessionInfo {
    sessionKey: string;
    accountId: number;
    createTime: number;
    expireTime: number;
    loginIP: string;
    serverId: number;
    isOnline: boolean;
}
/**
 * 登录请求信息
 */
export interface ILoginRequest {
    account: string;
    passwordMD5: string;
}
/**
 * 登录响应信息
 */
export interface ILoginResponse {
    success: boolean;
    sessionKey: string;
    roleCreated: boolean;
    accountId: number;
    errorCode?: number;
    errorMsg?: string;
}
/**
 * 注册请求信息
 */
export interface IRegisterRequest {
    email: string;
    password: string;
    emailCode: string;
    emailCodeRes: string;
}
/**
 * 注册响应信息
 */
export interface IRegisterResponse {
    success: boolean;
    accountId: number;
    errorCode?: number;
    errorMsg?: string;
}
/**
 * 邮箱验证码信息
 */
export interface IEmailCodeInfo {
    email: string;
    code: string;
    codeRes: string;
    createTime: number;
    expireTime: number;
    used: boolean;
}
/**
 * 创建默认账号信息
 */
export declare function createDefaultAccountInfo(id: number, email: string, passwordHash: string): IAccountInfo;
/**
 * 创建Session信息
 */
export declare function createSessionInfo(accountId: number, loginIP: string, expireSeconds?: number): ISessionInfo;
/**
 * 生成Session Key (16字节hex字符串)
 */
export declare function generateSessionKey(): string;
/**
 * 生成邮箱验证码
 */
export declare function generateEmailCode(): string;
/**
 * 创建邮箱验证码信息
 */
export declare function createEmailCodeInfo(email: string, expireSeconds?: number): IEmailCodeInfo;
/**
 * 精灵技能信息
 */
export interface IPetSkillInfo {
    id: number;
    pp: number;
}
/**
 * 精灵效果信息 (20字节)
 */
export interface IPetEffectInfo {
    itemId: number;
    status: number;
    leftCount: number;
    effectID: number;
    param1: number;
    param2: number;
}
/**
 * 精灵完整信息
 */
export interface IPetInfo {
    id: number;
    name: string;
    dv: number;
    nature: number;
    level: number;
    exp: number;
    lvExp: number;
    nextLvExp: number;
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    s_a: number;
    s_d: number;
    speed: number;
    ev_hp: number;
    ev_attack: number;
    ev_defence: number;
    ev_sa: number;
    ev_sd: number;
    ev_sp: number;
    skillNum: number;
    skills: IPetSkillInfo[];
    catchTime: number;
    catchMap: number;
    catchRect: number;
    catchLevel: number;
    effectCount: number;
    effects: IPetEffectInfo[];
    skinID: number;
    isDefault: boolean;
}
/**
 * 装备信息 (8字节)
 */
export interface IClothInfo {
    id: number;
    level: number;
}
/**
 * 战队信息 (用于登录)
 */
export interface ITeamInfo {
    id: number;
    level: number;
    priv: number;
    superCore: boolean;
    coreCount: number;
    isShow: boolean;
    logoBg: number;
    logoIcon: number;
    logoColor: number;
    txtColor: number;
    logoWord: string;
    allContribution: number;
    canExContribution: number;
}
/**
 * 战队PK信息
 */
export interface ITeamPKInfo {
    groupID: number;
    homeTeamID: number;
}
/**
 * 玩家完整信息 (用于登录响应)
 * 对应客户端 UserInfo.setForLoginInfo
 */
export interface IPlayerInfo {
    userID: number;
    regTime: number;
    nick: string;
    vip: number;
    viped: number;
    dsFlag: number;
    color: number;
    texture: number;
    energy: number;
    coins: number;
    gold?: number;
    fightBadge: number;
    allocatableExp?: number;
    mapID: number;
    posX: number;
    posY: number;
    actionType: number;
    action: number;
    direction: number;
    changeShape: number;
    playerForm: boolean;
    transTime: number;
    fightFlag: number;
    timeToday: number;
    timeLimit: number;
    isClothHalfDay: boolean;
    isRoomHalfDay: boolean;
    iFortressHalfDay: boolean;
    isHQHalfDay: boolean;
    loginCnt: number;
    inviter: number;
    newInviteeCnt: number;
    vipLevel: number;
    vipValue: number;
    vipStage: number;
    autoCharge: number;
    vipEndTime: number;
    freshManBonus: number;
    nonoChipList: number[];
    dailyResArr: number[];
    teacherID: number;
    studentID: number;
    graduationCount: number;
    maxPuniLv: number;
    towerBossIndex?: number;
    petMaxLev: number;
    petAllNum: number;
    monKingWin: number;
    messWin: number;
    curStage: number;
    maxStage: number;
    curFreshStage: number;
    maxFreshStage: number;
    maxArenaWins: number;
    twoTimes: number;
    threeTimes: number;
    autoFight: number;
    autoFightTimes: number;
    energyTimes: number;
    learnTimes: number;
    monBtlMedal: number;
    recordCnt: number;
    obtainTm: number;
    soulBeadItemID: number;
    expireTm: number;
    fuseTimes: number;
    hasNono: boolean;
    superNono: boolean;
    nonoState: number;
    nonoColor: number;
    nonoNick: string;
    nonoFlag: number;
    nonoPower: number;
    nonoMate: number;
    nonoIq: number;
    nonoAi: number;
    nonoBirth: number;
    nonoChargeTime: number;
    nonoSuperEnergy: number;
    nonoSuperLevel: number;
    nonoSuperStage: number;
    teamInfo: ITeamInfo;
    teamPKInfo: ITeamPKInfo;
    badge: number;
    taskList: number[];
    petNum: number;
    pets: IPetInfo[];
    clothCount: number;
    clothes: IClothInfo[];
    clothIds?: number[];
    curTitle: number;
    bossAchievement: boolean[];
}
/**
 * 场景玩家信息 (用于地图玩家列表)
 * 对应客户端 UserInfo.setForPeoleInfo
 */
export interface IScenePlayerInfo {
    sysTime: number;
    userID: number;
    nick: string;
    color: number;
    texture: number;
    vip: number;
    viped: number;
    vipStage: number;
    actionType: number;
    posX: number;
    posY: number;
    action: number;
    direction: number;
    changeShape: number;
    spiritTime: number;
    spiritID: number;
    petDV: number;
    petSkin: number;
    fightFlag: number;
    teacherID: number;
    studentID: number;
    nonoState: number;
    nonoColor: number;
    superNono: boolean;
    playerForm: boolean;
    transTime: number;
    teamID: number;
    teamCoreCount: number;
    teamIsShow: boolean;
    teamLogoBg: number;
    teamLogoIcon: number;
    teamLogoColor: number;
    teamTxtColor: number;
    teamLogoWord: string;
    clothCount: number;
    clothes: IClothInfo[];
    curTitle: number;
}
/**
 * 简略用户信息 (用于好友列表等)
 * 对应客户端 UserInfo.setForSimpleInfo
 */
export interface ISimpleUserInfo {
    userID: number;
    nick: string;
    color: number;
    texture: number;
    vip: number;
    status: number;
    mapType: number;
    mapID: number;
    isCanBeTeacher: boolean;
    teacherID: number;
    studentID: number;
    graduationCount: number;
    vipLevel: number;
    teamID: number;
    teamIsShow: boolean;
    clothCount: number;
    clothes: IClothInfo[];
}
/**
 * 详细用户信息 (用于查看他人资料)
 * 对应客户端 UserInfo.setForMoreInfo
 */
export interface IDetailUserInfo {
    userID: number;
    nick: string;
    regTime: number;
    petAllNum: number;
    petMaxLev: number;
    bossAchievement: boolean[];
    graduationCount: number;
    monKingWin: number;
    messWin: number;
    maxStage: number;
    maxArenaWins: number;
    curTitle: number;
}
/**
 * 创建默认的战队信息
 */
export declare function createDefaultTeamInfo(): ITeamInfo;
/**
 * 创建默认的战队PK信息
 */
export declare function createDefaultTeamPKInfo(): ITeamPKInfo;
/**
 * 创建默认的精灵技能
 */
export declare function createDefaultPetSkill(): IPetSkillInfo;
/**
 * 创建默认的精灵信息
 */
export declare function createDefaultPetInfo(): IPetInfo;
/**
 * 创建默认的玩家信息
 */
export declare function createDefaultPlayerInfo(userID: number, nick: string): IPlayerInfo;
//# sourceMappingURL=PlayerModel.d.ts.map