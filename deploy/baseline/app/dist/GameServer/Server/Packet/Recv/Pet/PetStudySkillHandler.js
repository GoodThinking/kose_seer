"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetStudySkillHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetStudySkillReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetStudySkillReqProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 2307] 精灵学习技能（替换技能）
 */
let PetStudySkillHandler = class PetStudySkillHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        // 固定 XIN/旧 core 仅证实五个 UInt32、flag1/flag2=1/1 的单技能替换。
        // 不将截断、额外负载或未知标志静默解释为这一请求形式。
        if (body.length !== 20) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
            return;
        }
        const req = PetStudySkillReqProto_1.PetStudySkillReqProto.fromBuffer(body);
        if (req.flag1 !== 1 || req.flag2 !== 1) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
            return;
        }
        await player.PetManager.HandleStudySkill(req.catchTime, req.studySkillId, req.dropSkillId);
    }
};
exports.PetStudySkillHandler = PetStudySkillHandler;
exports.PetStudySkillHandler = PetStudySkillHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_STUDY_SKILL, decorators_1.InjectType.NONE)
], PetStudySkillHandler);
//# sourceMappingURL=PetStudySkillHandler.js.map