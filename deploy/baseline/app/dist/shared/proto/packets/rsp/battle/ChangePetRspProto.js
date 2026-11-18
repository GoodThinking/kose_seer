"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePetRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2407 CHANGE_PET] 更换精灵响应
 */
class ChangePetRspProto extends BaseProto_1.BaseProto {
    userId = 0; // 用户ID
    petId = 0; // 精灵ID
    petName = ''; // 精灵名称 (16字节)
    level = 0; // 等级
    hp = 0; // 当前HP
    maxHp = 0; // 最大HP
    catchTime = 0; // 捕获时间
    constructor() {
        super(CommandID_1.CommandID.CHANGE_PET);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(64);
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.petId);
        writer.WriteBytes(this.buildString(this.petName, 16));
        writer.WriteUInt32(this.level);
        writer.WriteUInt32(this.hp);
        writer.WriteUInt32(this.maxHp);
        writer.WriteUInt32(this.catchTime);
        return writer.ToBuffer();
    }
    // 链式调用
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setPetId(value) {
        this.petId = value;
        return this;
    }
    setPetName(value) {
        this.petName = value;
        return this;
    }
    setLevel(value) {
        this.level = value;
        return this;
    }
    setHP(hp, maxHp) {
        this.hp = hp;
        this.maxHp = maxHp;
        return this;
    }
    setCatchTime(value) {
        this.catchTime = value;
        return this;
    }
}
exports.ChangePetRspProto = ChangePetRspProto;
//# sourceMappingURL=ChangePetRspProto.js.map