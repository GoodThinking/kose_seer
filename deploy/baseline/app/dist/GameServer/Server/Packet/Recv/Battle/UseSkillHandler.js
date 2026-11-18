"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseSkillHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const UseSkillReqProto_1 = require("../../../../../shared/proto/packets/req/battle/UseSkillReqProto");
/**
 * [CMD: 2405 USE_SKILL] 使用技能
 */
let UseSkillHandler = class UseSkillHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = UseSkillReqProto_1.UseSkillReqProto.fromBuffer(body);
        await player.BattleManager.HandleUseSkill(body.length >= 4 ? req.skillId : 10001); // 不完整请求沿用默认撞击
    }
};
exports.UseSkillHandler = UseSkillHandler;
exports.UseSkillHandler = UseSkillHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.USE_SKILL, decorators_1.InjectType.NONE)
], UseSkillHandler);
//# sourceMappingURL=UseSkillHandler.js.map