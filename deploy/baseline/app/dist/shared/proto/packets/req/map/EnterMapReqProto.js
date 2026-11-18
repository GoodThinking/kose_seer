"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterMapReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2001 ENTER_MAP] 进入地图请求
 */
class EnterMapReqProto extends BaseProto_1.BaseProto {
    mapType = 0; // 地图类型
    mapId = 0; // 地图ID
    x = 500; // X坐标
    y = 300; // Y坐标
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new EnterMapReqProto();
        if (buffer.length >= 16) {
            proto.mapType = buffer.readUInt32BE(0);
            proto.mapId = buffer.readUInt32BE(4);
            proto.x = buffer.readUInt32BE(8);
            proto.y = buffer.readUInt32BE(12);
        }
        return proto;
    }
}
exports.EnterMapReqProto = EnterMapReqProto;
//# sourceMappingURL=EnterMapReqProto.js.map