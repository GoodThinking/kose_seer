"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表响应
 */
class GetPetListRspProto extends BaseProto_1.BaseProto {
    pets = []; // 精灵列表
    constructor() {
        super(CommandID_1.CommandID.GET_PET_LIST);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(1024);
        // 写入精灵数量
        writer.WriteUInt32(this.pets.length);
        // 写入每个精灵的信息
        for (const pet of this.pets) {
            if (protocol === 'xin-20261013') {
                // PetManager.getStorageList uses PetListInfo(input), not full PetInfo.
                for (const value of [pet.id, pet.catchTime, pet.level, pet.skinID, pet.shiny]) {
                    writer.WriteUInt32(value);
                }
                continue;
            }
            const petData = pet.serialize(protocol);
            writer.WriteBytes(petData);
        }
        return writer.ToBuffer();
    }
    setPets(pets) {
        this.pets = pets;
        return this;
    }
}
exports.GetPetListRspProto = GetPetListRspProto;
//# sourceMappingURL=GetPetListRspProto.js.map