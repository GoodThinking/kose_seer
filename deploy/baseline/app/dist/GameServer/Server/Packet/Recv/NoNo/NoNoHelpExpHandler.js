"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoHelpExpHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 9021 NONO_HELP_EXP] NoNo 帮助经验
 * 简单逻辑：空响应
 */
let NoNoHelpExpHandler = class NoNoHelpExpHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.NONO_HELP_EXP));
    }
};
exports.NoNoHelpExpHandler = NoNoHelpExpHandler;
exports.NoNoHelpExpHandler = NoNoHelpExpHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_HELP_EXP, decorators_1.InjectType.NONE)
], NoNoHelpExpHandler);
//# sourceMappingURL=NoNoHelpExpHandler.js.map