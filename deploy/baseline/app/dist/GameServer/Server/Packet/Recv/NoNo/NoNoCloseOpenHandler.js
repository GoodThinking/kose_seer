"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoCloseOpenHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 9014 NONO_CLOSE_OPEN] NoNo 开启/关闭
 * 简单逻辑：空响应
 */
let NoNoCloseOpenHandler = class NoNoCloseOpenHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // 简单的空响应
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.NONO_CLOSE_OPEN));
    }
};
exports.NoNoCloseOpenHandler = NoNoCloseOpenHandler;
exports.NoNoCloseOpenHandler = NoNoCloseOpenHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_CLOSE_OPEN, decorators_1.InjectType.NONE)
], NoNoCloseOpenHandler);
//# sourceMappingURL=NoNoCloseOpenHandler.js.map