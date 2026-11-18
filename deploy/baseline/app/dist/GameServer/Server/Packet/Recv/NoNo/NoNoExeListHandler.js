"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoExeListHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketNoNoExeList_1 = require("../../Send/NoNo/PacketNoNoExeList");
/**
 * [CMD: 9015 NONO_EXE_LIST] NoNo 执行列表
 * 简单逻辑：返回空列表
 */
let NoNoExeListHandler = class NoNoExeListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // 返回空列表
        await player.SendPacket(new PacketNoNoExeList_1.PacketNoNoExeList());
    }
};
exports.NoNoExeListHandler = NoNoExeListHandler;
exports.NoNoExeListHandler = NoNoExeListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_EXE_LIST, decorators_1.InjectType.NONE)
], NoNoExeListHandler);
//# sourceMappingURL=NoNoExeListHandler.js.map