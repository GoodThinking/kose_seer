"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightNpcMonsterRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 挑战野外精灵响应
 * CMD 2408
 *
 * 响应格式：空包（成功后直接发送 NOTE_READY_TO_FIGHT 2503）
 */
class FightNpcMonsterRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.FIGHT_NPC_MONSTER);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    deserialize(buffer) {
        // Empty response
    }
}
exports.FightNpcMonsterRspProto = FightNpcMonsterRspProto;
//# sourceMappingURL=FightNpcMonsterRspProto.js.map