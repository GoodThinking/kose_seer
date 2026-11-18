"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCureHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetCureReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetCureReqProto");
/**
 * [CMD: 2306 PET_CURE] 治疗精灵
 */
let PetCureHandler = class PetCureHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetCureReqProto_1.PetCureReqProto.fromBuffer(body);
        // HandlePetCure accepts optional petId (catchTime)
        await player.PetManager.HandlePetCure(req.catchTime);
    }
};
exports.PetCureHandler = PetCureHandler;
exports.PetCureHandler = PetCureHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_CURE, decorators_1.InjectType.NONE)
], PetCureHandler);
//# sourceMappingURL=PetCureHandler.js.map