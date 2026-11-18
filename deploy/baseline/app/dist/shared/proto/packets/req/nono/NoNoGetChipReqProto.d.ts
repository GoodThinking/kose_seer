import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 * 请求: chipType(4)
 */
export declare class NoNoGetChipReqProto extends BaseProto {
    chipType: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): NoNoGetChipReqProto;
}
//# sourceMappingURL=NoNoGetChipReqProto.d.ts.map