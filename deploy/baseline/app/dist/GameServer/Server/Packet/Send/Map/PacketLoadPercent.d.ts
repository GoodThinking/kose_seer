import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应包
 */
export declare class PacketLoadPercent extends BaseProto {
    private _data;
    constructor(id: number, percent: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketLoadPercent.d.ts.map