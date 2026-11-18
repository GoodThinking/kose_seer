"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptTaskHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AcceptTaskReqProto_1 = require("../../../../../shared/proto/packets/req/task/AcceptTaskReqProto");
const PacketAcceptTask_1 = require("../../../Packet/Send/Task/PacketAcceptTask");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 接受任务处理器
 * CMD 2201: ACCEPT_TASK
 */
let AcceptTaskHandler = class AcceptTaskHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new AcceptTaskReqProto_1.AcceptTaskReqProto();
        req.deserialize(body);
        const taskId = req.taskId;
        try {
            Logger_1.Logger.Info(`[AcceptTaskHandler] 用户 ${player.Uid} 接受任务 ${taskId}`);
            // 检查是否已接受
            if (player.TaskManager.IsTaskAccepted(taskId)) {
                Logger_1.Logger.Warn(`[AcceptTaskHandler] 任务 ${taskId} 已接受`);
                await player.SendPacket(new PacketAcceptTask_1.PacketAcceptTask(taskId, 5002));
                return;
            }
            // 接受任务（调用 Manager 业务逻辑）
            await player.TaskManager.AcceptTask(taskId);
            // 发送响应
            await player.SendPacket(new PacketAcceptTask_1.PacketAcceptTask(taskId));
            Logger_1.Logger.Info(`[AcceptTaskHandler] 用户 ${player.Uid} 接受任务 ${taskId} 成功`);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            Logger_1.Logger.Warn(`[ACCEPT_TASK_FAIL] 用户 ${player.Uid} 接受任务 ${taskId} 失败: ${err.message}`);
            await player.SendPacket(new PacketAcceptTask_1.PacketAcceptTask(taskId, 5000));
        }
    }
};
exports.AcceptTaskHandler = AcceptTaskHandler;
exports.AcceptTaskHandler = AcceptTaskHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.ACCEPT_TASK, Opcode_1.InjectType.NONE)
], AcceptTaskHandler);
//# sourceMappingURL=AcceptTaskHandler.js.map