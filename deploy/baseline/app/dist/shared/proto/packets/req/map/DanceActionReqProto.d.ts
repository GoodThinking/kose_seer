import { BaseProto } from '../../../base/BaseProto';
/**
 * 舞蹈动作请求
 * CMD: 2103 DANCE_ACTION
 */
export declare class DanceActionReqProto extends BaseProto {
    actionId: number;
    actionType: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=DanceActionReqProto.d.ts.map