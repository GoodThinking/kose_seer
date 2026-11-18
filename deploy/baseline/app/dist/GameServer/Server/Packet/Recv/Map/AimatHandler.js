"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AimatHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const AimatReqProto_1 = require("../../../../../shared/proto/packets/req/map/AimatReqProto");
/**
 * Aimat/interact handler
 * CMD 1010
 */
let AimatHandler = class AimatHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new AimatReqProto_1.AimatReqProto();
        req.deserialize(body);
        await player.MapActionManager.HandleAimat(req);
    }
};
exports.AimatHandler = AimatHandler;
exports.AimatHandler = AimatHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.AIMAT, decorators_1.InjectType.NONE)
], AimatHandler);
//# sourceMappingURL=AimatHandler.js.map