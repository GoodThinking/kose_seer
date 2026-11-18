"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTaskHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const CompleteTaskReqProto_1 = require("../../../../../shared/proto/packets/req/task/CompleteTaskReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 完成任务处理器
 * CMD 2202: COMPLETE_TASK
 */
let CompleteTaskHandler = class CompleteTaskHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new CompleteTaskReqProto_1.CompleteTaskReqProto();
        req.deserialize(body);
        try {
            // 调用 Manager 处理业务逻辑
            await player.TaskManager.CompleteTask(req.taskId, req.param);
        }
        catch (error) {
            Logger_1.Logger.Error(`[CompleteTaskHandler] 失败: taskId=${req.taskId}`, error);
        }
    }
};
exports.CompleteTaskHandler = CompleteTaskHandler;
exports.CompleteTaskHandler = CompleteTaskHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.COMPLETE_TASK, Opcode_1.InjectType.NONE)
], CompleteTaskHandler);
//# sourceMappingURL=CompleteTaskHandler.js.map