import { BaseProto } from '../../../base/BaseProto';
/**
 * 扭蛋机请求
 * CMD 3201
 *
 * 请求格式：按钮编号(4)
 * - 1 = 单抽
 * - 2 = 5连抽
 * - 3 = 10连抽
 */
export declare class GachaReqProto extends BaseProto {
    times: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GachaReqProto.d.ts.map