"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapOgreListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应
 *
 * 协议格式（Lua 端格式）：
 * - 前 9 个 uint32: petId (36 bytes)
 * - 后 9 个 uint32: shiny (36 bytes)
 * - 总共 72 bytes
 * */
class MapOgreListRspProto extends BaseProto_1.BaseProto {
    ogres = []; // 9个槽位
    constructor() {
        super(CommandID_1.CommandID.MAP_OGRE_LIST);
        // 初始化9个空槽位
        for (let i = 0; i < 9; i++) {
            this.ogres.push({ petId: 0, shiny: 0 });
        }
    }
    serialize() {
        // 像 Lua 端一样发送：9 个 petId + 9 个 shiny = 18 个 uint32 = 72 字节
        // 虽然客户端只读前 36 字节，但 Lua 端这样发送能工作
        const writer = new utils_1.BufferWriter(72);
        // 前 9 个 uint32: petId
        for (let i = 0; i < 9; i++) {
            const ogre = this.ogres[i] || { petId: 0, shiny: 0 };
            writer.WriteUInt32(ogre.petId);
        }
        // 后 9 个 uint32: shiny
        for (let i = 0; i < 9; i++) {
            const ogre = this.ogres[i] || { petId: 0, shiny: 0 };
            writer.WriteUInt32(ogre.shiny);
        }
        return writer.ToBuffer();
    }
    /**
     * 设置槽位数据
     */
    setSlot(index, petId, shiny) {
        if (index >= 0 && index < 9) {
            this.ogres[index] = { petId, shiny };
        }
        return this;
    }
    /**
     * 批量设置槽位数据
     */
    setOgres(ogres) {
        for (let i = 0; i < Math.min(ogres.length, 9); i++) {
            this.ogres[i] = ogres[i];
        }
        return this;
    }
}
exports.MapOgreListRspProto = MapOgreListRspProto;
//# sourceMappingURL=MapOgreListRspProto.js.map