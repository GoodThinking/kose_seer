"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanceActionHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const DanceActionReqProto_1 = require("../../../../../shared/proto/packets/req/map/DanceActionReqProto");
/**
 * Dance action handler
 * CMD 1009
 */
let DanceActionHandler = class DanceActionHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new DanceActionReqProto_1.DanceActionReqProto();
        req.deserialize(body);
        await player.MapActionManager.HandleDanceAction(req);
    }
};
exports.DanceActionHandler = DanceActionHandler;
exports.DanceActionHandler = DanceActionHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.DANCE_ACTION, decorators_1.InjectType.NONE)
], DanceActionHandler);
//# sourceMappingURL=DanceActionHandler.js.map