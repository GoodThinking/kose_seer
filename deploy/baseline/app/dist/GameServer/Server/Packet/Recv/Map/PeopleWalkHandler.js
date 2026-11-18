"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleWalkHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PeopleWalkReqProto_1 = require("../../../../../shared/proto/packets/req/map/PeopleWalkReqProto");
/**
 * Player move handler
 * CMD 2101
 */
let PeopleWalkHandler = class PeopleWalkHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PeopleWalkReqProto_1.PeopleWalkReqProto.fromBuffer(body);
        await player.MapActionManager.HandlePeopleWalk(req);
    }
};
exports.PeopleWalkHandler = PeopleWalkHandler;
exports.PeopleWalkHandler = PeopleWalkHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PEOPLE_WALK, decorators_1.InjectType.NONE)
], PeopleWalkHandler);
//# sourceMappingURL=PeopleWalkHandler.js.map