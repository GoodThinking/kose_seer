"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldCheckRemainHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGoldCheckRemain_1 = require("../../Send/User/PacketGoldCheckRemain");
const utils_1 = require("../../../../../shared/utils");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const GoldCurrency_1 = require("../../../../../shared/protocol/GoldCurrency");
/**
 * [CMD: 1105 GOLD_CHECK_REMAIN] 查询金豆余额
 */
let GoldCheckRemainHandler = class GoldCheckRemainHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const gold = player.Data.gold;
        try {
            (0, GoldCurrency_1.GoldToWire)(gold);
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GOLD_CHECK_REMAIN).setResult(5000));
            return;
        }
        await player.SendPacket(new PacketGoldCheckRemain_1.PacketGoldCheckRemain(gold));
        utils_1.Logger.Info(`[GoldCheckRemainHandler] 查询金豆余额: UserID=${player.Data.userID}, Gold=${gold}`);
    }
};
exports.GoldCheckRemainHandler = GoldCheckRemainHandler;
exports.GoldCheckRemainHandler = GoldCheckRemainHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GOLD_CHECK_REMAIN, decorators_1.InjectType.NONE)
], GoldCheckRemainHandler);
//# sourceMappingURL=GoldCheckRemainHandler.js.map