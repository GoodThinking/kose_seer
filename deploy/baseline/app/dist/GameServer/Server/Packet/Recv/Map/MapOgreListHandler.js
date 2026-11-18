"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapOgreListHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketMapOgreList_1 = require("../../Send/Map/PacketMapOgreList");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2004 MAP_OGRE_LIST] 获取地图野怪列表
 *
 * 请求：无参数
 * 响应：9个槽位，每个槽位 8 bytes (petId + shiny)
 * 总共 72 bytes
 *
 * 注意：使用 MapSpawnManager 管理刷新状态，确保同一地图的野怪保持一致
 */
let MapOgreListHandler = class MapOgreListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        const mapId = player.Data.mapID;
        // 使用 MapSpawnManager 获取玩家的野怪列表
        const ogres = player.MapSpawnManager.GetMapOgres(mapId);
        // 发送响应
        await player.SendPacket(new PacketMapOgreList_1.PacketMapOgreList(ogres));
        const activeOgres = ogres.filter(o => o.petId > 0);
        utils_1.Logger.Debug(`[MapOgreListHandler] MapID=${mapId}, Ogres=${activeOgres.length}`);
        if (activeOgres.length > 0) {
            const ogreDetails = ogres
                .map((o, slot) => o.petId > 0 ? `Slot${slot}:Pet${o.petId}${o.shiny ? '(闪)' : ''}` : null)
                .filter(Boolean)
                .join(', ');
            utils_1.Logger.Debug(`[MapOgreListHandler] Active ogres: ${ogreDetails}`);
        }
    }
};
exports.MapOgreListHandler = MapOgreListHandler;
exports.MapOgreListHandler = MapOgreListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MAP_OGRE_LIST, decorators_1.InjectType.NONE)
], MapOgreListHandler);
//# sourceMappingURL=MapOgreListHandler.js.map