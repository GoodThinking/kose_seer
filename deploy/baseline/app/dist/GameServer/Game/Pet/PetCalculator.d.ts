/**
 * 精灵属性计算系统
 * 负责计算精灵的各项属性值（HP、攻击、防御、特攻、特防、速度）
 *
 * 移植自: luvit/luvit_version/game/seer_pet_calculator.lua
 *
 * 计算公式：
 * - HP = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 等级 + 10
 * - 其他属性 = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 5
 *
 * 性格修正：
 * - 增益属性：x1.1
 * - 减益属性：x0.9
 * - 平衡型：x1.0
 */
import { IPetInfo } from '../../../shared/models/PetModel';
/**
 * 精灵种族值接口
 */
export interface IPetBaseStats {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
}
/**
 * 精灵计算属性接口
 */
export interface IPetCalculatedStats {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
    lvExp: number;
    nextLvExp: number;
}
/**
 * 精灵属性计算器
 */
export declare class PetCalculator {
    /**
     * 获取精灵的种族值
     *
     * @param petId 精灵种类ID
     * @returns 种族值数据
     */
    private static GetBaseStats;
    /**
     * 计算精灵的 HP
     *
     * 公式: HP = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 等级 + 10
     *
     * @param petId 精灵种类ID
     * @param level 等级
     * @param dv 个体值 (0-31)
     * @param ev 努力值 (0-255)
     * @returns HP值
     */
    static CalculateHP(petId: number, level: number, dv?: number, ev?: number): number;
    /**
     * 计算精灵的其他属性（攻击、防御、特攻、特防、速度）
     *
     * 公式: 属性 = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 5
     *
     * @param petId 精灵种类ID
     * @param statName 属性名称 ('atk', 'def', 'spAtk', 'spDef', 'speed')
     * @param level 等级
     * @param dv 个体值 (0-31)
     * @param ev 努力值 (0-255)
     * @param nature 性格ID (0-25)
     * @returns 属性值
     */
    static CalculateStat(petId: number, statName: 'atk' | 'def' | 'spAtk' | 'spDef' | 'speed', level: number, dv?: number, ev?: number, nature?: number): number;
    /**
     * 计算精灵的当前等级经验值
     *
     * 简化实现：使用固定的经验曲线
     * 等级 N 所需总经验 = N^3
     *
     * @param level 当前等级
     * @param exp 总经验值
     * @returns { lvExp: 当前等级已获得的经验, nextLvExp: 升级所需经验 }
     */
    static CalculateLevelExp(level: number, exp: number): {
        lvExp: number;
        nextLvExp: number;
    };
    /**
     * 计算升到指定等级所需的经验
     * 使用立方公式：level^3 * 成长系数
     *
     * 成长类型：
     * - 0: 快速成长 (0.8x)
     * - 1: 中速成长 (1.0x)
     * - 2: 慢速成长 (1.2x)
     * - 3: 极慢成长 (1.5x)
     *
     * @param level 目标等级
     * @param petId 精灵ID（可选，用于获取成长类型）
     * @returns 升到该等级所需的经验
     */
    static CalculateExpForLevel(level: number, petId?: number): number;
    /**
     * 计算精灵的所有属性
     *
     * @param petId 精灵种类ID
     * @param level 等级
     * @param exp 总经验值
     * @param nature 性格ID
     * @param dvs 个体值对象
     * @param evs 努力值对象
     * @param currentHp 当前HP（可选，默认为满血）
     * @returns 计算后的所有属性
     */
    static CalculateAllStats(petId: number, level: number, exp: number, nature: number, dvs: {
        hp: number;
        atk: number;
        def: number;
        spAtk: number;
        spDef: number;
        speed: number;
    }, evs: {
        hp: number;
        atk: number;
        def: number;
        spAtk: number;
        spDef: number;
        speed: number;
    }, currentHp?: number): IPetCalculatedStats;
    /**
     * 从精灵数据计算所有属性（便捷方法）
     *
     * @param pet 精灵数据
     * @returns 计算后的所有属性
     */
    static CalculateStatsFromPet(pet: IPetInfo): IPetCalculatedStats;
    /**
     * 更新精灵的计算属性
     *
     * 将计算后的属性应用到精灵数据对象上
     *
     * @param pet 精灵数据（会被修改）
     * @returns 更新后的精灵数据
     */
    static UpdatePetStats(pet: IPetInfo): IPetInfo;
    /**
     * 计算升级所需的总经验
     *
     * @param targetLevel 目标等级
     * @returns 所需总经验
     */
    static CalculateTotalExpForLevel(targetLevel: number): number;
    /**
     * 根据经验值计算等级
     *
     * @param exp 总经验值
     * @returns 等级
     */
    static CalculateLevelFromExp(exp: number): number;
    /**
     * 检查精灵是否可以升级
     *
     * @param level 当前等级
     * @param exp 总经验值
     * @param maxLevel 最大等级（默认100）
     * @returns 是否可以升级
     */
    static CanLevelUp(level: number, exp: number, maxLevel?: number): boolean;
    /**
     * 计算精灵升级后的新等级
     *
     * @param currentLevel 当前等级
     * @param exp 总经验值
     * @param maxLevel 最大等级（默认100）
     * @returns 新等级
     */
    static CalculateNewLevel(currentLevel: number, exp: number, maxLevel?: number): number;
    /**
     * 添加经验值并计算新等级
     *
     * @param pet 精灵数据（会被修改）
     * @param expGain 获得的经验值
     * @param maxLevel 最大等级（默认100）
     * @returns { leveledUp: 是否升级, oldLevel: 旧等级, newLevel: 新等级 }
     */
    static AddExperience(pet: IPetInfo, expGain: number, maxLevel?: number): {
        leveledUp: boolean;
        oldLevel: number;
        newLevel: number;
    };
    /**
     * 验证个体值是否有效
     *
     * @param dv 个体值
     * @returns 是否有效
     */
    static IsValidDV(dv: number): boolean;
    /**
     * 验证努力值是否有效
     *
     * @param ev 努力值
     * @returns 是否有效
     */
    static IsValidEV(ev: number): boolean;
    /**
     * 验证努力值总和是否有效
     *
     * 赛尔号的努力值总和限制为510
     *
     * @param evs 努力值对象
     * @returns 是否有效
     */
    static IsValidEVTotal(evs: {
        hp: number;
        atk: number;
        def: number;
        spAtk: number;
        spDef: number;
        speed: number;
    }): boolean;
    /**
     * 生成随机个体值
     *
     * @returns 随机个体值对象
     */
    static GenerateRandomDVs(): {
        hp: number;
        atk: number;
        def: number;
        spAtk: number;
        spDef: number;
        speed: number;
    };
    /**
     * 生成随机性格
     *
     * @returns 随机性格ID (1-26)
     */
    static GenerateRandomNature(): number;
}
//# sourceMappingURL=PetCalculator.d.ts.map