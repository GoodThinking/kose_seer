import { BaseProto } from '../../../base/BaseProto';
/**
 * 黑名单信息接口
 */
export interface IBlackInfo {
    userId: number;
    nickname: string;
    color: number;
}
/**
 * 黑名单列表响应
 * CMD 2159
 *
 * 响应格式:
 * - blackCount(4)
 * - [BlackInfo]...
 *   - userID(4)
 *   - nickname(16)
 *   - color(4)
 */
export declare class BlackListRspProto extends BaseProto {
    blackList: IBlackInfo[];
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setBlackList(blackList: IBlackInfo[]): this;
}
//# sourceMappingURL=BlackListRspProto.d.ts.map