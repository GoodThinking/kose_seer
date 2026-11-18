"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GachaReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 扭蛋机请求
 * CMD 3201
 *
 * 请求格式：按钮编号(4)
 * - 1 = 单抽
 * - 2 = 5连抽
 * - 3 = 10连抽
 */
class GachaReqProto extends BaseProto_1.BaseProto {
    times = 1;
    constructor() {
        super(CommandID_1.CommandID.EGG_GAME_PLAY);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            const btn = buffer.readUInt32BE(0);
            switch (btn) {
                case 1:
                    this.times = 1;
                    break;
                case 2:
                    this.times = 5;
                    break;
                case 3:
                    this.times = 10;
                    break;
                default:
                    this.times = 1;
            }
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.GachaReqProto = GachaReqProto;
//# sourceMappingURL=GachaReqProto.js.map