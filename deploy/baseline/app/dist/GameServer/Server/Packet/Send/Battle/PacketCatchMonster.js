"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketCatchMonster = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const CatchMonsterRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/CatchMonsterRspProto");
/**
 * 捕捉精灵包
 * CMD 2409
 */
class PacketCatchMonster extends BaseProto_1.BaseProto {
    _data;
    constructor(catchTime, petId) {
        super(CommandID_1.CommandID.CATCH_MONSTER);
        const proto = new CatchMonsterRspProto_1.CatchMonsterRspProto();
        proto.setCatchTime(catchTime);
        proto.setPetId(petId);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketCatchMonster = PacketCatchMonster;
//# sourceMappingURL=PacketCatchMonster.js.map