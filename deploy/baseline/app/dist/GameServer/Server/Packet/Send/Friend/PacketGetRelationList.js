"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetRelationList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetRelationListRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/GetRelationListRspProto");
/**
 * 获取好友关系列表响应包
 * CMD 2150: GET_RELATION_LIST
 */
class PacketGetRelationList extends BaseProto_1.BaseProto {
    _data;
    constructor(friendList, blackList, result = 0) {
        super(CommandID_1.CommandID.GET_RELATION_LIST);
        const proto = new GetRelationListRspProto_1.GetRelationListRspProto(friendList, blackList);
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetRelationList = PacketGetRelationList;
//# sourceMappingURL=PacketGetRelationList.js.map