import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度请求
 */
export declare class LoadPercentReqProto extends BaseProto {
    percent: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): LoadPercentReqProto;
}
//# sourceMappingURL=LoadPercentReqProto.d.ts.map