import { BaseManager } from '../Base/BaseManager';
import { SeerMapUserInfoProto } from '../../../shared/proto/common/SeerMapUserInfoProto';
import { EnterMapReqProto } from '../../../shared/proto/packets/req/map/EnterMapReqProto';
import { IPlayerInfo } from '../../../shared/models';
import { PlayerInstance } from '../Player/PlayerInstance';
import { GameEventBus } from '../Event/GameEventBus';
/**
 * 鍦板浘绠＄悊鍣?
 * 澶勭悊鍦板浘鐩稿叧鐨勬墍鏈夐€昏緫锛氳繘鍏ャ€佺寮€鍦板浘銆佺帺瀹剁Щ鍔ㄣ€佽亰澶╃瓑
 *
 * 閲嶆瀯璇存槑锛?
 * - 浠庡叏灞€鍗曚緥鏀逛负 Player 瀹炰緥 Manager
 * - 缁ф壙 BaseManager 鑾峰緱渚挎嵎鏂规硶
 * - 涓嶅啀闇€瑕佷紶 userId 鍙傛暟
 */
export declare class MapManager extends BaseManager {
    private _onlineTracker;
    private _mapVisibility;
    private _playerRepo;
    constructor(player: PlayerInstance);
    RegisterEvents(eventBus: GameEventBus): void;
    private OnPlayerLogout;
    /**
     * 鏋勫缓鈥滃綋鍓嶇┛鎴粹€濈殑鏈嶈鍒楄〃锛堢敤浜庝汉鐗╂樉绀猴級
     * 浼樺厛浣跨敤 clothIds锛涜嫢缂哄け鍒欏洖閫€鍒?clothes锛堝吋瀹硅€佹暟鎹級銆?   */
    private BuildWornClothes;
    /**
     * 澶勭悊杩涘叆鍦板浘
     */
    HandleEnterMap(req: EnterMapReqProto): Promise<void>;
    HandleLeaveMap(): Promise<void>;
    /**
     * 澶勭悊鍦板浘鐜╁鍒楄〃璇锋眰
     */
    HandleListMapPlayer(): Promise<void>;
    /**
     * 澶勭悊鍦板浘鎬墿鍒楄〃
     */
    HandleMapOgreList(): Promise<void>;
    /**
     * 鎺ㄩ€佸湴鍥綛OSS鍒楄〃锛堝彧鍦ㄦ湁BOSS鏃舵帹閫侊級
     * @param mapId 鍦板浘ID
     */
    sendMapBossList(mapId: number): Promise<void>;
    /**
     * 澶勭悊鑾峰彇绠€鍗曠敤鎴蜂俊鎭?
     */
    HandleGetSimUserInfo(targetId: number): Promise<void>;
    /**
     * 澶勭悊淇敼鏄电О
     */
    sendMapPlayerList(mapId: number): Promise<void>;
    sendMapOgreList(mapId: number): Promise<void>;
    buildUserInfo(userId: number, playerData: IPlayerInfo, x: number, y: number, playerInstance?: PlayerInstance): SeerMapUserInfoProto;
    /**
     * 鏄惁澶勪簬"闆烽洦澶?锛堣但灏斿崱鏄熼浄浼婂嚭鍦烘潯浠讹級
     * 鐢ㄦ椂闂存ā鎷燂細姣忓皬鏃剁殑 20~40 鍒嗛挓涓洪浄闆ㄥぉ
     */
    private IsLeiyiWeather;
    /**
     * 浠婃棩鐩栦簹鍑虹幇鐨勫湴鍥?ID
     * 浣跨敤 BossAbilityConfig 涓殑鍛ㄥ嚑鍑虹幇瑙勫垯
     */
    private GetGaiyaMapIDForToday;
}
//# sourceMappingURL=MapManager.d.ts.map