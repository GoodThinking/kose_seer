"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListMapPlayerRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2003 LIST_MAP_PLAYER] 地图玩家列表响应
 */
class ListMapPlayerRspProto extends BaseProto_1.BaseProto {
    players = []; // 玩家列表
    constructor() {
        super(CommandID_1.CommandID.LIST_MAP_PLAYER);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(4096);
        // 写入玩家数量
        writer.WriteUInt32(this.players.length);
        // 写入每个玩家的信息
        for (const player of this.players) {
            writer.WriteBytes(player.serialize(protocol));
        }
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setPlayers(players) {
        this.players = players;
        return this;
    }
    addPlayer(player) {
        this.players.push(player);
        return this;
    }
}
exports.ListMapPlayerRspProto = ListMapPlayerRspProto;
//# sourceMappingURL=ListMapPlayerRspProto.js.map