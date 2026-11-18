"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetGetExpHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetGetExpReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetGetExpReqProto");
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息
 * 精灵分配仪功能 - 查询可分配的经验值
 */
let PetGetExpHandler = class PetGetExpHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        PetGetExpReqProto_1.PetGetExpReqProto.fromBuffer(body);
        await player.PetManager.HandlePetGetExp();
    }
};
exports.PetGetExpHandler = PetGetExpHandler;
exports.PetGetExpHandler = PetGetExpHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_GET_EXP, decorators_1.InjectType.NONE)
], PetGetExpHandler);
//# sourceMappingURL=PetGetExpHandler.js.map