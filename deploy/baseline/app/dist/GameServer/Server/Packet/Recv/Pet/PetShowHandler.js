"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetShowHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetShowReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetShowReqProto");
/**
 * [CMD: 2305 PET_SHOW] 展示精灵
 */
let PetShowHandler = class PetShowHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetShowReqProto_1.PetShowReqProto.fromBuffer(body);
        // HandlePetShow accepts only petId (catchTime)
        await player.PetManager.HandlePetShow(req.catchTime);
    }
};
exports.PetShowHandler = PetShowHandler;
exports.PetShowHandler = PetShowHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_SHOW, decorators_1.InjectType.NONE)
], PetShowHandler);
//# sourceMappingURL=PetShowHandler.js.map