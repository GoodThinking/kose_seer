"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShinyConfigReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 请求异色配置
 * CMD 109001
 */
class ShinyConfigReqProto extends BaseProto_1.BaseProto {
    clientVersion = 0; // 客户端缓存的配置版本
    constructor() {
        super(CommandID_1.CommandID.SHINY_CONFIG_GET);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.clientVersion = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.ShinyConfigReqProto = ShinyConfigReqProto;
//# sourceMappingURL=ShinyConfigReqProto.js.map