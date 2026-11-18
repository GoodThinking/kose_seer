"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetInfoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息响应
 */
class GetPetInfoRspProto extends BaseProto_1.BaseProto {
    petInfo = null; // 精灵信息
    constructor() {
        super(CommandID_1.CommandID.GET_PET_INFO);
    }
    serialize(protocol = 'kose') {
        if (!this.petInfo) {
            return Buffer.alloc(0);
        }
        return this.petInfo.serialize(protocol);
    }
    setPetInfo(petInfo) {
        this.petInfo = petInfo;
        return this;
    }
}
exports.GetPetInfoRspProto = GetPetInfoRspProto;
//# sourceMappingURL=GetPetInfoRspProto.js.map