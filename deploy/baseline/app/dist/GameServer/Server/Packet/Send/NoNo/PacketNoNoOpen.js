"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoOpen = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoOpenRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoOpenRspProto");
/**
 * 开启NoNo响应包
 * CMD 9001
 *
 * 客户端期望：
 * - status == 0: 已经有NoNo
 * - status != 0: 成功获得NoNo
 */
class PacketNoNoOpen extends BaseProto_1.BaseProto {
    _data;
    constructor(status = 1, result = 0) {
        super(CommandID_1.CommandID.NONO_OPEN);
        this.setResult(result);
        const proto = new NoNoOpenRspProto_1.NoNoOpenRspProto();
        proto.status = status;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoOpen = PacketNoNoOpen;
//# sourceMappingURL=PacketNoNoOpen.js.map