import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 接受每日任务响应包
 * CMD 2231
 *
 * 基于Lua端实现：emptyResponse(2231, 4)
 * 返回4字节的0
 */
export declare class PacketAcceptDailyTask extends BaseProto {
    private _data;
    constructor(result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketAcceptDailyTask.d.ts.map