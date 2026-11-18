"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetRoomListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表响应
 *
 * 格式：
 * - count (uint32): 精灵数量
 * - 多个 PetListInfo:
 *   - id (uint32): 精灵ID
 *   - catchTime (uint32): 捕获时间
 *   - skinID (uint32): 皮肤ID
 */
class PetRoomListRspProto extends BaseProto_1.BaseProto {
    petList = [];
    constructor(command = CommandID_1.CommandID.PET_ROOM_LIST) {
        super(command);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(1024);
        // 写入精灵数量
        writer.WriteUInt32(this.petList.length);
        // 写入每个精灵的信息
        for (const pet of this.petList) {
            writer.WriteUInt32(pet.id);
            writer.WriteUInt32(pet.catchTime);
            writer.WriteUInt32(pet.skinID);
        }
        return writer.ToBuffer();
    }
    setPetList(petList) {
        this.petList = petList;
        return this;
    }
}
exports.PetRoomListRspProto = PetRoomListRspProto;
//# sourceMappingURL=PetRoomListRspProto.js.map