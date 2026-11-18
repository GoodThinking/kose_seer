import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 舞蹈动作响应包
 * CMD 1009
 */
export declare class PacketDanceAction extends BaseProto {
    private _data;
    constructor(userId: number, actionId: number, actionType: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketDanceAction.d.ts.map