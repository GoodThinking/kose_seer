"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeInfoHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGetExchangeInfo_1 = require("../../../Packet/Send/Exchange/PacketGetExchangeInfo");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * [CMD: 70001 GET_EXCHANGE_INFO] 获取兑换信息
 * 返回荣誉值
 */
let GetExchangeInfoHandler = class GetExchangeInfoHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            Logger_1.Logger.Debug(`[GetExchangeInfoHandler] 用户 ${player.Uid} 请求兑换信息`);
            // 暂时返回荣誉值为0
            const honorValue = 0;
            await player.SendPacket(new PacketGetExchangeInfo_1.PacketGetExchangeInfo(honorValue));
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetExchangeInfoHandler] 失败`, error);
            await player.SendPacket(new PacketGetExchangeInfo_1.PacketGetExchangeInfo(0).setResult(5000));
        }
    }
};
exports.GetExchangeInfoHandler = GetExchangeInfoHandler;
exports.GetExchangeInfoHandler = GetExchangeInfoHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.GET_EXCHANGE_INFO, Opcode_1.InjectType.NONE)
], GetExchangeInfoHandler);
//# sourceMappingURL=GetExchangeInfoHandler.js.map