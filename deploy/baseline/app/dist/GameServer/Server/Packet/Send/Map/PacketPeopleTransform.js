"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPeopleTransform = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PeopleTransformRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/PeopleTransformRspProto");
/**
 * 玩家变身响应包
 * CMD 1011
 */
class PacketPeopleTransform extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, transId) {
        super(CommandID_1.CommandID.PEOPLE_TRANSFROM);
        const proto = new PeopleTransformRspProto_1.PeopleTransformRspProto();
        proto.userId = userId;
        proto.transId = transId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPeopleTransform = PacketPeopleTransform;
//# sourceMappingURL=PacketPeopleTransform.js.map