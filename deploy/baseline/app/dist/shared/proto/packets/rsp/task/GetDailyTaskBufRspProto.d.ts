import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取每日任务缓存响应
 * CMD 2234: GET_DAILY_TASK_BUF
 *
 * 响应格式：value1(4) + value2(4)
 */
export declare class GetDailyTaskBufRspProto extends BaseProto {
    value1: number;
    value2: number;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=GetDailyTaskBufRspProto.d.ts.map