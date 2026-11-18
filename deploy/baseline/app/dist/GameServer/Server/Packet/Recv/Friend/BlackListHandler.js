"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackListHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * 获取黑名单列表处理器
 * CMD 2159
 */
let BlackListHandler = class BlackListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // 调用 FriendManager 处理
        await player.FriendManager.HandleGetBlacklist();
    }
};
exports.BlackListHandler = BlackListHandler;
exports.BlackListHandler = BlackListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.BLACK_LIST, decorators_1.InjectType.NONE)
], BlackListHandler);
//# sourceMappingURL=BlackListHandler.js.map