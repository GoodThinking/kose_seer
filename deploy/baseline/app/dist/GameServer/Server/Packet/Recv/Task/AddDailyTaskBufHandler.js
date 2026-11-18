"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDailyTaskBufHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AddTaskBufReqProto_1 = require("../../../../../shared/proto/packets/req/task/AddTaskBufReqProto");
const PacketDailyTaskAction_1 = require("../../Send/Task/PacketDailyTaskAction");
const Logger_1 = require("../../../../../shared/utils/Logger");
let AddDailyTaskBufHandler = class AddDailyTaskBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new AddTaskBufReqProto_1.AddTaskBufReqProto();
        req.deserialize(body);
        try {
            if (body.length !== 24 || req.rawBuffer.length !== 20 || req.taskId === 0) {
                await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.ADD_DAILY_TASK_BUF, 5001));
                return;
            }
            await player.TaskManager.EnsureDailyTaskDay(req.taskId);
            if (!player.TaskManager.IsTaskAccepted(req.taskId)) {
                await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.ADD_DAILY_TASK_BUF, 5002));
                return;
            }
            await player.TaskManager.SetTaskProgressBytes(req.taskId, req.rawBuffer);
            await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.ADD_DAILY_TASK_BUF));
        }
        catch (error) {
            Logger_1.Logger.Error(`[AddDailyTaskBufHandler] 失败: taskId=${req.taskId}`, error);
            await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.ADD_DAILY_TASK_BUF, 5000));
        }
    }
};
exports.AddDailyTaskBufHandler = AddDailyTaskBufHandler;
exports.AddDailyTaskBufHandler = AddDailyTaskBufHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.ADD_DAILY_TASK_BUF, Opcode_1.InjectType.NONE)
], AddDailyTaskBufHandler);
//# sourceMappingURL=AddDailyTaskBufHandler.js.map