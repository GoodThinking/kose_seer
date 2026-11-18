"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetRoomListReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表请求
 */
class PetRoomListReqProto extends BaseProto_1.BaseProto {
    roomType = 0; // KOSE客户端此字段为房间主人UID；XIN保持既有参数
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetRoomListReqProto();
        if (buffer.length >= 4) {
            proto.roomType = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.PetRoomListReqProto = PetRoomListReqProto;
//# sourceMappingURL=PetRoomListReqProto.js.map