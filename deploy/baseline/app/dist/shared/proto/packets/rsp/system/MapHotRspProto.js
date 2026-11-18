"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapHotRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 1004 MAP_HOT] 地图热度响应
 */
class MapHotRspProto extends BaseProto_1.BaseProto {
    maps = []; // 地图列表
    constructor() {
        super(CommandID_1.CommandID.MAP_HOT);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(1024);
        writer.WriteUInt32(this.maps.length);
        for (const map of this.maps) {
            writer.WriteUInt32(map.mapId);
            writer.WriteUInt32(map.onlineCount);
        }
        return writer.ToBuffer();
    }
    setMaps(maps) {
        this.maps = maps;
        return this;
    }
}
exports.MapHotRspProto = MapHotRspProto;
//# sourceMappingURL=MapHotRspProto.js.map