"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoGetChip = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const NoNoGetChipRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoGetChipRspProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * 获取NoNo芯片响应包
 */
class PacketNoNoGetChip extends BaseProto_1.BaseProto {
    _data;
    constructor(chipId, chipCount) {
        super(CommandID_1.CommandID.NONO_GET_CHIP);
        const proto = new NoNoGetChipRspProto_1.NoNoGetChipRspProto()
            .setChipId(chipId)
            .setChipCount(chipCount);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoGetChip = PacketNoNoGetChip;
//# sourceMappingURL=PacketNoNoGetChip.js.map