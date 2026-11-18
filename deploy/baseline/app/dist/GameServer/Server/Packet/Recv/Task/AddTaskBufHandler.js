"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTaskBufHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AddTaskBufReqProto_1 = require("../../../../../shared/proto/packets/req/task/AddTaskBufReqProto");
const PacketAddTaskBuf_1 = require("../../../Packet/Send/Task/PacketAddTaskBuf");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 添加/更新任务缓存处理器
 * CMD 2204: ADD_TASK_BUF
 */
let AddTaskBufHandler = class AddTaskBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new AddTaskBufReqProto_1.AddTaskBufReqProto();
        req.deserialize(body);
        const taskId = req.taskId;
        const bufferIndex = req.bufferIndex;
        const bufferValue = req.bufferValue;
        try {
            if (player.ClientProtocol === 'kose' && req.rawBuffer.length === 20) {
                await player.TaskManager.SetTaskProgressBytes(taskId, req.rawBuffer);
                await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf());
                return;
            }
            if (player.ClientProtocol === 'xin-20261013') {
                // SetTaskBuf writes a fixed 100-byte ByteArray after taskId. Keep it
                // opaque: its per-task field semantics belong to the client task data.
                if (taskId === 0 || req.rawBuffer.length !== 100) {
                    Logger_1.Logger.Warn(`[AddTaskBufHandler] XIN 任务缓存长度无效: ${req.rawBuffer.length}`);
                    await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf(5001));
                    return;
                }
                await player.TaskManager.SetTaskBufferBytes(taskId, req.rawBuffer);
                await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf());
                Logger_1.Logger.Debug(`[AddTaskBufHandler] 保存 XIN 任务缓存: task=${taskId}, length=${req.rawBuffer.length}`);
                return;
            }
            Logger_1.Logger.Debug(`[AddTaskBufHandler] 用户 ${player.Uid} 更新任务缓存: task=${taskId}, index=${bufferIndex}, value=${bufferValue}`);
            // 验证索引范围
            if (bufferIndex < 0 || bufferIndex >= 5) {
                Logger_1.Logger.Warn(`[AddTaskBufHandler] 缓存索引无效: ${bufferIndex}`);
                await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf(5001));
                return;
            }
            // 设置缓存值（调用 Manager 业务逻辑）
            await player.TaskManager.SetTaskBufferValue(taskId, bufferIndex, bufferValue);
            // 发送响应
            await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf());
            Logger_1.Logger.Debug(`[AddTaskBufHandler] 任务缓存更新成功`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[AddTaskBufHandler] 失败: taskId=${taskId}`, error);
            await player.SendPacket(new PacketAddTaskBuf_1.PacketAddTaskBuf(5000));
        }
    }
};
exports.AddTaskBufHandler = AddTaskBufHandler;
exports.AddTaskBufHandler = AddTaskBufHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.ADD_TASK_BUF, Opcode_1.InjectType.NONE)
], AddTaskBufHandler);
//# sourceMappingURL=AddTaskBufHandler.js.map