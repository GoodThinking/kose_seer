import { BaseProto } from '../../../base/BaseProto';
/**
 * 舞蹈动作响应
 * CMD: 2103 DANCE_ACTION
 */
export declare class DanceActionRspProto extends BaseProto {
    userId: number;
    actionId: number;
    actionType: number;
    constructor(userId?: number, actionId?: number, actionType?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=DanceActionRspProto.d.ts.map