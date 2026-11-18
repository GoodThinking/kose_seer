import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册
 *
 * 预留接口，暂无请求参数
 */
export declare class RequestRegisterReqProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer解析请求注册
     */
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=RequestRegisterReqProto.d.ts.map