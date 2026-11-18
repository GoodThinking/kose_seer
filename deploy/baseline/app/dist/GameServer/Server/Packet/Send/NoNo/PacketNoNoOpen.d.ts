import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 开启NoNo响应包
 * CMD 9001
 *
 * 客户端期望：
 * - status == 0: 已经有NoNo
 * - status != 0: 成功获得NoNo
 */
export declare class PacketNoNoOpen extends BaseProto {
    private _data;
    constructor(status?: number, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoNoOpen.d.ts.map