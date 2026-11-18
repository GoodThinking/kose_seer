"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLoadPercent = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const LoadPercentRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/LoadPercentRspProto");
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应包
 */
class PacketLoadPercent extends BaseProto_1.BaseProto {
    _data;
    constructor(id, percent) {
        super(CommandID_1.CommandID.LOAD_PERCENT);
        const proto = new LoadPercentRspProto_1.LoadPercentRspProto(id, percent);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketLoadPercent = PacketLoadPercent;
//# sourceMappingURL=PacketLoadPercent.js.map