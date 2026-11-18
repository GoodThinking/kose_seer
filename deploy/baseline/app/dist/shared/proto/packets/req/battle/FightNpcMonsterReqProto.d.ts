import { BaseProto } from '../../../base/BaseProto';
/**
 * 挑战野外精灵请求
 * CMD 2408
 */
export declare class FightNpcMonsterReqProto extends BaseProto {
    monsterIndex: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=FightNpcMonsterReqProto.d.ts.map