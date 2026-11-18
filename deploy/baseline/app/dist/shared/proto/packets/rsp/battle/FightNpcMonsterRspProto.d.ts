import { BaseProto } from '../../../base/BaseProto';
/**
 * 挑战野外精灵响应
 * CMD 2408
 *
 * 响应格式：空包（成功后直接发送 NOTE_READY_TO_FIGHT 2503）
 */
export declare class FightNpcMonsterRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=FightNpcMonsterRspProto.d.ts.map