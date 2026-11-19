"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const OnlineTracker_1 = require("../Player/OnlineTracker");
const SeerMapUserInfoProto_1 = require("../../../shared/proto/common/SeerMapUserInfoProto");
const GetSimUserInfoRspProto_1 = require("../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto");
const ListMapPlayerRspProto_1 = require("../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto");
const PlayerRepository_1 = require("../../../DataBase/repositories/Player/PlayerRepository");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const Send_1 = require("../../Server/Packet/Send");
const PacketChangeCloth_1 = require("../../Server/Packet/Send/Item/PacketChangeCloth");
const BossAbilityConfig_1 = require("../Battle/BossAbility/BossAbilityConfig");
const EventTypes_1 = require("../Event/EventTypes");
const MapVisibilityService_1 = require("./MapVisibilityService");
/**
 * 鍦板浘绠＄悊鍣?
 * 澶勭悊鍦板浘鐩稿叧鐨勬墍鏈夐€昏緫锛氳繘鍏ャ€佺寮€鍦板浘銆佺帺瀹剁Щ鍔ㄣ€佽亰澶╃瓑
 *
 * 閲嶆瀯璇存槑锛?
 * - 浠庡叏灞€鍗曚緥鏀逛负 Player 瀹炰緥 Manager
 * - 缁ф壙 BaseManager 鑾峰緱渚挎嵎鏂规硶
 * - 涓嶅啀闇€瑕佷紶 userId 鍙傛暟
 */
class MapManager extends BaseManager_1.BaseManager {
    _onlineTracker;
    _mapVisibility;
    _playerRepo; // 鐢ㄤ簬鏌ヨ鍏朵粬鐜╁鏁版嵁
    constructor(player) {
        super(player);
        this._onlineTracker = OnlineTracker_1.OnlineTracker.Instance;
        this._mapVisibility = new MapVisibilityService_1.MapVisibilityService(this._onlineTracker);
        this._playerRepo = new PlayerRepository_1.PlayerRepository(); // 淇濈暀鐢ㄤ簬鏌ヨ鍏朵粬鐜╁
    }
    RegisterEvents(eventBus) {
        // Keep old cleanup order: map leave should happen before battle cleanup.
        eventBus.On(EventTypes_1.PlayerEventType.LOGOUT, this.OnPlayerLogout.bind(this), 10);
    }
    async OnPlayerLogout(_event) {
        await this.HandleLeaveMap();
    }
    /**
     * Build map appearance from equipped clothing, never inventory ownership.
     */
    BuildWornClothes(playerData) {
        const wornIds = playerData?.clothIds;
        if (Array.isArray(wornIds)) {
            return wornIds
                .map(id => ({ id: Number(id) || 0, level: 0 }))
                .filter(c => c.id > 0);
        }
        return [];
    }
    /**
     * 澶勭悊杩涘叆鍦板浘
     */
    async HandleEnterMap(req) {
        if (req.mapId >= 9700 && req.mapId <= 9794) {
            try {
                if (!await require('../Universe/discovery').enter(this.Player, req)) throw new Error('Unknown universe map');
            } catch (error) {
                utils_1.Logger.Error('[Universe] Map entry rejected', error);
                const { PacketEmpty } = require('../../Server/Packet/Send/PacketEmpty');
                await this.Player.SendPacket(new PacketEmpty(2001).setResult(5001));
                return;
            }
        }
        this.Player.BattleManager.InvalidatePendingCapture();
        let mapId = req.mapId || 1;
        const mapType = req.mapType;
        const x = req.x || 500;
        const y = req.y || 300;
        if (mapId === this.UserID) {
            mapId = this.UserID;
            utils_1.Logger.Debug(`[MapManager] home map request detected, mapId=${mapId}`);
        }
        utils_1.Logger.Info(`[MapManager] ===== enter map: user=${this.UserID} =====`);
        utils_1.Logger.Info(`[MapManager] mapId=${mapId}, mapType=${mapType}, pos=(${x}, ${y})`);
        utils_1.Logger.Info(`[MapManager] nick=${this.Player.Data.nick}`);
        utils_1.Logger.Info(`[MapManager] current data mapId=${this.Player.Data.mapID}`);
        const existingPlayers = this._onlineTracker.GetPlayersInMap(mapId);
        utils_1.Logger.Info(`[MapManager] map ${mapId} players before update: ${existingPlayers.length} [${existingPlayers.join(', ')}]`);
        this._onlineTracker.UpdatePlayerMap(this.UserID, mapId, mapType, x, y);
        const updatedPlayers = this._onlineTracker.GetPlayersInMap(mapId);
        utils_1.Logger.Info(`[MapManager] map ${mapId} players after update: ${updatedPlayers.length} [${updatedPlayers.join(', ')}]`);
        this.Player.Data.mapID = mapId;
        this.Player.Data.posX = x;
        this.Player.Data.posY = y;
        utils_1.Logger.Debug(`[MapManager] enter map before save clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);
        await DatabaseHelper_1.DatabaseHelper.Instance.SavePlayerData(this.Player.Data);
        utils_1.Logger.Debug(`[MapManager] enter map after save clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);
        utils_1.Logger.Info(`[MapManager] player position synced to map ${mapId}`);
        this.Player.MapSpawnManager.OnEnterMap(mapId);
        utils_1.Logger.Debug(`[MapManager] HandleEnterMap clothIds=${JSON.stringify(this.Player.Data.clothIds)}`);
        const userInfo = this.buildUserInfo(this.UserID, this.Player.Data, x, y, this.Player);
        const currentWornClothIds = this.BuildWornClothes(this.Player.Data).map(c => c.id);
        await this.Player.SendPacket(new Send_1.PacketEnterMap(userInfo, 0, this.Player.ClientProtocol));
        utils_1.Logger.Info('[MapManager] enter map response sent');
        if (currentWornClothIds.length > 0) {
            utils_1.Logger.Debug(`[MapManager] enter map self cloth sync=${JSON.stringify(currentWornClothIds)}`);
            await this.Player.SendPacket(new PacketChangeCloth_1.PacketChangeCloth(this.UserID, currentWornClothIds));
        }
        await this.sendMapPlayerList(mapId);
        await this.sendMapOgreList(mapId);
        await this.sendMapBossList(mapId);
        if (mapId === 32 && this.IsLeiyiWeather()) {
            utils_1.Logger.Info(`[MapManager] map 32 weather boss refresh triggered, minute=${new Date().getMinutes()}`);
            await this.Player.SendPacket(new Send_1.PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
            await this.Player.SendPacket(new Send_1.PacketMapBoss([{ id: 70, region: 0, hp: 0, pos: 0 }]));
        }
        const gaiyaMapId = this.GetGaiyaMapIDForToday();
        if (mapId === gaiyaMapId) {
            utils_1.Logger.Info(`[MapManager] today gaiya map id=${mapId}`);
            // TODO: special pet note integration.
        }
        const enterPacket = new Send_1.PacketEnterMap(userInfo, 0, this.Player.ClientProtocol);
        const sent = await this._mapVisibility.BroadcastToMap(mapId, enterPacket, {
            excludeUserId: this.UserID
        });
        if (sent > 0) {
            utils_1.Logger.Info(`[MapManager] broadcast enter map to ${sent} players`);
            const clothIds = this.Player.Data.clothIds;
            if (Array.isArray(clothIds) && clothIds.length > 0) {
                await this._mapVisibility.BroadcastToMap(mapId, new PacketChangeCloth_1.PacketChangeCloth(this.UserID, clothIds), { excludeUserId: this.UserID });
            }
        }
        else {
            utils_1.Logger.Info('[MapManager] no other players in map, skip enter broadcast');
        }
        const refreshed = await this._mapVisibility.RefreshMapPlayerLists(mapId, {
            excludeUserId: this.UserID
        });
        utils_1.Logger.Debug(`[MapManager] enter map refresh player list: mapId=${mapId}, refreshed=${refreshed}`);
        utils_1.Logger.Info('[MapManager] ===== enter map done =====');
    }
    async HandleLeaveMap() {
        this.Player.BattleManager.InvalidatePendingCapture();
        const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
        utils_1.Logger.Info(`[MapManager] 鐜╁ ${this.UserID} 绂诲紑鍦板浘 ${mapId}`);
        // 骞挎挱鐜╁绂诲紑娑堟伅缁欏悓鍦板浘鍏朵粬鐜╁
        if (mapId > 0) {
            const leavePacket = new Send_1.PacketLeaveMap(this.UserID);
            const sent = await this._mapVisibility.BroadcastToMap(mapId, leavePacket, {
                excludeUserId: this.UserID
            });
            if (sent > 0) {
                utils_1.Logger.Info(`[MapManager] broadcast leave map to ${sent} players`);
            }
        }
        // 閫氱煡 MapSpawnManager 鐜╁绂诲紑鍦板浘锛堟竻闄ょ姸鎬侊級
        this.Player.MapSpawnManager.OnLeaveMap();
        // 鏇存柊鍦ㄧ嚎杩借釜锛堣缃负鍦板浘0锛?
        this._onlineTracker.UpdatePlayerMap(this.UserID, 0, 0);
        // 鍙戦€佺寮€鍦板浘鍝嶅簲缁欒嚜宸?
        await this.Player.SendPacket(new Send_1.PacketLeaveMap(this.UserID));
        // 缁欎粛鍦ㄨ鍦板浘鐨勭帺瀹舵帹閫佹渶鏂扮帺瀹跺垪琛紙閬垮厤瀹㈡埛绔畫鐣欏満鏅璞★級
        if (mapId > 0) {
            const refreshed = await this._mapVisibility.RefreshMapPlayerLists(mapId);
            utils_1.Logger.Debug(`[MapManager] LeaveMap refresh map player list: mapId=${mapId}, refreshed=${refreshed}`);
        }
        // 娉ㄦ剰锛氫笉闇€瑕佸彂閫佺┖鐨勯噹鎬垪琛?
        // 瀹㈡埛绔細鍦?MAP_SWITCH_OPEN 鎴?MAP_DESTROY 浜嬩欢鏃惰嚜鍔ㄦ竻鐞嗛噹鎬?
    }
    /**
     * 澶勭悊鍦板浘鐜╁鍒楄〃璇锋眰
     */
    async HandleListMapPlayer() {
        const mapId = this._onlineTracker.GetPlayerMap(this.UserID);
        await this.sendMapPlayerList(mapId);
        // The old client rebuilds the map after battle, then requests this list.
        // Its earlier battle-end ogre push was discarded while the map was destroyed.
        if (mapId <= 0 || this._onlineTracker.GetPlayerMap(this.UserID) !== mapId || this.Player.Data.mapID !== mapId)
            return;
        await this.Player.SendPacket(new Send_1.PacketMapOgreList(this.Player.MapSpawnManager.GetMapOgres(mapId)));
        // 登录时随 2001 推送的 BOSS 列表同样会在地图建好之前被丢掉（直接登录在 SPT 地图上看不到 BOSS），这里补发
        await this.sendMapBossList(mapId);
    }
    /**
     * 澶勭悊鍦板浘鎬墿鍒楄〃
     */
    async HandleMapOgreList() {
        const mapId = this.Player.Data.mapID || 1;
        // 浣跨敤 MapSpawnManager 鑾峰彇鐜╁鐨勯噹鎬垪琛?
        const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
        await this.Player.SendPacket(new Send_1.PacketMapOgreList(ogres));
    }
    /**
     * 鎺ㄩ€佸湴鍥綛OSS鍒楄〃锛堝彧鍦ㄦ湁BOSS鏃舵帹閫侊級
     * @param mapId 鍦板浘ID
     */
    async sendMapBossList(mapId) {
        const bosses = this.Player.MapSpawnManager.GetMapBosses(mapId);
        // 鍙湪鏈塀OSS鏃舵墠鎺ㄩ€?
        if (bosses.length > 0) {
            await this.Player.SendPacket(new Send_1.PacketMapBoss(bosses));
            utils_1.Logger.Info(`[MapManager] 鎺ㄩ€丅OSS鍒楄〃: mapId=${mapId}, count=${bosses.length}`);
        }
        else {
            utils_1.Logger.Debug(`[MapManager] 鍦板浘鏃燘OSS锛岃烦杩囨帹閫? mapId=${mapId}`);
        }
    }
    /**
     * 澶勭悊鑾峰彇绠€鍗曠敤鎴蜂俊鎭?
     */
    async HandleGetSimUserInfo(targetId) {
        // 濡傛灉娌℃湁鎸囧畾鐩爣锛岄粯璁ゆ煡璇㈣嚜宸?
        const queryId = targetId || this.UserID;
        const playerData = queryId === this.UserID
            ? this.Player.Data
            : await this._playerRepo.FindByUserId(queryId);
        if (!playerData) {
            utils_1.Logger.Warn(`[MapManager] 鐜╁鏁版嵁涓嶅瓨鍦?${queryId}`);
            return;
        }
        await this.Player.SendPacket(new GetSimUserInfoRspProto_1.GetSimUserInfoRspProto()
            .setUserId(queryId)
            .setNick(playerData.nick)
            .setColor(playerData.color)
            .setTexture(playerData.texture)
            .setVip(playerData.vip)
            .setStatus(0)
            .setMapType(this._onlineTracker.GetPlayerMap(queryId) > 0 ? 1 : 0)
            .setMapId(playerData.mapID)
            .setIsCanBeTeacher(0)
            .setTeacherID(playerData.teacherID)
            .setStudentID(playerData.studentID)
            .setGraduationCount(playerData.graduationCount)
            .setVipLevel(playerData.vipStage)
            .setTeamId(playerData.teamInfo.id)
            .setTeamIsShow(playerData.teamInfo.isShow ? 1 : 0)
            .setClothes(this.BuildWornClothes(playerData)));
    }
    /**
     * 澶勭悊淇敼鏄电О
     */
    async sendMapPlayerList(mapId) {
        const playerIds = this._onlineTracker.GetPlayersInMap(mapId);
        const players = [];
        utils_1.Logger.Debug(`[MapManager] build map player list: mapId=${mapId}, online=[${playerIds.join(', ')}]`);
        for (const pid of playerIds) {
            const playerSession = this._onlineTracker.GetPlayerSession(pid);
            if (playerSession?.Player) {
                const playerData = playerSession.Player.Data;
                const position = this._onlineTracker.GetPlayerPosition(pid);
                const x = position ? position.x : playerData.posX;
                const y = position ? position.y : playerData.posY;
                const userInfo = this.buildUserInfo(pid, playerData, x, y, playerSession.Player);
                players.push(userInfo);
                utils_1.Logger.Debug(`[MapManager] add online player to list: id=${pid}, nick=${playerData.nick}, pos=(${x}, ${y})`);
            }
            else {
                utils_1.Logger.Warn(`[MapManager] player ${pid} found in map list but no online session, fallback to repository`);
                const playerData = await this._playerRepo.FindByUserId(pid);
                if (playerData) {
                    const userInfo = this.buildUserInfo(pid, playerData, playerData.posX, playerData.posY);
                    players.push(userInfo);
                }
            }
        }
        const rsp = new ListMapPlayerRspProto_1.ListMapPlayerRspProto();
        rsp.players = players;
        await this.Player.SendPacket(rsp);
        utils_1.Logger.Info(`[MapManager] map player list sent: mapId=${mapId}, user=${this.UserID}, count=${players.length}`);
    }
    async sendMapOgreList(mapId) {
        try {
            const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);
            const activeOgres = ogres.filter(o => o.petId > 0);
            if (activeOgres.length > 0) {
                await this.Player.SendPacket(new Send_1.PacketMapOgreList(ogres));
                utils_1.Logger.Info(`[MapManager] map ogre list sent: mapId=${mapId}, count=${activeOgres.length}`);
            }
            else {
                utils_1.Logger.Debug(`[MapManager] map has no active ogres, skip: mapId=${mapId}`);
            }
        }
        catch (error) {
            utils_1.Logger.Error('[MapManager] failed to send map ogre list', error);
        }
    }
    buildUserInfo(userId, playerData, x, y, playerInstance) {
        const userInfo = new SeerMapUserInfoProto_1.SeerMapUserInfoProto();
        // 鍩烘湰淇℃伅
        userInfo.sysTime = Math.floor(Date.now() / 1000);
        userInfo.userID = userId;
        userInfo.nick = playerData.nick;
        userInfo.color = playerData.color;
        userInfo.texture = playerData.texture;
        // VIP淇℃伅
        let vipFlags = 0;
        if (playerData.vip === 1)
            vipFlags |= 1;
        if (playerData.viped === 1)
            vipFlags |= 2;
        if (playerData.superNono)
            vipFlags |= 4;
        userInfo.vipFlags = vipFlags;
        userInfo.vipStage = playerData.vipStage;
        // 浣嶇疆鍜屽姩浣?
        userInfo.actionType = playerData.actionType || 0;
        userInfo.x = x;
        userInfo.y = y;
        userInfo.action = playerData.action || 0;
        userInfo.direction = playerData.direction || 0;
        userInfo.changeShape = playerData.changeShape || 0;
        // 绮剧伒淇℃伅 - 浠庢纭殑鐜╁绮剧伒鏁版嵁鑾峰彇
        let defaultPet = null;
        if (playerInstance?.PetManager) {
            defaultPet = playerInstance.PetManager.GetDefaultPet();
        }
        userInfo.spiritTime = defaultPet?.catchTime || 0;
        userInfo.spiritID = defaultPet?.petId || 0;
        userInfo.petDV = defaultPet?.dvHp || 31;
        userInfo.petSkin = defaultPet?.skinId || 0;
        userInfo.petShiny = defaultPet?.shiny ?? 0;
        userInfo.fightFlag = playerData.fightFlag || 0;
        // 甯堝緬淇℃伅
        userInfo.teacherID = playerData.teacherID;
        userInfo.studentID = playerData.studentID;
        // NoNo淇℃伅
        userInfo.nonoState = playerData.nonoState;
        userInfo.nonoColor = playerData.nonoColor;
        userInfo.superNono = playerData.superNono ? 1 : 0;
        userInfo.playerForm = playerData.playerForm ? 1 : 0;
        userInfo.transTime = playerData.transTime || 0;
        // 鎴橀槦淇℃伅
        userInfo.teamId = playerData.teamInfo.id;
        userInfo.teamCoreCount = playerData.teamInfo.coreCount;
        userInfo.teamIsShow = playerData.teamInfo.isShow ? 1 : 0;
        userInfo.teamLogoBg = playerData.teamInfo.logoBg;
        userInfo.teamLogoIcon = playerData.teamInfo.logoIcon;
        userInfo.teamLogoColor = playerData.teamInfo.logoColor;
        userInfo.teamTxtColor = playerData.teamInfo.txtColor;
        userInfo.teamLogoWord = playerData.teamInfo.logoWord;
        // 鏈嶈鍒楄〃
        const wornClothIds = playerData.clothIds;
        utils_1.Logger.Debug(`[MapManager] buildUserInfo clothIds: ${JSON.stringify(wornClothIds)}`);
        userInfo.clothes = this.BuildWornClothes(playerData);
        // 绉板彿
        userInfo.curTitle = playerData.curTitle;
        return userInfo;
    }
    /**
     * 鏄惁澶勪簬"闆烽洦澶?锛堣但灏斿崱鏄熼浄浼婂嚭鍦烘潯浠讹級
     * 鐢ㄦ椂闂存ā鎷燂細姣忓皬鏃剁殑 20~40 鍒嗛挓涓洪浄闆ㄥぉ
     */
    IsLeiyiWeather() {
        const m = new Date().getMinutes();
        return m >= 20 && m < 40;
    }
    /**
     * 浠婃棩鐩栦簹鍑虹幇鐨勫湴鍥?ID
     * 浣跨敤 BossAbilityConfig 涓殑鍛ㄥ嚑鍑虹幇瑙勫垯
     */
    GetGaiyaMapIDForToday() {
        const weekday = new Date().getDay(); // 0=鍛ㄦ棩, 1=鍛ㄤ竴, ..., 6=鍛ㄥ叚
        const rule = BossAbilityConfig_1.BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(261, weekday); // 261 = 鐩栦簹
        return rule?.mapId || 15;
    }
}
exports.MapManager = MapManager;
//# sourceMappingURL=MapManager.js.map