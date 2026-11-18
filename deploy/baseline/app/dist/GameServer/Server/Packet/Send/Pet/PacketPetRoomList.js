"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetRoomList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PetRoomListRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetRoomListRspProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * KOSE简表：2303完整库存，2324基地展示名单，2323展示保存确认。
 */
class PacketPetRoomList extends BaseProto_1.BaseProto {
    _data;
    constructor(petList, command = CommandID_1.CommandID.PET_ROOM_LIST) {
        const proto = new PetRoomListRspProto_1.PetRoomListRspProto(command);
        super(proto.getCmdId());
        proto.setPetList(petList);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetRoomList = PacketPetRoomList;
//# sourceMappingURL=PacketPetRoomList.js.map