import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应数据包
 */
export declare class PacketCreateRole {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 构建创建角色响应
     * @param userID 用户ID
     * @param result 结果码 (0=成功, 5001=系统错误)
     * @param sessionKey 会话密钥 (成功时需要)
     */
    Build(userID: number, result?: number, sessionKey?: string): Buffer;
}
//# sourceMappingURL=PacketCreateRole.d.ts.map