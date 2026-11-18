"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightSpecialPetHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FightSpecialPetReqProto_1 = require("../../../../../shared/proto/packets/req/battle/FightSpecialPetReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚
 *
 * 盖亚挑战逻辑：
 * - 客户端发送 param2
 * - 如果未匹配到地图配置，回退到盖亚
 */
let FightSpecialPetHandler = class FightSpecialPetHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player) {
            return;
        }
        const req = FightSpecialPetReqProto_1.FightSpecialPetReqProto.fromBuffer(body);
        const param2 = req.param2;
        let mapId = player.Data.mapID || 1;
        if (mapId === 0) {
            mapId = 1;
        }
        Logger_1.Logger.Info(`[FightSpecialPetHandler] 收到盖亚挑战请求: UserID=${player.Uid}, ` +
            `MapID=${mapId}, Param2=${param2}`);
        // 调用 BattleManager 处理
        await player.BattleManager.HandleFightSpecialPet(mapId, param2);
    }
};
exports.FightSpecialPetHandler = FightSpecialPetHandler;
exports.FightSpecialPetHandler = FightSpecialPetHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FIGHT_SPECIAL_PET, decorators_1.InjectType.NONE)
], FightSpecialPetHandler);
//# sourceMappingURL=FightSpecialPetHandler.js.map