import { BaseProto } from '../../../base/BaseProto';
/**
 * 玩家变身请求
 * CMD: 2111 PEOPLE_TRANSFROM
 */
export declare class PeopleTransformReqProto extends BaseProto {
    transId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=PeopleTransformReqProto.d.ts.map