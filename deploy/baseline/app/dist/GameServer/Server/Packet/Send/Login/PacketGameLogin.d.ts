import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { IPlayerInfo } from '../../../../../shared/models';
import { LoginRspProto } from '../../../../../shared/proto';
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应数据包
 */
export declare class PacketGameLogin {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 构建游戏登录响应
     * @param userID 用户ID
     * @param result 结果码 (0=成功)
     * @param player 玩家数据 (成功时需要)
     * @param sessionKey 会话标识
     */
    Build(userID: number, result?: number, player?: IPlayerInfo, sessionKey?: string): Buffer;
    /**
     * 构建游戏登录Proto（供Player.SendPacket使用）
     */
    BuildProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto;
}
//# sourceMappingURL=PacketGameLogin.d.ts.map