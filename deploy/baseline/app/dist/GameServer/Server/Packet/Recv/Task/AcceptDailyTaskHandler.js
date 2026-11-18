"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptDailyTaskHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AcceptDailyTaskReqProto_1 = require("../../../../../shared/proto/packets/req/task/AcceptDailyTaskReqProto");
const PacketAcceptDailyTask_1 = require("../../../Packet/Send/Task/PacketAcceptDailyTask");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 接受每日任务处理器
 * CMD 2231: ACCEPT_DAILY_TASK
 *
 * Lua端实现：emptyResponse(2231, 4)
 * 逻辑：接受每日任务，保存到用户数据，返回空响应
 */
let AcceptDailyTaskHandler = class AcceptDailyTaskHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new AcceptDailyTaskReqProto_1.AcceptDailyTaskReqProto();
        req.deserialize(body);
        const taskId = req.taskId;
        try {
            Logger_1.Logger.Info(`[AcceptDailyTaskHandler] 用户 ${player.Uid} 接受每日任务 ${taskId}`);
            await player.TaskManager.EnsureDailyTaskDay(taskId);
            if (player.TaskManager.IsTaskAccepted(taskId)) {
                Logger_1.Logger.Warn(`[AcceptDailyTaskHandler] 每日任务 ${taskId} 已接受`);
                await player.SendPacket(new PacketAcceptDailyTask_1.PacketAcceptDailyTask(5002));
                return;
            }
            await player.TaskManager.AcceptDailyTask(taskId);
            // 发送空响应（与Lua端一致）
            await player.SendPacket(new PacketAcceptDailyTask_1.PacketAcceptDailyTask());
            Logger_1.Logger.Info(`[AcceptDailyTaskHandler] 用户 ${player.Uid} 接受每日任务 ${taskId} 成功`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[AcceptDailyTaskHandler] 失败: taskId=${taskId}`, error);
            await player.SendPacket(new PacketAcceptDailyTask_1.PacketAcceptDailyTask(5000));
        }
    }
};
exports.AcceptDailyTaskHandler = AcceptDailyTaskHandler;
exports.AcceptDailyTaskHandler = AcceptDailyTaskHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.ACCEPT_DAILY_TASK, Opcode_1.InjectType.NONE)
], AcceptDailyTaskHandler);
//# sourceMappingURL=AcceptDailyTaskHandler.js.map