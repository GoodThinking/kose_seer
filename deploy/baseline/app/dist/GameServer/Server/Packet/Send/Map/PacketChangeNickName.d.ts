import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 修改昵称响应包
 * CMD 1007
 */
export declare class PacketChangeNickName extends BaseProto {
    private _data;
    constructor(userId: number, newNick: string);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketChangeNickName.d.ts.map