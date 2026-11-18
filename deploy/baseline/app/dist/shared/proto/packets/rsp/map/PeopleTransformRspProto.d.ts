import { BaseProto } from '../../../base/BaseProto';
/**
 * 玩家变身响应
 * CMD: 2111 PEOPLE_TRANSFROM
 */
export declare class PeopleTransformRspProto extends BaseProto {
    userId: number;
    transId: number;
    constructor(userId?: number, transId?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=PeopleTransformRspProto.d.ts.map