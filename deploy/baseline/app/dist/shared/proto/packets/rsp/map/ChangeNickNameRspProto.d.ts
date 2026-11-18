import { BaseProto } from '../../../base/BaseProto';
/**
 * 修改昵称响应
 * CMD: 2061 CHANG_NICK_NAME
 */
export declare class ChangeNickNameRspProto extends BaseProto {
    userId: number;
    newNick: string;
    constructor(userId?: number, newNick?: string);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChangeNickNameRspProto.d.ts.map