"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetEvolutionHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetEvolutionReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetEvolutionReqProto");
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化
 *
 * 请求: catchTime(4) + evolveIndex(4)
 * 响应: status(4)
 */
let PetEvolutionHandler = class PetEvolutionHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetEvolutionReqProto_1.PetEvolutionReqProto.fromBuffer(body);
        await player.PetManager.HandlePetEvolution(req.catchTime, req.evolveIndex);
    }
};
exports.PetEvolutionHandler = PetEvolutionHandler;
exports.PetEvolutionHandler = PetEvolutionHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_EVOLVTION, decorators_1.InjectType.NONE)
], PetEvolutionHandler);
//# sourceMappingURL=PetEvolutionHandler.js.map