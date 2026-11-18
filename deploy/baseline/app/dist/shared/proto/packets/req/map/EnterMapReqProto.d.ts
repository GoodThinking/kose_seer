import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2001 ENTER_MAP] 进入地图请求
 */
export declare class EnterMapReqProto extends BaseProto {
    mapType: number;
    mapId: number;
    x: number;
    y: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): EnterMapReqProto;
}
//# sourceMappingURL=EnterMapReqProto.d.ts.map