import { BaseManager } from '../Base/BaseManager';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IPetInfo } from '../../../shared/models/PetModel';
import { PetInfoProto } from '../../../shared/proto/common/PetInfoProto';
import { PetData } from '../../../DataBase/models/PetData';
import { PetObtainSource } from '../Event/EventTypes';
/**
 * 精灵管理器
 * 处理精灵相关的所有逻辑：获取精灵信息、精灵列表、治疗、展示等
 *
 * 架构说明：
 * - 持有 PetData 对象，直接操作数据
 * - 使用 DatabaseHelper 实时保存数据
 */
export declare class PetManager extends BaseManager {
    /** 精灵数据*/
    PetData: PetData;
    constructor(player: PlayerInstance);
    /**
     * 初始化（加载数据�?
     */
    Initialize(): Promise<void>;
    /**
     * 获取精灵缺失的技能（应该学会但还没学会的）
     * @param pet 精灵信息
     * @returns 缺失的技能ID列表
     */
    private GetMissingSkills;
    /**
     * 处理获取精灵列表（返回所有精灵的简化信息，用于填充 _storageMap）
     * 客户端期望的格式：PetListInfo (id, catchTime, skinID)
     * 排序规则：首发精灵第一个，其他按 catchTime 升序排列
     */
    HandleGetPetList(): Promise<void>;
    /**
     * 处理获取精灵仓库列表
     * 排序规则：按 catchTime 升序排列（越早获得越靠前）
     */
    HandleGetPetRoomList(roomType: number): Promise<void>;
    /**
     * 主动推送精灵列表更新（用于GM发送精灵、捕捉精灵等场景）
     * @param includeStorage 是否包含仓库精灵（默认false，只推送背包）
     * @deprecated 不推荐使用，客户端没有持续监听GET_PET_LIST，请使用SendNoteUpdatePropForNewPet
     */
    SendPetListUpdate(includeStorage?: boolean): Promise<void>;
    /**
     * 推送 NOTE_UPDATE_PROP 触发客户端刷新精灵列表（用于GM发送精灵等场景）
     * 客户端收到此消息后会自动调用 PetManager.upDate() 刷新精灵列表
     * @param pet 新获得的精灵信息
     */
    SendNoteUpdatePropForNewPet(pet: IPetInfo): Promise<void>;
    /**
     * 处理获取精灵信息
     */
    HandleGetPetInfo(catchTime: number): Promise<void>;
    /**
     * 处理将精灵放到仓库（flag=0）
     */
    HandlePetRelease(catchTime: number): Promise<void>;
    /**
     * 处理将精灵放入背包（从仓库取出，或确认获得新精灵）
     */
    HandlePetTakeOut(catchTime: number): Promise<void>;
    /**
     * 处理展示精灵
     */
    HandlePetShow(catchTime: number): Promise<void>;
    /**
     * 处理治疗精灵
     */
    HandlePetCure(petId?: number): Promise<void>;
    /**
     * 处理设置首发精灵
     *
     * 优化：设置首发时直接调整数组顺序，确保首发精灵在第一位
     * 这样登录和其他地方就不需要额外排序了
     */
    HandlePetDefault(catchTime: number): Promise<void>;
    /**
     * 处理获取精灵仓库列表
     */
    HandlePetBargeList(): Promise<void>;
    /**
     * 处理移动精灵到仓�?
     */
    HandleMovePetToStorage(petId: number): Promise<void>;
    /**
     * 处理移动精灵到背�?
     */
    HandleMovePetToBag(petId: number): Promise<void>;
    /**
     * 处理增加精灵经验（按petId查找）
     * @deprecated 使用HandleAddPetExpByCatchTime代替
     */
    HandleAddPetExp(petId: number, expAmount: number): Promise<boolean>;
    /**
     * 处理增加精灵经验（按catchTime查找）
     */
    HandleAddPetExpByCatchTime(catchTime: number, expAmount: number): Promise<boolean>;
    /**
     * 重新计算属性
     * 使用 PetCalculator 的正确计算方法，包含种族值和性格修正
     */
    private recalculateStats;
    /**
     * 获取背包中的精灵列表（按首发优先、catchTime升序排列）
     */
    GetPetsInBag(): IPetInfo[];
    /**
     * 获取首发精灵
     */
    GetDefaultPet(): IPetInfo | null;
    /**
     * 按 catchTime 获取精灵
     */
    GetPetByCatchTime(catchTime: number): IPetInfo | null;
    /**
     * 获取精灵数量信息
     */
    GetPetCount(): Promise<{
        total: number;
        inBag: number;
    }>;
    /**
     * 获取背包剩余空间
     */
    GetBagSpace(): Promise<number>;
    /**
     * Give pet to player (for mail attachments, task rewards, etc.)
     */
    GivePet(petId: number, level?: number, catchTime?: number, source?: PetObtainSource): Promise<boolean>;
    /**
     * 获取精灵Proto列表（用于登录响应等）
     */
    GetPetProtoList(pets: IPetInfo[]): PetInfoProto[];
    /**
     * �?IPetInfo 转换�?PetInfoProto
     */
    private petInfoToProto;
    /**
     * 发送 NOTE_UPDATE_PROP 推送（触发经验获得弹窗）
     * @param pets 更新的精灵列表
     * @param addition 加成百分比 * 100（例如 150 表示 1.5 倍）
     */
    private sendNoteUpdateProp;
    /**
     * 发送 NOTE_UPDATE_SKILL 推送（触发技能学习界面）
     * @param pet 精灵信息
     * @param newSkills 新学会的技能ID列表
     */
    private sendNoteUpdateSkill;
    /**
     * 处理获取可分配经验（精灵分配仪）
     */
    HandlePetGetExp(): Promise<void>;
    /**
     * 处理设置精灵经验（精灵分配仪）
     */
    HandlePetSetExp(catchTime: number, expAmount: number): Promise<void>;
    /**
     * 处理精灵进化
     * @param catchTime 精灵捕获时间
     * @param evolveIndex 进化索引（通常为1）
     */
    HandlePetEvolution(catchTime: number, evolveIndex: number): Promise<void>;
    /**
     * 处理精灵学习技能（替换技能）
     * @param catchTime 精灵捕获时间
     * @param skillId 要学习的技能ID
     * @param dropSkillId 要替换的旧技能ID
     */
    HandleStudySkill(catchTime: number, skillId: number, dropSkillId: number): Promise<void>;
    /**
     * 处理精灵技能切换（用新技能替换旧技能）
     * @param catchTime 精灵捕获时间
     * @param slot1 未使用
     * @param slot2 未使用
     * @param oldSkillId 旧技能ID - 要被替换的技能
     * @param newSkillId 新技能ID - 要学习的新技能
     */
    HandleSkillSwitch(catchTime: number, slot1: number, slot2: number, oldSkillId: number, newSkillId: number): Promise<void>;
    /**
     * 处理恢复单个精灵HP
     * CMD 2310: PET_ONE_CURE
     *
     * 功能：
     * - 恢复精灵HP到满值
     * - 非VIP用户扣除20赛尔豆
     * - VIP用户免费
     *
     * 注意：客户端会自动恢复技能PP，服务器端不需要处理
     */
    HandlePetOneCure(catchTime: number, clientCoins?: number): Promise<void>;
    /**
     * 处理技能排序
     * CMD: 2328 Skill_Sort
     *
     * 功能：调整精灵技能槽的顺序
     * @param catchTime 精灵捕获时间
     * @param skill1 第1个技能ID
     * @param skill2 第2个技能ID
     * @param skill3 第3个技能ID
     * @param skill4 第4个技能ID
     */
    HandleSkillSort(catchTime: number, skill1: number, skill2: number, skill3: number, skill4: number): Promise<void>;
    /**
     * 获取精灵技能
     * CMD: 2336
     * 只返回当前等级已学会的技能
     */
    HandleGetPetSkill(catchTime: number): Promise<void>;
}
//# sourceMappingURL=PetManager.d.ts.map