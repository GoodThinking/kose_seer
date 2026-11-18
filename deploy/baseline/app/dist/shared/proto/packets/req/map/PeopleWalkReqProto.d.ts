import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动请求
 */
export declare class PeopleWalkReqProto extends BaseProto {
    walkType: number;
    x: number;
    y: number;
    amfData: Buffer;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PeopleWalkReqProto;
}
//# sourceMappingURL=PeopleWalkReqProto.d.ts.map