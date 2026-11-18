import { BaseProto } from '../../../base/BaseProto';
/**
 * 修改昵称请求
 * CMD: 2061 CHANG_NICK_NAME
 */
export declare class ChangeNickNameReqProto extends BaseProto {
    newNick: string;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeNickNameReqProto.d.ts.map