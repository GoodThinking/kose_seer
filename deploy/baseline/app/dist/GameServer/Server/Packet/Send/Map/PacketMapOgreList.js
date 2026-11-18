"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMapOgreList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MapOgreListRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/MapOgreListRspProto");
/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应包
 */
class PacketMapOgreList extends BaseProto_1.BaseProto {
    _data;
    constructor(ogres) {
        super(CommandID_1.CommandID.MAP_OGRE_LIST);
        const proto = new MapOgreListRspProto_1.MapOgreListRspProto();
        proto.setOgres(ogres);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMapOgreList = PacketMapOgreList;
//# sourceMappingURL=PacketMapOgreList.js.map