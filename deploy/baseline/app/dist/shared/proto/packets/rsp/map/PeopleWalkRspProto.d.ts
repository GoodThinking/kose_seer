import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动响应
 */
export declare class PeopleWalkRspProto extends BaseProto {
    walkType: number;
    userId: number;
    x: number;
    y: number;
    amfData: Buffer;
    constructor(walkType?: number, userId?: number, x?: number, y?: number, amfData?: Buffer);
    serialize(): Buffer;
    setWalkType(value: number): this;
    setUserId(value: number): this;
    setPosition(x: number, y: number): this;
    setAmfData(data: Buffer): this;
}
//# sourceMappingURL=PeopleWalkRspProto.d.ts.map