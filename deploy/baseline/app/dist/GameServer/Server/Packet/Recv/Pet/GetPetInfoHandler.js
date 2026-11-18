"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetInfoHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetPetInfoReqProto_1 = require("../../../../../shared/proto/packets/req/pet/GetPetInfoReqProto");
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息
 */
let GetPetInfoHandler = class GetPetInfoHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = GetPetInfoReqProto_1.GetPetInfoReqProto.fromBuffer(body);
        await player.PetManager.HandleGetPetInfo(req.catchTime);
    }
};
exports.GetPetInfoHandler = GetPetInfoHandler;
exports.GetPetInfoHandler = GetPetInfoHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_PET_INFO, decorators_1.InjectType.NONE)
], GetPetInfoHandler);
//# sourceMappingURL=GetPetInfoHandler.js.map