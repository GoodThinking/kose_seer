"use strict";
/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailDelAllHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const utils_1 = require("../../../../../shared/utils");
let MailDelAllHandler = class MailDelAllHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player) {
            utils_1.Logger.Warn('[MailDelAllHandler] 玩家不存在');
            return;
        }
        await player.MailManager.HandleDeleteAllRead();
    }
};
exports.MailDelAllHandler = MailDelAllHandler;
exports.MailDelAllHandler = MailDelAllHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MAIL_DEL_ALL, decorators_1.InjectType.NONE)
], MailDelAllHandler);
//# sourceMappingURL=MailDelAllHandler.js.map