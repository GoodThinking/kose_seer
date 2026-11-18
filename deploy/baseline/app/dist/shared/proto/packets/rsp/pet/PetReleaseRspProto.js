"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetReleaseRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2304 PET_RELEASE] 释放精灵响应
 * Response: homeEnergy(4) + firstPetTime(4) + flag(4) + [PetInfo]
 */
class PetReleaseRspProto extends BaseProto_1.BaseProto {
    homeEnergy = 0; // 家园能量
    firstPetTime = 0; // 首个精灵时间
    flag = 0; // 标志 (1=包含精灵信息)
    petInfo = null; // 精灵信息（flag=1时）
    constructor() {
        super(CommandID_1.CommandID.PET_RELEASE);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(1024);
        writer.WriteUInt32(this.homeEnergy);
        writer.WriteUInt32(this.firstPetTime);
        writer.WriteUInt32(this.flag);
        // 如果flag != 0，写入精灵信息
        if (this.flag !== 0 && this.petInfo) {
            const petData = this.petInfo.serialize(protocol);
            writer.WriteBytes(petData);
        }
        return writer.ToBuffer();
    }
    setHomeEnergy(homeEnergy) {
        this.homeEnergy = homeEnergy;
        return this;
    }
    setFirstPetTime(firstPetTime) {
        this.firstPetTime = firstPetTime;
        return this;
    }
    setFlag(flag) {
        this.flag = flag;
        return this;
    }
    setPetInfo(petInfo) {
        this.petInfo = petInfo;
        return this;
    }
}
exports.PetReleaseRspProto = PetReleaseRspProto;
//# sourceMappingURL=PetReleaseRspProto.js.map