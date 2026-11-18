/**
 * SPT (Species) 配置系统
 * 负责精灵种族数据的读取和查询
 *
 * 移植自: luvit/luvit_version/game/seer_pets.lua
 *
 * 功能：
 * - 精灵种族值查询
 * - 可学习技能查询
 * - 进化链查询
 * - 额外技能查询
 *
 * 数据来源：config/data/xml/spt.xml
 */
import { IPetMonster } from '../../../shared/config/XmlConfigInterfaces';
/**
 * 可学习技能信息接口
 */
export interface ILearnableSkillInfo {
    id: number;
    level: number;
}
/**
 * SPT 系统类
 */
export declare class SptSystem {
    /**
     * 精灵数据缓存
     * petId -> IPetMonster
     */
    private static petCache;
    /**
     * 可学习技能缓存
     * petId -> ILearnableSkillInfo[]
     */
    private static learnableMovesCache;
    /**
     * 加载 SPT 数据
     */
    private static LoadSptData;
    /**
     * 获取精灵数据
     *
     * @param petId 精灵ID
     * @returns 精灵数据，不存在返回null
     */
    static GetPet(petId: number): IPetMonster | null;
    /**
     * 检查精灵是否存在
     *
     * @param petId 精灵ID
     * @returns 是否存在
     */
    static Exists(petId: number): boolean;
    /**
     * 获取精灵名称
     *
     * @param petId 精灵ID
     * @returns 精灵名称
     */
    static GetName(petId: number): string;
    /**
     * 获取所有精灵ID
     *
     * @returns 精灵ID数组
     */
    static GetAllPetIds(): number[];
    /**
     * 获取精灵的所有可学习技能
     *
     * @param petId 精灵ID
     * @returns 可学习技能列表
     */
    static GetLearnableMoves(petId: number): ILearnableSkillInfo[];
    /**
     * 获取精灵在指定等级可学习的技能
     *
     * @param petId 精灵ID
     * @param level 等级
     * @returns 可学习技能列表（等级 <= level）
     */
    static GetLearnableMovesByLevel(petId: number, level: number): ILearnableSkillInfo[];
    /**
     * 获取精灵的默认技能（最后学会的4个技能）
     *
     * @param petId 精灵ID
     * @param level 等级
     * @returns 默认技能列表（最多4个）
     */
    static GetDefaultSkills(petId: number, level: number): ILearnableSkillInfo[];
    /**
     * 检查精灵是否可以学习指定技能
     *
     * @param petId 精灵ID
     * @param skillId 技能ID
     * @returns 是否可以学习
     */
    static CanLearnMove(petId: number, skillId: number): boolean;
    /**
     * 获取技能的学习等级
     *
     * @param petId 精灵ID
     * @param skillId 技能ID
     * @returns 学习等级，如果不能学习则返回-1
     */
    static GetMoveLearnLevel(petId: number, skillId: number): number;
    /**
     * 获取精灵在升级时新学会的技能
     *
     * @param petId 精灵ID
     * @param newLevel 新等级
     * @returns 新学会的技能列表
     */
    static GetNewMovesOnLevelUp(petId: number, newLevel: number): ILearnableSkillInfo[];
    /**
     * 获取精灵的额外技能（第五技能等）
     *
     * @param petId 精灵ID
     * @returns 额外技能ID列表
     */
    static GetExtraMoves(petId: number): number[];
    /**
     * 检查技能是否为额外技能
     *
     * @param petId 精灵ID
     * @param skillId 技能ID
     * @returns 是否为额外技能
     */
    static IsExtraMove(petId: number, skillId: number): boolean;
    /**
     * 获取精灵的进化前形态
     *
     * @param petId 精灵ID
     * @returns 进化前形态ID，如果是初始形态则返回0
     */
    static GetEvolvesFrom(petId: number): number;
    /**
     * 获取精灵的进化后形态
     *
     * @param petId 精灵ID
     * @returns 进化后形态ID，如果是最终形态则返回0
     */
    static GetEvolvesTo(petId: number): number;
    /**
     * 获取精灵的进化等级
     *
     * @param petId 精灵ID
     * @returns 进化等级，如果不能进化则返回0
     */
    static GetEvolvingLevel(petId: number): number;
    /**
     * 检查精灵是否可以进化
     *
     * @param petId 精灵ID
     * @param level 当前等级
     * @returns 是否可以进化
     */
    static CanEvolve(petId: number, level: number): boolean;
    /**
     * 获取精灵的完整进化链
     *
     * @param petId 精灵ID
     * @returns 进化链（从初始形态到最终形态）
     */
    static GetEvolutionChain(petId: number): number[];
    /**
     * 检查精灵是否为初始形态
     *
     * @param petId 精灵ID
     * @returns 是否为初始形态
     */
    static IsBaseForm(petId: number): boolean;
    /**
     * 检查精灵是否为最终形态
     *
     * @param petId 精灵ID
     * @returns 是否为最终形态
     */
    static IsFinalForm(petId: number): boolean;
    /**
     * 获取精灵的种族值
     *
     * @param petId 精灵ID
     * @returns 种族值对象
     */
    static GetBaseStats(petId: number): {
        hp: number;
        atk: number;
        def: number;
        spAtk: number;
        spDef: number;
        spd: number;
    } | null;
    /**
     * 获取精灵的种族值总和
     *
     * @param petId 精灵ID
     * @returns 种族值总和
     */
    static GetBaseStatsTotal(petId: number): number;
    /**
     * 获取精灵的属性类型
     *
     * @param petId 精灵ID
     * @returns { type1: 主属性, type2: 副属性（可选） }
     */
    static GetTypes(petId: number): {
        type1: number;
        type2?: number;
    };
    /**
     * 获取精灵的捕获率
     *
     * @param petId 精灵ID
     * @returns 捕获率 (0-255)
     */
    static GetCatchRate(petId: number): number;
    /**
     * 检查精灵是否可以放生
     *
     * @param petId 精灵ID
     * @returns 是否可以放生
     */
    static CanRelease(petId: number): boolean;
    /**
     * 检查精灵是否为稀有精灵
     *
     * @param petId 精灵ID
     * @returns 是否为稀有精灵
     */
    static IsRare(petId: number): boolean;
    /**
     * 检查精灵是否为暗黑精灵
     *
     * @param petId 精灵ID
     * @returns 是否为暗黑精灵
     */
    static IsDark(petId: number): boolean;
    /**
     * 获取 SPT 系统统计信息
     *
     * @returns 统计信息
     */
    static GetStats(): {
        totalPets: number;
        petsWithMoves: number;
        totalMoves: number;
    };
    /**
     * 打印 SPT 系统信息（调试用）
     */
    static PrintStats(): void;
    /**
     * 打印精灵的可学习技能（调试用）
     *
     * @param petId 精灵ID
     */
    static PrintLearnableMoves(petId: number): void;
}
//# sourceMappingURL=SptSystem.d.ts.map