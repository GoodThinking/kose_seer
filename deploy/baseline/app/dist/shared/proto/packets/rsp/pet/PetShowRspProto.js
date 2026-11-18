"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetShowRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2305 PET_SHOW] 展示精灵响应
 * PetShowInfo: userID(4) + catchTime(4) + petID(4) + flag(4) + dv(4) + skinID(4)
 */
class PetShowRspProto extends BaseProto_1.BaseProto {
    userId = 0; // 用户ID
    catchTime = 0; // 捕获时间
    petId = 0; // 精灵ID
    flag = 0; // 标志
    dv = 31; // 个体值
    skinId = 0; // 皮肤ID
    constructor() {
        super(CommandID_1.CommandID.PET_SHOW);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(24);
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.catchTime);
        writer.WriteUInt32(this.petId);
        writer.WriteUInt32(this.flag);
        writer.WriteUInt32(this.dv);
        writer.WriteUInt32(this.skinId);
        return writer.ToBuffer();
    }
    setUserId(userId) {
        this.userId = userId;
        return this;
    }
    setCatchTime(catchTime) {
        this.catchTime = catchTime;
        return this;
    }
    setPetId(petId) {
        this.petId = petId;
        return this;
    }
    setFlag(flag) {
        this.flag = flag;
        return this;
    }
    setDv(dv) {
        this.dv = dv;
        return this;
    }
    setSkinId(skinId) {
        this.skinId = skinId;
        return this;
    }
}
exports.PetShowRspProto = PetShowRspProto;
//# sourceMappingURL=PetShowRspProto.js.map