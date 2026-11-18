"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterMapHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const EnterMapReqProto_1 = require("../../../../../shared/proto/packets/req/map/EnterMapReqProto");
const SummoningField_1 = require("../../../../Game/Map/SummoningField");
/**
 * 进入地图处理器
 * CMD 1001
 */
let EnterMapHandler = class EnterMapHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = EnterMapReqProto_1.EnterMapReqProto.fromBuffer(body);
        SummoningField_1.SummoningField.Reset(player);
        await player.MapManager.HandleEnterMap(req);
    }
};
exports.EnterMapHandler = EnterMapHandler;
exports.EnterMapHandler = EnterMapHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ENTER_MAP, decorators_1.InjectType.NONE)
], EnterMapHandler);
//# sourceMappingURL=EnterMapHandler.js.map