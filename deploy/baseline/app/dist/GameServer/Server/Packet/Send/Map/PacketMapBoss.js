"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMapBoss = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MapBossRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/MapBossRspProto");
/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应包
 */
class PacketMapBoss extends BaseProto_1.BaseProto {
    _data;
    constructor(bosses) {
        super(CommandID_1.CommandID.MAP_BOSS);
        const proto = new MapBossRspProto_1.MapBossRspProto();
        proto.setBosses(bosses);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMapBoss = PacketMapBoss;
//# sourceMappingURL=PacketMapBoss.js.map