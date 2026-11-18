"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapActionManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const OnlineTracker_1 = require("../Player/OnlineTracker");
const PacketMapOgreList_1 = require("../../Server/Packet/Send/Map/PacketMapOgreList");
const PeopleWalkRspProto_1 = require("../../../shared/proto/packets/rsp/map/PeopleWalkRspProto");
const DanceActionRspProto_1 = require("../../../shared/proto/packets/rsp/map/DanceActionRspProto");
const PeopleTransformRspProto_1 = require("../../../shared/proto/packets/rsp/map/PeopleTransformRspProto");
const AimatRspProto_1 = require("../../../shared/proto/packets/rsp/map/AimatRspProto");
const ChatRspProto_1 = require("../../../shared/proto/packets/rsp/map/ChatRspProto");
const PacketChangeColor_1 = require("../../Server/Packet/Send/Map/PacketChangeColor");
const PacketChangeNickName_1 = require("../../Server/Packet/Send/Map/PacketChangeNickName");
const PacketOnOrOffFlying_1 = require("../../Server/Packet/Send/Map/PacketOnOrOffFlying");
const Event_1 = require("../Event");
/**
 * Handles high-frequency map actions (state + self response).
 * Broadcast to other players is handled by MapBroadcastManager via events.
 */
class MapActionManager extends BaseManager_1.BaseManager {
    _onlineTracker;
    constructor(player) {
        super(player);
        this._onlineTracker = OnlineTracker_1.OnlineTracker.Instance;
    }
    async HandlePeopleWalk(req) {
        if (this.Player.Data.mapID >= 9700 && this.Player.Data.mapID <= 9794 && !require('../Universe/movement').accept(this.Player, req)) {
            const { PacketEmpty } = require('../../Server/Packet/Send/PacketEmpty');
            await this.Player.SendPacket(new PacketEmpty(2101).setResult(5001));
            return;
        }
        const mapId = this.Player.Data.mapID;
        const oldX = this.Player.Data.posX;
        const oldY = this.Player.Data.posY;
        this.Player.Data.posX = req.x;
        this.Player.Data.posY = req.y;
        if (mapId > 0) {
            this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, 0, req.x, req.y);
        }
        const rsp = new PeopleWalkRspProto_1.PeopleWalkRspProto(req.walkType, this.UserID, req.x, req.y, req.amfData);
        await this.Player.SendPacket(rsp);
        if (mapId > 0) {
            const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
            await this.Player.SendPacket(new PacketMapOgreList_1.PacketMapOgreList(ogres));
            utils_1.Logger.Debug(`[MapActionManager] walk userId=${this.UserID}, pos=(${oldX},${oldY})->(${req.x},${req.y}), mapId=${mapId}`);
        }
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.PEOPLE_WALK,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet: rsp,
            });
        }
    }
    async HandleDanceAction(req) {
        const mapId = this.Player.Data.mapID;
        const rsp = new DanceActionRspProto_1.DanceActionRspProto(this.UserID, req.actionId, req.actionType);
        await this.Player.SendPacket(rsp);
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.DANCE_ACTION,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet: rsp,
            });
        }
    }
    async HandlePeopleTransform(req) {
        const mapId = this.Player.Data.mapID;
        const rsp = new PeopleTransformRspProto_1.PeopleTransformRspProto(this.UserID, req.transId);
        await this.Player.SendPacket(rsp);
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.PEOPLE_TRANSFORM,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet: rsp,
            });
        }
    }
    async HandleAimat(req) {
        const mapId = this.Player.Data.mapID;
        const rsp = new AimatRspProto_1.AimatRspProto(this.UserID, req.targetType, req.targetId, req.x, req.y);
        await this.Player.SendPacket(rsp);
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.AIMAT,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet: rsp,
            });
        }
    }
    async HandleMapChat(req) {
        const mapId = this.Player.Data.mapID;
        utils_1.Logger.Info(`[MapActionManager] chat userId=${this.UserID}: ${req.msg}`);
        const rsp = new ChatRspProto_1.ChatRspProto()
            .setSenderId(this.UserID)
            .setSenderNick(this.Player.Data.nick)
            .setToId(0)
            .setMsg(req.msg);
        await this.Player.SendPacket(rsp);
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.CHAT,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet: rsp,
            });
        }
    }
    async HandleChangeNickName(newNick) {
        this.Player.Data.nick = newNick;
        const packet = new PacketChangeNickName_1.PacketChangeNickName(this.UserID, newNick);
        await this.Player.SendPacket(packet);
        const mapId = this.Player.Data.mapID;
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.CHANGE_NICKNAME,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet,
            });
        }
        utils_1.Logger.Info(`[MapActionManager] change nickname userId=${this.UserID}, nick=${newNick}`);
    }
    async HandleChangeColor(newColor) {
        this.Player.Data.color = newColor;
        const packet = new PacketChangeColor_1.PacketChangeColor(this.UserID, newColor, 0, this.Player.Data.coins);
        await this.Player.SendPacket(packet);
        const mapId = this.Player.Data.mapID;
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.CHANGE_COLOR,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet,
            });
        }
        utils_1.Logger.Info(`[MapActionManager] change color userId=${this.UserID}, color=0x${newColor.toString(16)}`);
    }
    async HandleOnOrOffFlying(flyMode) {
        const normalizedFlyMode = flyMode > 0 ? 1 : 0;
        // Persist actor flying state via PlayerData.actionType (0=walk, 1=fly).
        this.Player.Data.actionType = normalizedFlyMode;
        const packet = new PacketOnOrOffFlying_1.PacketOnOrOffFlying(this.UserID, normalizedFlyMode);
        await this.Player.SendPacket(packet);
        const mapId = this.Player.Data.mapID;
        if (mapId > 0) {
            await this.Player.EventBus.Emit({
                type: Event_1.MapEventType.ON_OR_OFF_FLYING,
                timestamp: Date.now(),
                playerId: this.UserID,
                mapId,
                packet,
            });
        }
        utils_1.Logger.Info(`[MapActionManager] on/off flying userId=${this.UserID}, flyMode=${normalizedFlyMode}`);
    }
}
exports.MapActionManager = MapActionManager;
//# sourceMappingURL=MapActionManager.js.map