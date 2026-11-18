"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSetExpHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetSetExpReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetSetExpReqProto");
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
let PetSetExpHandler = class PetSetExpHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetSetExpReqProto_1.PetSetExpReqProto.fromBuffer(body);
        await player.PetManager.HandlePetSetExp(req.catchTime, req.expAmount);
    }
};
exports.PetSetExpHandler = PetSetExpHandler;
exports.PetSetExpHandler = PetSetExpHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_SET_EXP, decorators_1.InjectType.NONE)
], PetSetExpHandler);
//# sourceMappingURL=PetSetExpHandler.js.map