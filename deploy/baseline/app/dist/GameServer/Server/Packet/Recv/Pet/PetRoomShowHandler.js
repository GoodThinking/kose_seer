"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetRoomShowHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
let PetRoomShowHandler = class PetRoomShowHandler {
    async Handle(session, head, body) {
        if (session.Player)
            await session.Player.PetManager.HandlePetRoomShow(body);
    }
};
exports.PetRoomShowHandler = PetRoomShowHandler;
exports.PetRoomShowHandler = PetRoomShowHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_ROOM_SHOW, decorators_1.InjectType.NONE)
], PetRoomShowHandler);
//# sourceMappingURL=PetRoomShowHandler.js.map