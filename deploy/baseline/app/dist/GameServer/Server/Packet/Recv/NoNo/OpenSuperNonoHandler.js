"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSuperNonoHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * 开启超级NoNo处理器
 * CMD 80001
 *
 * 请求格式: 无参数
 * 响应格式: success (uint32)
 */
let OpenSuperNonoHandler = class OpenSuperNonoHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // 调用 NoNoManager 处理
        await player.NoNoManager.HandleOpenSuperNono();
    }
};
exports.OpenSuperNonoHandler = OpenSuperNonoHandler;
exports.OpenSuperNonoHandler = OpenSuperNonoHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.OPEN_SUPER_NONO, decorators_1.InjectType.NONE)
], OpenSuperNonoHandler);
//# sourceMappingURL=OpenSuperNonoHandler.js.map