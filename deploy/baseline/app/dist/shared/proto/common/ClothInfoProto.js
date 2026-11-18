"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClothListProto = exports.ClothInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 服装信息Proto
 */
class ClothInfoProto extends BaseProto_1.BaseProto {
    id = 0;
    type = 0;
    expireTime = 0;
    constructor() {
        super(0); // 通用Proto不需要cmdId
    }
    serialize() {
        const writer = new utils_1.BufferWriter(12);
        writer.WriteUInt32(this.id);
        writer.WriteUInt32(this.type);
        writer.WriteUInt32(this.expireTime);
        return writer.ToBuffer();
    }
}
exports.ClothInfoProto = ClothInfoProto;
/**
 * 服装列表Proto
 */
class ClothListProto extends BaseProto_1.BaseProto {
    clothes = [];
    constructor() {
        super(0); // 通用Proto不需要cmdId
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4 + this.clothes.length * 12);
        writer.WriteUInt32(this.clothes.length);
        for (const cloth of this.clothes) {
            writer.WriteBytes(cloth.serialize());
        }
        return writer.ToBuffer();
    }
}
exports.ClothListProto = ClothListProto;
//# sourceMappingURL=ClothInfoProto.js.map