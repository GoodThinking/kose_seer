import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { SeerMapUserInfoProto } from '../../../../../shared/proto/common/SeerMapUserInfoProto';
/**
 * 进入地图响应包
 * CMD 1001
 */
export declare class PacketEnterMap extends BaseProto {
    private _data;
    constructor(userInfo?: SeerMapUserInfoProto, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketEnterMap.d.ts.map