"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTimeHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketSystemTime_1 = require("../../Send/System/PacketSystemTime");
/**
 * [CMD: 1002 SYSTEM_TIME] 获取系统时间
 * 简单逻辑，直接在 Handler 中处理
 */
let SystemTimeHandler = class SystemTimeHandler {
    async Handle(session, head, _body) {
        const player = session.Player;
        if (!player) {
            return;
        }
        const timestamp = Math.floor(Date.now() / 1000);
        await player.SendPacket(new PacketSystemTime_1.PacketSystemTime(timestamp));
    }
};
exports.SystemTimeHandler = SystemTimeHandler;
exports.SystemTimeHandler = SystemTimeHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.SYSTEM_TIME, decorators_1.InjectType.NONE)
], SystemTimeHandler);
//# sourceMappingURL=SystemTimeHandler.js.map