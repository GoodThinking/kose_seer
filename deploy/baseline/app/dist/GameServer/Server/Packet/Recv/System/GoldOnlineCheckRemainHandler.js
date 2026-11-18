"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldOnlineCheckRemainHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGoldOnlineCheckRemain_1 = require("../../Send/System/PacketGoldOnlineCheckRemain");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金豆余额
 *
 * 请求：无参数
 * 响应：gold×100；KOSE 追加 coins 原单位（8 bytes），XIN 不追加（4 bytes）
 */
let GoldOnlineCheckRemainHandler = class GoldOnlineCheckRemainHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // Stored whole beans are encoded as hundredths by the response packet.
        const gold = player.Data.gold;
        let response;
        try {
            response = new PacketGoldOnlineCheckRemain_1.PacketGoldOnlineCheckRemain(gold, player.Data.coins);
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GOLD_ONLINE_CHECK_REMAIN).setResult(5000));
            return;
        }
        // 发送响应
        await player.SendPacket(response);
    }
};
exports.GoldOnlineCheckRemainHandler = GoldOnlineCheckRemainHandler;
exports.GoldOnlineCheckRemainHandler = GoldOnlineCheckRemainHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GOLD_ONLINE_CHECK_REMAIN, decorators_1.InjectType.NONE)
], GoldOnlineCheckRemainHandler);
//# sourceMappingURL=GoldOnlineCheckRemainHandler.js.map