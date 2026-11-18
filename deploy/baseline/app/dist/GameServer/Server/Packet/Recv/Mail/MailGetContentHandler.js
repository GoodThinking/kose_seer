"use strict";
/**
 * [CMD: 2753 MAIL_GET_CONTENT] 读取邮件内容
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
exports.MailGetContentHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const utils_1 = require("../../../../../shared/utils");
let MailGetContentHandler = class MailGetContentHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player) {
            utils_1.Logger.Warn('[MailGetContentHandler] 玩家不存在');
            return;
        }
        // 读取邮件ID
        const mailId = body.readUInt32BE(0);
        await player.MailManager.HandleReadMail(mailId);
    }
};
exports.MailGetContentHandler = MailGetContentHandler;
exports.MailGetContentHandler = MailGetContentHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MAIL_GET_CONTENT, decorators_1.InjectType.NONE)
], MailGetContentHandler);
//# sourceMappingURL=MailGetContentHandler.js.map