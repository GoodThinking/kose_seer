"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetDefaultHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetDefaultReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetDefaultReqProto");
/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵
 */
let PetDefaultHandler = class PetDefaultHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetDefaultReqProto_1.PetDefaultReqProto.fromBuffer(body);
        await player.PetManager.HandlePetDefault(req.catchTime);
    }
};
exports.PetDefaultHandler = PetDefaultHandler;
exports.PetDefaultHandler = PetDefaultHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_DEFAULT, decorators_1.InjectType.NONE)
], PetDefaultHandler);
//# sourceMappingURL=PetDefaultHandler.js.map