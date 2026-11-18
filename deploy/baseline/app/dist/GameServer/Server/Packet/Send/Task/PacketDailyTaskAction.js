"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketDailyTaskAction = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
class PacketDailyTaskAction extends BaseProto_1.BaseProto {
    constructor(commandId, result = 0) {
        super(commandId);
        this.setResult(result);
    }
    serialize() {
        return Buffer.alloc(4);
    }
}
exports.PacketDailyTaskAction = PacketDailyTaskAction;
//# sourceMappingURL=PacketDailyTaskAction.js.map