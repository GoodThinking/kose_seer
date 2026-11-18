import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 玩家移动响应包
 * CMD 1013
 */
export declare class PacketPeopleWalk extends BaseProto {
    private _data;
    constructor(walkType: number, userId: number, x: number, y: number, amfData?: Buffer);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPeopleWalk.d.ts.map