import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片响应
 * 响应: padding1(4) + padding2(4) + padding3(4) + count(4) + [chipId(4) + chipCount(4)]...
 */
export declare class NoNoGetChipRspProto extends BaseProto {
    chipId: number;
    chipCount: number;
    constructor();
    serialize(): Buffer;
    setChipId(chipId: number): this;
    setChipCount(chipCount: number): this;
}
//# sourceMappingURL=NoNoGetChipRspProto.d.ts.map