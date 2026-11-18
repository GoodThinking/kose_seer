/**
 * 战斗数据模型
 * 存储战斗状态、参战精灵信息、回合数据等
 */
/**
 * 战斗类型枚举
 */
export declare enum BattleType {
    PVE = "PVE",// 普通PVE战斗
    BOSS = "BOSS",// BOSS战斗
    FRESH = "FRESH",// 新手战斗
    PVP = "PVP"
}
/**
 * 战斗状态枚举
 */
export declare enum BattleStatus {
    NONE = -1,// 无状态
    PARALYSIS = 0,// 麻痹
    POISON = 1,// 中毒
    BURN = 2,// 烧伤
    DRAIN = 3,// 吸取对方体力
    DRAINED = 4,// 被对方吸取体力
    FREEZE = 5,// 冻伤
    FEAR = 6,// 害怕
    FATIGUE = 7,// 疲惫
    SLEEP = 8,// 睡眠
    PETRIFY = 9,// 石化
    CONFUSION = 10,// 混乱
    WEAKNESS = 11,// 衰弱
    MOUNTAIN_GUARD = 12,// 山神守护
    FLAMMABLE = 13,// 易燃
    RAGE = 14,// 狂暴
    ICE_SEAL = 15,// 冰封
    BLEED = 16,// 流血
    IMMUNE_DOWN = 17,// 免疫能力下降
    IMMUNE_STATUS = 18
}
/**
 * 战斗中的精灵信息
 */
export interface IBattlePet {
    id: number;
    petId: number;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
    type: number;
    skills: number[];
    catchTime: number;
    skinID?: number;
    statusArray: number[];
    battleLv: number[];
    battleLevels?: number[];
    effectCounters?: {
        [key: string]: any;
    };
    status?: BattleStatus;
    statusTurns?: number;
    statusDurations?: number[];
    flinched?: boolean;
    bound?: boolean;
    boundTurns?: number;
    fatigue?: boolean;
    fatigueTurns?: number;
    lastMove?: number;
    skillPP?: number[];
    encore?: boolean;
    encoreTurns?: number;
    immuneFlags?: {
        statDown?: boolean;
        status?: boolean;
    };
}
/**
 * 攻击结果
 */
export interface IAttackResult {
    userId: number;
    skillId: number;
    atkTimes: number;
    damage: number;
    gainHp: number;
    attackerRemainHp: number;
    attackerMaxHp: number;
    defenderRemainHp: number;
    defenderMaxHp: number;
    missed: boolean;
    blocked: boolean;
    isCrit: boolean;
    attackerStatus: number[];
    attackerBattleLv: number[];
}
/**
 * 回合结果
 */
export interface ITurnResult {
    firstAttack?: IAttackResult;
    secondAttack?: IAttackResult;
    isOver: boolean;
    winner?: number;
    reason?: number;
}
/**
 * 战斗信息
 */
export interface IBattleInfo {
    userId: number;
    player: IBattlePet;
    enemy: IBattlePet;
    turn: number;
    isOver: boolean;
    winner?: number;
    battleType?: BattleType;
    startTime: number;
    bossMapId?: number;
    bossParam2?: number;
    isPvp?: boolean;
    player2Id?: number;
    roundCount?: number;
    lastHitWasCritical?: boolean;
}
//# sourceMappingURL=BattleModel.d.ts.map