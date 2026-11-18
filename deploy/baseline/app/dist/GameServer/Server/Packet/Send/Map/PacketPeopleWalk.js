"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPeopleWalk = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PeopleWalkRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/PeopleWalkRspProto");
/**
 * 玩家移动响应包
 * CMD 1013
 */
class PacketPeopleWalk extends BaseProto_1.BaseProto {
    _data;
    constructor(walkType, userId, x, y, amfData = Buffer.alloc(0)) {
        super(CommandID_1.CommandID.PEOPLE_WALK);
        const proto = new PeopleWalkRspProto_1.PeopleWalkRspProto();
        proto.walkType = walkType;
        proto.userId = userId;
        proto.x = x;
        proto.y = y;
        proto.amfData = amfData;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPeopleWalk = PacketPeopleWalk;
//# sourceMappingURL=PacketPeopleWalk.js.map