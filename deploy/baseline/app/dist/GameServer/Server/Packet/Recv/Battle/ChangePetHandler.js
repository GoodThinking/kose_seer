"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePetHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangePetReqProto_1 = require("../../../../../shared/proto/packets/req/battle/ChangePetReqProto");
/**
 * [CMD: 2407 CHANGE_PET] 更换精灵
 */
let ChangePetHandler = class ChangePetHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = ChangePetReqProto_1.ChangePetReqProto.fromBuffer(body);
        await player.BattleManager.HandleChangePet(req.catchTime);
    }
};
exports.ChangePetHandler = ChangePetHandler;
exports.ChangePetHandler = ChangePetHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.CHANGE_PET, decorators_1.InjectType.NONE)
], ChangePetHandler);
//# sourceMappingURL=ChangePetHandler.js.map