"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSkillSwitchHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetSkillSwitchReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetSkillSwitchReqProto");
/**
 * [CMD: 2312] 精灵技能切换
 */
let PetSkillSwitchHandler = class PetSkillSwitchHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetSkillSwitchReqProto_1.PetSkillSwitchReqProto.fromBuffer(body);
        await player.PetManager.HandleSkillSwitch(req.catchTime, req.slot1, req.slot2, req.oldSkillId, req.newSkillId);
    }
};
exports.PetSkillSwitchHandler = PetSkillSwitchHandler;
exports.PetSkillSwitchHandler = PetSkillSwitchHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_SKILL_SWICTH, decorators_1.InjectType.NONE)
], PetSkillSwitchHandler);
//# sourceMappingURL=PetSkillSwitchHandler.js.map