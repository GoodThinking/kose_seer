"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMapHot = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MapHotRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/MapHotRspProto");
/**
 * 地图热度响应包
 * CMD 1004
 */
class PacketMapHot extends BaseProto_1.BaseProto {
    _data;
    constructor(maps) {
        super(CommandID_1.CommandID.MAP_HOT);
        const proto = new MapHotRspProto_1.MapHotRspProto();
        proto.maps = maps;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMapHot = PacketMapHot;
//# sourceMappingURL=PacketMapHot.js.map