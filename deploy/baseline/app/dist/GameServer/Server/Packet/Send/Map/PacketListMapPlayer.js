"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketListMapPlayer = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ListMapPlayerRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto");
/**
 * 地图玩家列表响应包
 * CMD 2003
 */
class PacketListMapPlayer extends BaseProto_1.BaseProto {
    _data;
    constructor(players, protocol = 'kose') {
        super(CommandID_1.CommandID.LIST_MAP_PLAYER);
        const proto = new ListMapPlayerRspProto_1.ListMapPlayerRspProto();
        proto.players = players;
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketListMapPlayer = PacketListMapPlayer;
//# sourceMappingURL=PacketListMapPlayer.js.map