"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSortHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const SkillSortReqProto_1 = require("../../../../../shared/proto/packets/req/pet/SkillSortReqProto");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2328 Skill_Sort] 技能排序处理器
 *
 * 功能：调整精灵技能槽的顺序
 */
let SkillSortHandler = class SkillSortHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new SkillSortReqProto_1.SkillSortReqProto();
        req.deserialize(body);
        utils_1.Logger.Debug(`[SkillSortHandler] 技能排序: UserID=${player.Data.userID}, ` +
            `CatchTime=${req.catchTime}, Skills=[${req.getSkillArray().join(', ')}]`);
        await player.PetManager.HandleSkillSort(req.catchTime, req.skill1, req.skill2, req.skill3, req.skill4);
    }
};
exports.SkillSortHandler = SkillSortHandler;
exports.SkillSortHandler = SkillSortHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.Skill_Sort, decorators_1.InjectType.NONE)
], SkillSortHandler);
//# sourceMappingURL=SkillSortHandler.js.map