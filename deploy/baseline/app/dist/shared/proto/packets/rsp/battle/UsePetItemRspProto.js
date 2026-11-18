"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePetItemRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具响应
 */
class UsePetItemRspProto extends BaseProto_1.BaseProto {
    userId = 0; // 用户ID
    itemId = 0; // 道具ID
    hp = 0; // 当前HP
    change = 0; // 变化量
    constructor() {
        super(CommandID_1.CommandID.USE_PET_ITEM);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(32);
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.itemId);
        writer.WriteUInt32(this.hp);
        writer.WriteUInt32(this.change);
        return writer.ToBuffer();
    }
    // 链式调用
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setItemId(value) {
        this.itemId = value;
        return this;
    }
    setHP(hp, change) {
        this.hp = hp;
        this.change = change;
        return this;
    }
}
exports.UsePetItemRspProto = UsePetItemRspProto;
//# sourceMappingURL=UsePetItemRspProto.js.map