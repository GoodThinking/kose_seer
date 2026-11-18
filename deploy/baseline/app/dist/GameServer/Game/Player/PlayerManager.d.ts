import { PlayerInstance } from './PlayerInstance';
import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { ServerManager } from '../Server/ServerManager';
/**
 * 玩家管理器
 * 管理所有在线玩家
 */
export declare class PlayerManager {
    private static _instance;
    private _players;
    private _packetBuilder;
    private _serverManager?;
    private constructor();
    /**
     * 获取单例实例
     */
    static GetInstance(packetBuilder?: PacketBuilder): PlayerManager;
    /**
     * 设置 ServerManager（用于在线状态追踪）
     */
    SetServerManager(serverManager: ServerManager): void;
    /**
     * 创建玩家实例
     */
    CreatePlayer(session: IClientSession, userID: number, nickname: string): Promise<PlayerInstance>;
    /**
     * 获取玩家实例
     */
    GetPlayer(userID: number): PlayerInstance | undefined;
    /**
     * 移除玩家实例
     */
    RemovePlayer(userID: number): Promise<void>;
    /**
     * 获取在线玩家数量
     */
    GetOnlineCount(): number;
    /**
     * 获取所有在线玩家
     */
    GetAllPlayers(): PlayerInstance[];
    /**
     * 检查玩家是否在线
     */
    IsPlayerOnline(userID: number): boolean;
}
//# sourceMappingURL=PlayerManager.d.ts.map