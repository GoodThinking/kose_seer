"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFightNpcMonster = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FightNpcMonsterRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/FightNpcMonsterRspProto");
/**
 * 挑战野外精灵响应包
 * CMD 2408
 */
class PacketFightNpcMonster extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.FIGHT_NPC_MONSTER);
        const proto = new FightNpcMonsterRspProto_1.FightNpcMonsterRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFightNpcMonster = PacketFightNpcMonster;
//# sourceMappingURL=PacketFightNpcMonster.js.map