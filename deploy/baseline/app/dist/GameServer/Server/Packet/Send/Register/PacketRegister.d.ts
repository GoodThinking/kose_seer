import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
/**
 * [CMD: REGISTER (2)] 注册账号响应数据包
 */
export declare class PacketRegister {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 构建注册账号响应
     * @param userID 新注册的米米号 (成功时返回)
     * @param result 结果码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
     */
    Build(userID: number, result?: number): Buffer;
}
//# sourceMappingURL=PacketRegister.d.ts.map