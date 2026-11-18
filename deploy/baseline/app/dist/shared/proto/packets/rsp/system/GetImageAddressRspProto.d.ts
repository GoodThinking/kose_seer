import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址响应
 */
export declare class GetImageAddressRspProto extends BaseProto {
    ip: string;
    port: number;
    session: string;
    constructor();
    serialize(): Buffer;
    setIp(ip: string): this;
    setPort(port: number): this;
    setSession(session: string): this;
}
//# sourceMappingURL=GetImageAddressRspProto.d.ts.map