"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapBroadcastManager = void 0;
const utils_1 = require("../../../shared/utils");
const BaseManager_1 = require("../Base/BaseManager");
const BroadcastService_1 = require("../Broadcast/BroadcastService");
const Event_1 = require("../Event");
/**
 * Listens to map domain events and broadcasts packets to other players in map.
 */
class MapBroadcastManager extends BaseManager_1.BaseManager {
    _broadcastService = BroadcastService_1.BroadcastService.Instance;
    RegisterEvents(eventBus) {
        eventBus.On(Event_1.MapEventType.PEOPLE_WALK, this.OnPeopleWalk.bind(this));
        eventBus.On(Event_1.MapEventType.DANCE_ACTION, this.OnDanceAction.bind(this));
        eventBus.On(Event_1.MapEventType.PEOPLE_TRANSFORM, this.OnPeopleTransform.bind(this));
        eventBus.On(Event_1.MapEventType.AIMAT, this.OnAimat.bind(this));
        eventBus.On(Event_1.MapEventType.CHAT, this.OnChat.bind(this));
        eventBus.On(Event_1.MapEventType.PET_SHOW, this.OnPetShow.bind(this));
        eventBus.On(Event_1.MapEventType.CHANGE_NICKNAME, this.OnChangeNickname.bind(this));
        eventBus.On(Event_1.MapEventType.CHANGE_COLOR, this.OnChangeColor.bind(this));
        eventBus.On(Event_1.MapEventType.ON_OR_OFF_FLYING, this.OnOrOffFlying.bind(this));
    }
    async OnPeopleWalk(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.PEOPLE_WALK);
    }
    async OnDanceAction(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.DANCE_ACTION);
    }
    async OnPeopleTransform(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.PEOPLE_TRANSFORM);
    }
    async OnAimat(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.AIMAT);
    }
    async OnChat(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.CHAT);
    }
    async OnPetShow(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.PET_SHOW);
    }
    async OnChangeNickname(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.CHANGE_NICKNAME);
    }
    async OnChangeColor(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.CHANGE_COLOR);
    }
    async OnOrOffFlying(event) {
        await this.BroadcastToMapOthers(event.mapId, event.packet, event.playerId, Event_1.MapEventType.ON_OR_OFF_FLYING);
    }
    async BroadcastToMapOthers(mapId, packet, senderUserId, eventType) {
        if (mapId <= 0) {
            return;
        }
        const sent = await this._broadcastService.BroadcastToMap(mapId, packet, senderUserId);
        if (sent > 0) {
            utils_1.Logger.Debug(`[MapBroadcastManager] event=${eventType}, sender=${senderUserId || 0}, mapId=${mapId}, sent=${sent}`);
        }
    }
}
exports.MapBroadcastManager = MapBroadcastManager;
//# sourceMappingURL=MapBroadcastManager.js.map