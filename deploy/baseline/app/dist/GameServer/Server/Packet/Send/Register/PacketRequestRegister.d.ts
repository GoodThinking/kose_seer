import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册响应数据包
 */
export declare class PacketRequestRegister {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 构建请求注册响应
     * @param result 结果码 (0=成功)
     */
    Build(result?: number): Buffer;
}
//# sourceMappingURL=PacketRequestRegister.d.ts.map