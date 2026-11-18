import { BaseProto } from '../../base/BaseProto';
/**
 * 通用空响应 Proto
 * 用于只返回 result 的简单命令
 */
export declare class EmptyRspProto extends BaseProto {
    constructor(cmdId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=EmptyRspProto.d.ts.map