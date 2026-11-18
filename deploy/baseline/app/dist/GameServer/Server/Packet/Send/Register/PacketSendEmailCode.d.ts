import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应数据包
 */
export declare class PacketSendEmailCode {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 构建发送验证码响应
     * @param emailCodeRes 验证码响应（32字节）
     * @param result 结果码 (0=成功, 5001=系统错误)
     */
    Build(emailCodeRes: string, result?: number): Buffer;
}
//# sourceMappingURL=PacketSendEmailCode.d.ts.map