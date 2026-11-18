import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取简单用户信息响应包
 * CMD 1005
 */
export declare class PacketGetSimUserInfo extends BaseProto {
    private _data;
    constructor(userId: number, nick: string, color: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetSimUserInfo.d.ts.map