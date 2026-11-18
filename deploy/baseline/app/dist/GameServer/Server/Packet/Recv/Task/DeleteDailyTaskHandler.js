"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteDailyTaskHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetTaskBufReqProto_1 = require("../../../../../shared/proto/packets/req/task/GetTaskBufReqProto");
const PacketDailyTaskAction_1 = require("../../Send/Task/PacketDailyTaskAction");
const Logger_1 = require("../../../../../shared/utils/Logger");
let DeleteDailyTaskHandler = class DeleteDailyTaskHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new GetTaskBufReqProto_1.GetTaskBufReqProto();
        req.deserialize(body);
        try {
            if (body.length !== 4 || req.taskId === 0) {
                await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.DELETE_DAILY_TASK, 5001));
                return;
            }
            await player.TaskManager.DeleteDailyTask(req.taskId);
            await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.DELETE_DAILY_TASK));
        }
        catch (error) {
            Logger_1.Logger.Error(`[DeleteDailyTaskHandler] 失败: taskId=${req.taskId}`, error);
            await player.SendPacket(new PacketDailyTaskAction_1.PacketDailyTaskAction(CommandID_1.CommandID.DELETE_DAILY_TASK, 5000));
        }
    }
};
exports.DeleteDailyTaskHandler = DeleteDailyTaskHandler;
exports.DeleteDailyTaskHandler = DeleteDailyTaskHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.DELETE_DAILY_TASK, Opcode_1.InjectType.NONE)
], DeleteDailyTaskHandler);
//# sourceMappingURL=DeleteDailyTaskHandler.js.map