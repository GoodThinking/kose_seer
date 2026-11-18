"use strict";
/**
 * [CMD: 2754 MAIL_SET_READED] 标记邮件为已读
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
exports.MailSetReadedHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const utils_1 = require("../../../../../shared/utils");
let MailSetReadedHandler = class MailSetReadedHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player) {
            utils_1.Logger.Warn('[MailSetReadedHandler] 玩家不存在');
            return;
        }
        // 读取邮件ID (如果为0则标记所有邮件为已读)
        const mailId = body.readUInt32BE(0);
        await player.MailManager.HandleMarkAsRead(mailId);
    }
};
exports.MailSetReadedHandler = MailSetReadedHandler;
exports.MailSetReadedHandler = MailSetReadedHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MAIL_SET_READED, decorators_1.InjectType.NONE)
], MailSetReadedHandler);
//# sourceMappingURL=MailSetReadedHandler.js.map