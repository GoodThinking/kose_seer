/**
 * 玩家仓库
 */
import { BaseRepository } from '../BaseRepository';
import { IPlayerInfo } from '../../../shared/models';
/**
 * 数据库玩家行类型
 */
interface IPlayerRow {
    user_id: number;
    nick: string;
    reg_time: number;
    vip: number;
    viped: number;
    ds_flag: number;
    color: number;
    texture: number;
    energy: number;
    coins: number;
    fight_badge: number;
    map_id: number;
    pos_x: number;
    pos_y: number;
    time_today: number;
    time_limit: number;
    login_cnt: number;
    inviter: number;
    vip_level: number;
    vip_value: number;
    vip_stage: number;
    vip_end_time: number;
    teacher_id: number;
    student_id: number;
    graduation_count: number;
    pet_max_lev: number;
    pet_all_num: number;
    mon_king_win: number;
    mess_win: number;
    cur_stage: number;
    max_stage: number;
    max_arena_wins: number;
    has_nono: number;
    super_nono: number;
    nono_state: number;
    nono_color: number;
    nono_nick: string;
    nono_flag: number;
    nono_power: number;
    nono_mate: number;
    nono_iq: number;
    nono_ai: number;
    nono_birth: number;
    nono_charge_time: number;
    nono_super_energy: number;
    nono_super_level: number;
    nono_super_stage: number;
    badge: number;
    cur_title: number;
    team_id: number;
    extra_data: string | null;
}
interface IPlayerColumnMeta {
    name: string;
    type: string;
}
export declare class PlayerRepository extends BaseRepository<IPlayerRow> {
    protected _tableName: string;
    private _playerColumnsMeta;
    /**
     * 根据用户ID查找玩家
     */
    FindByUserId(userId: number): Promise<IPlayerInfo | null>;
    /**
     * 根据昵称查找玩家
     */
    FindByNick(nick: string): Promise<IPlayerInfo | null>;
    /**
     * 创建玩家
     * @param userId 用户ID
     * @param nick 昵称
     * @param color 颜色
     */
    CreatePlayer(userId: number, nick: string, color?: number): Promise<boolean>;
    /**
     * 检查昵称是否已存在
     */
    NickExists(nick: string): Promise<boolean>;
    /**
     * 更新玩家位置
     */
    UpdatePosition(userId: number, mapId: number, posX: number, posY: number): Promise<boolean>;
    /**
     * 更新玩家地图（仅地图ID）
     */
    UpdatePlayerMap(userId: number, mapId: number): Promise<boolean>;
    /**
     * 更新货币
     */
    UpdateCurrency(userId: number, energy?: number, coins?: number, gold?: number): Promise<boolean>;
    /**
     * 增加货币
     */
    AddCurrency(userId: number, energy?: number, coins?: number, gold?: number): Promise<boolean>;
    /**
     * 更新登录次数
     */
    IncrementLoginCount(userId: number): Promise<boolean>;
    /**
     * 更新VIP信息
     */
    UpdateVIP(userId: number, vip: number, vipLevel: number, vipEndTime: number): Promise<boolean>;
    /**
     * 更新昵称
     */
    UpdateNickname(userId: number, nick: string): Promise<boolean>;
    /**
     * 更新颜色
     */
    UpdateColor(userId: number, color: number): Promise<boolean>;
    /**
     * 更新可分配经验
     */
    UpdateAllocatableExp(userId: number, allocatableExp: number): Promise<boolean>;
    /**
     * 更新服装ID列表
     */
    UpdateClothIds(userId: number, clothIds: number[]): Promise<boolean>;
    /**
     * 更新飞行模式
     */
    UpdateFlyMode(userId: number, flyMode: number): Promise<boolean>;
    /**
     * 更新 NoNo 标志（是否拥有 NoNo）
     */
    UpdateNoNoFlag(userId: number, flag: number): Promise<boolean>;
    /**
     * 更新 NoNo 昵称
     */
    UpdateNoNoNick(userId: number, nick: string): Promise<boolean>;
    /**
     * 更新 NoNo 颜色
     */
    UpdateNoNoColor(userId: number, color: number): Promise<boolean>;
    /**
     * 更新 NoNo 体力值
     */
    UpdateNoNoPower(userId: number, power: number): Promise<boolean>;
    /**
     * 更新 NoNo 心情值
     */
    UpdateNoNoMate(userId: number, mate: number): Promise<boolean>;
    /**
     * 更新 NoNo 智商
     */
    UpdateNoNoIq(userId: number, iq: number): Promise<boolean>;
    /**
     * 更新 NoNo AI
     */
    UpdateNoNoAi(userId: number, ai: number): Promise<boolean>;
    /**
     * 更新 NoNo 超能等级
     */
    UpdateNoNoSuperLevel(userId: number, level: number): Promise<boolean>;
    /**
     * 更新 NoNo 充电时间
     */
    UpdateNoNoChargeTime(userId: number, chargeTime: number): Promise<boolean>;
    /**
     * 更新 NoNo 超能能量
     */
    UpdateNoNoSuperEnergy(userId: number, energy: number): Promise<boolean>;
    /**
     * 更新 NoNo 超能阶段
     */
    UpdateNoNoSuperStage(userId: number, stage: number): Promise<boolean>;
    /**
     * 增加 NoNo 体力和心情
     */
    AddNoNoEnergyMate(userId: number, powerDelta: number, mateDelta: number): Promise<boolean>;
    /**
     * 开启超级 NoNo
     */
    EnableSuperNoNo(userId: number, level: number): Promise<boolean>;
    /**
     * 批量更新 NoNo 数据（用于复杂操作）
     */
    UpdateNoNoData(userId: number, data: Partial<{
        flag: number;
        nick: string;
        color: number;
        power: number;
        mate: number;
        iq: number;
        ai: number;
        superNono: boolean;
        superLevel: number;
        superEnergy: number;
        superStage: number;
        birth: number;
        chargeTime: number;
        state: number;
    }>): Promise<boolean>;
    /**
     * 转换为 IPlayerInfo
     */
    /**
     * 获取 players 表列信息（带缓存）
     */
    GetPlayerColumnsMeta(): Promise<Map<string, IPlayerColumnMeta>>;
    /**
     * 根据 user_id 批量更新 players 指定列
     */
    UpdateByUserIdColumns(userId: number, updates: Record<string, any>): Promise<boolean>;
    private toPlayerInfo;
}
export {};
//# sourceMappingURL=PlayerRepository.d.ts.map