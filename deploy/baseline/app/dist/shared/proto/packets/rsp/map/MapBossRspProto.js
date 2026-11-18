"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapBossRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应
 *
 * 协议格式：
 * - uint32: len (BOSS数量)
 * - 循环 len 次：
 *   - uint32: id (BOSS精灵ID)
 *   - uint32: region (区域/槽位)
 *   - uint32: hp (HP)
 *   - uint32: pos (位置，200表示移除)
 */
class MapBossRspProto extends BaseProto_1.BaseProto {
    bosses = [];
    constructor() {
        super(CommandID_1.CommandID.MAP_BOSS);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4 + this.bosses.length * 16);
        // BOSS数量
        writer.WriteUInt32(this.bosses.length);
        // 每个BOSS的信息
        for (const boss of this.bosses) {
            writer.WriteUInt32(boss.id);
            writer.WriteUInt32(boss.region);
            writer.WriteUInt32(boss.hp);
            writer.WriteUInt32(boss.pos);
        }
        return writer.ToBuffer();
    }
    /**
     * 添加BOSS
     */
    addBoss(id, region, hp, pos) {
        this.bosses.push({ id, region, hp, pos });
        return this;
    }
    /**
     * 批量设置BOSS
     */
    setBosses(bosses) {
        this.bosses = bosses;
        return this;
    }
}
exports.MapBossRspProto = MapBossRspProto;
//# sourceMappingURL=MapBossRspProto.js.map