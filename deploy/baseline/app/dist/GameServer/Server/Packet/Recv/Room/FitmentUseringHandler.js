"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentUseringHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FitmentUseringReqProto_1 = require("../../../../../shared/proto/packets/req/room/FitmentUseringReqProto");
const FitmentUseringRspProto_1 = require("../../../../../shared/proto/packets/rsp/room/FitmentUseringRspProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 使用家具处理器（查看房间家具）
 * CMD 10006
 */
let FitmentUseringHandler = class FitmentUseringHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = FitmentUseringReqProto_1.FitmentUseringReqProto.fromBuffer(body);
            // 确定目标用户ID（访问谁的房间）
            let targetUserId = req.targetUserId;
            if (targetUserId === 0 || !targetUserId) {
                targetUserId = player.Uid;
            }
            Logger_1.Logger.Info(`[FitmentUseringHandler] 玩家 ${player.Uid} 访问房间: ` +
                `owner=${targetUserId}`);
            // TODO: 从数据库加载目标用户的家具列表
            // 暂时返回空列表
            const fitments = [];
            // 构建响应
            const rsp = new FitmentUseringRspProto_1.FitmentUseringRspProto();
            rsp.setOwner(targetUserId, targetUserId); // roomId 默认使用 userId
            rsp.setFitments(fitments);
            await player.SendPacket(rsp);
            Logger_1.Logger.Info(`[FitmentUseringHandler] 返回家具列表: owner=${targetUserId}, ` +
                `visitor=${player.Uid}, count=${fitments.length}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[FitmentUseringHandler] 处理失败: uid=${player.Uid}`, error);
            // 发生错误时返回空列表
            const rsp = new FitmentUseringRspProto_1.FitmentUseringRspProto();
            rsp.setOwner(player.Uid, player.Uid);
            rsp.setFitments([]);
            await player.SendPacket(rsp);
        }
    }
};
exports.FitmentUseringHandler = FitmentUseringHandler;
exports.FitmentUseringHandler = FitmentUseringHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FITMENT_USERING, decorators_1.InjectType.NONE)
], FitmentUseringHandler);
//# sourceMappingURL=FitmentUseringHandler.js.map