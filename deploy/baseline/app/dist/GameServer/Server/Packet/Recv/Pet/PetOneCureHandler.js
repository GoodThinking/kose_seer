"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetOneCureHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetOneCureReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetOneCureReqProto");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP
 */
let PetOneCureHandler = class PetOneCureHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new PetOneCureReqProto_1.PetOneCureReqProto();
        req.deserialize(body);
        utils_1.Logger.Debug(`[PetOneCureHandler] CatchTime=${req.catchTime}, Coins=${req.coins}, BodyLen=${body.length}`);
        await player.PetManager.HandlePetOneCure(req.catchTime, req.coins);
    }
};
exports.PetOneCureHandler = PetOneCureHandler;
exports.PetOneCureHandler = PetOneCureHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_ONE_CURE, decorators_1.InjectType.NONE)
], PetOneCureHandler);
//# sourceMappingURL=PetOneCureHandler.js.map