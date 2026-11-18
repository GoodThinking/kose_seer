import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取图片服务器地址响应包
 * CMD 1005
 */
export declare class PacketGetImageAddress extends BaseProto {
    private _data;
    constructor(ip: string, port: number, session: string);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetImageAddress.d.ts.map