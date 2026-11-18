import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应
 */
export declare class LoadPercentRspProto extends BaseProto {
    id: number;
    percent: number;
    constructor(id?: number, percent?: number);
    serialize(): Buffer;
    setData(id: number, percent: number): this;
}
//# sourceMappingURL=LoadPercentRspProto.d.ts.map