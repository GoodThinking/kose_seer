"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentAllHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FitmentAllRspProto_1 = require("../../../../../shared/proto/packets/rsp/room/FitmentAllRspProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 获取所有家具处理器（仓库家具列表）
 * CMD 10007
 */
let FitmentAllHandler = class FitmentAllHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            Logger_1.Logger.Info(`[FitmentAllHandler] 玩家 ${player.Uid} 请求仓库家具列表`);
            // TODO: 从数据库加载玩家的仓库家具列表
            // 暂时返回空列表
            const fitments = [];
            // 构建响应
            const rsp = new FitmentAllRspProto_1.FitmentAllRspProto();
            rsp.setFitments(fitments);
            await player.SendPacket(rsp);
            Logger_1.Logger.Info(`[FitmentAllHandler] 返回仓库家具列表: uid=${player.Uid}, count=${fitments.length}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[FitmentAllHandler] 处理失败: uid=${player.Uid}`, error);
            // 发生错误时返回空列表
            const rsp = new FitmentAllRspProto_1.FitmentAllRspProto();
            rsp.setFitments([]);
            await player.SendPacket(rsp);
        }
    }
};
exports.FitmentAllHandler = FitmentAllHandler;
exports.FitmentAllHandler = FitmentAllHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FITMENT_ALL, decorators_1.InjectType.NONE)
], FitmentAllHandler);
//# sourceMappingURL=FitmentAllHandler.js.map