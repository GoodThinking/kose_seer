"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginManager = exports.LoginResult = void 0;
const ServerConfig_1 = require("../../../shared/config/ServerConfig");
const Login_1 = require("../../Server/Packet/Send/Login");
const PacketEnterMap_1 = require("../../Server/Packet/Send/Map/PacketEnterMap");
const DataBase_1 = require("../../../DataBase");
const utils_1 = require("../../../shared/utils");
const PlayerManager_1 = require("../Player/PlayerManager");
const OnlineTracker_1 = require("../Player/OnlineTracker");
const proto_1 = require("../../../shared/proto");
const crypto_1 = require("crypto");
const SessionToken_1 = require("../../../shared/protocol/SessionToken");
const PacketEmpty_1 = require("../../Server/Packet/Send/PacketEmpty");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const SaveTaskState_1 = require("../Task/SaveTaskState");
/**
 * 登录结果码 (与客户端 ParseLoginSocketError.as 保持一致)
 */
var LoginResult;
(function (LoginResult) {
    LoginResult[LoginResult["SUCCESS"] = 0] = "SUCCESS";
    LoginResult[LoginResult["SYSTEM_ERROR"] = 5001] = "SYSTEM_ERROR";
    LoginResult[LoginResult["ACCOUNT_EXISTS"] = 5002] = "ACCOUNT_EXISTS";
    LoginResult[LoginResult["PASSWORD_ERROR"] = 5003] = "PASSWORD_ERROR";
    LoginResult[LoginResult["NOT_ACTIVATED"] = 5004] = "NOT_ACTIVATED";
    LoginResult[LoginResult["ACCOUNT_NOT_FOUND"] = 5005] = "ACCOUNT_NOT_FOUND";
    LoginResult[LoginResult["BANNED_PERMANENT"] = 5006] = "BANNED_PERMANENT";
    LoginResult[LoginResult["BANNED_24H"] = 5007] = "BANNED_24H";
    LoginResult[LoginResult["PROTOCOL_ERROR"] = 5008] = "PROTOCOL_ERROR";
    LoginResult[LoginResult["TOO_MANY_ATTEMPTS"] = 5009] = "TOO_MANY_ATTEMPTS";
    LoginResult[LoginResult["INVALID_NICKNAME"] = 5010] = "INVALID_NICKNAME";
    LoginResult[LoginResult["SERVER_MAINTENANCE"] = 5011] = "SERVER_MAINTENANCE";
    LoginResult[LoginResult["INVALID_INVITE_CODE"] = 5012] = "INVALID_INVITE_CODE";
    LoginResult[LoginResult["BANNED_PERMANENT_2"] = 5013] = "BANNED_PERMANENT_2";
    LoginResult[LoginResult["BANNED_24H_2"] = 5014] = "BANNED_24H_2";
    LoginResult[LoginResult["BANNED_7D"] = 5015] = "BANNED_7D";
    LoginResult[LoginResult["BANNED_14D"] = 5016] = "BANNED_14D";
})(LoginResult || (exports.LoginResult = LoginResult = {}));
/**
 * 登录管理器
 * 负责处理登录相关的业务逻辑
 */
class LoginManager {
    _packetBuilder;
    _packetGameLogin;
    _accountRepo;
    _sessionRepo;
    _playerRepo;
    _playerManager;
    authenticatedConnections = new WeakMap();
    PasswordMatches(wire, stored) {
        if (!Buffer.isBuffer(wire) || wire.length !== 32 || !/^[0-9a-fA-F]{32}$/.test(stored))
            return false;
        const text = wire.toString('ascii');
        if (!/^[0-9a-fA-F]{32}$/.test(text) || !wire.equals(Buffer.from(text, 'ascii')))
            return false;
        return (0, crypto_1.timingSafeEqual)(Buffer.from(text.toLowerCase(), 'ascii'), Buffer.from(stored.toLowerCase(), 'ascii'));
    }
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
        this._packetGameLogin = new Login_1.PacketGameLogin(packetBuilder);
        this._accountRepo = new DataBase_1.AccountRepository();
        this._sessionRepo = new DataBase_1.SessionRepository();
        this._playerRepo = new DataBase_1.PlayerRepository();
        this._playerManager = PlayerManager_1.PlayerManager.GetInstance(packetBuilder);
    }
    /**
     * 发送Proto响应（没有Player实例时使用）
     */
    sendProto(session, userID, proto) {
        const packet = this._packetBuilder.Build(proto.getCmdId(), userID, proto.getResult(), proto.serialize(ServerConfig_1.Config.Game.clientProtocol));
        session.Socket.write(packet);
    }
    /**
     * 处理主登录
     * @param session 客户端会话
     * @param userID 用户ID (米米号)
     * @param passwordMD5 密码MD5
     */
    async HandleMainLogin(session, userID, passwordMD5) {
        this.authenticatedConnections.delete(session);
        delete session.AuthenticatedSessionKey;
        try {
            // 验证账号是否存在
            const account = await this._accountRepo.FindAccountById(userID);
            if (!account) {
                utils_1.Logger.Warn(`[LoginManager] 账号不存在: ${userID}`);
                this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
                return;
            }
            // 验证密码
            if (!this.PasswordMatches(passwordMD5, account.passwordHash)) {
                utils_1.Logger.Warn(`[LoginManager] 密码错误: ${userID}`);
                this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(LoginResult.PASSWORD_ERROR));
                return;
            }
            // 检查账号状态
            if (account.status !== 0) {
                utils_1.Logger.Warn(`[LoginManager] 账号状态异常: ${userID}, status=${account.status}`);
                const banResult = this.getBanResultCode(account.status);
                this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(banResult));
                return;
            }
            // 创建会话
            const ip = session.Address || '127.0.0.1';
            const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);
            // 更新最后登录时间
            await this._accountRepo.UpdateLastLogin(userID, ip);
            // 检查是否已创建角色
            const roleCreated = account.roleCreated;
            utils_1.Logger.Info(`[LoginManager] 主登录成功（玩家上线，未进入服务器）: userID=${userID}, roleCreated=${roleCreated}`);
            const proto = new proto_1.MainLoginRspProto()
                .setSession(sessionInfo.sessionKey)
                .setRoleCreated(roleCreated);
            this.authenticatedConnections.set(session, { accountId: userID, sessionKey: sessionInfo.sessionKey });
            session.UserID = userID;
            this.sendProto(session, userID, proto);
        }
        catch (err) {
            this.authenticatedConnections.delete(session);
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 登录失败: ${userID}`, error);
            this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
        }
    }
    /**
     * 处理邮箱登录
     * @param session 客户端会话
     * @param email 邮箱地址
     * @param passwordMD5 密码MD5
     */
    async HandleEmailLogin(session, email, passwordMD5) {
        this.authenticatedConnections.delete(session);
        delete session.AuthenticatedSessionKey;
        try {
            // 1. 根据邮箱查找账号
            const account = await this._accountRepo.FindByEmail(email);
            if (!account) {
                utils_1.Logger.Warn(`[LoginManager] 邮箱账号不存在: ${email}`);
                this.sendProto(session, 0, new proto_1.MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
                return;
            }
            const userID = account.id;
            // 2. 验证密码
            if (!this.PasswordMatches(passwordMD5, account.passwordHash)) {
                utils_1.Logger.Warn(`[LoginManager] 邮箱登录密码错误: ${email}`);
                this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(LoginResult.PASSWORD_ERROR));
                return;
            }
            // 3. 检查账号状态
            if (account.status !== 0) {
                utils_1.Logger.Warn(`[LoginManager] 账号状态异常: ${userID}, status=${account.status}`);
                const banResult = this.getBanResultCode(account.status);
                this.sendProto(session, userID, new proto_1.MainLoginRspProto().setResult(banResult));
                return;
            }
            // 4. 创建会话
            const ip = session.Address || '127.0.0.1';
            const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);
            // 5. 更新最后登录时间
            await this._accountRepo.UpdateLastLogin(userID, ip);
            // 6. 检查是否已创建角色
            const roleCreated = account.roleCreated;
            // 注意：不在这里创建 PlayerInstance
            // PlayerInstance 应该在 CMD 1001 (LOGIN_IN) 时创建
            // 这里只是验证账号密码，返回 session token
            utils_1.Logger.Info(`[LoginManager] 邮箱登录成功: userID=${userID}, email=${email}, roleCreated=${roleCreated}`);
            const proto = new proto_1.MainLoginRspProto()
                .setSession(sessionInfo.sessionKey)
                .setRoleCreated(roleCreated);
            this.authenticatedConnections.set(session, { accountId: userID, sessionKey: sessionInfo.sessionKey });
            session.UserID = userID;
            this.sendProto(session, userID, proto);
        }
        catch (err) {
            this.authenticatedConnections.delete(session);
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 邮箱登录失败: ${email}`, error);
            this.sendProto(session, 0, new proto_1.MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
        }
    }
    /**
     * 根据账号状态获取封禁错误码
     */
    getBanResultCode(status) {
        switch (status) {
            case 1: return LoginResult.BANNED_24H; // 24小时封停
            case 2: return LoginResult.BANNED_7D; // 7天封停
            case 3: return LoginResult.BANNED_14D; // 14天封停
            case 4: return LoginResult.BANNED_PERMANENT; // 永久封停
            default: return LoginResult.BANNED_PERMANENT;
        }
    }
    /**
     * 处理游戏登录
     * @param session 客户端会话
     * @param userID 用户ID
     * @param sessionData 会话标识
     */
    async HandleGameLogin(session, userID, sessionData) {
        delete session.AuthenticatedSessionKey;
        try {
            const sessionKey = (0, SessionToken_1.SessionKeyFromWire)(sessionData);
            const validSession = await this._sessionRepo.ValidateSession(sessionKey, userID);
            const account = validSession ? await this._accountRepo.FindAccountById(userID) : null;
            if (!validSession || !account || account.status !== 0) {
                this.sendProto(session, userID, new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LOGIN_IN).setResult(LoginResult.PROTOCOL_ERROR));
                return;
            }
            session.UserID = userID;
            // 获取玩家数据
            const player = await this._playerRepo.FindByUserId(userID);
            if (!player) {
                utils_1.Logger.Warn(`[LoginManager] 玩家不存在: ${userID}`);
                const proto = this._packetGameLogin.BuildProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 }, sessionKey);
                this.sendProto(session, userID, proto.setResult(LoginResult.SYSTEM_ERROR));
                return;
            }
            // 更新登录次数
            await this._playerRepo.IncrementLoginCount(userID);
            // Restore the saved map and coordinates. Registration already selects the starter map.
            // Random relocation can send a reconnecting player into an uncached map resource.
            // 创建Player实例
            const playerInstance = await this._playerManager.CreatePlayer(session, userID, player.nick);
            if (session.Player !== playerInstance || playerInstance.Uid !== userID) {
                throw new Error('Authenticated player binding was not established');
            }
            session.AuthenticatedSessionKey = sessionKey;
            const loginData = playerInstance.Data;
            utils_1.Logger.Info(`[LoginManager] 游戏登录成功: userID=${userID}, nick=${loginData.nick}`);
            // CreatePlayer may flush a retained old cache before loading the new instance.
            // Use initialized data, including the persisted default Super NoNo entitlement.
            const proto = this._packetGameLogin.BuildProto(loginData, sessionKey);
            utils_1.Logger.Debug(`[LoginManager] 发送登录响应: loginCnt=${proto.loginCnt}, timeLimit=${proto.timeLimit}, mapId=${proto.mapId}, curStage=${proto.curStage}, maxStage=${proto.maxStage}, curFreshStage=${proto.curFreshStage}, maxFreshStage=${proto.maxFreshStage}`);
            utils_1.Logger.Debug(`[LoginManager] regTime=${proto.regTime} (${new Date(proto.regTime * 1000).toISOString()}), userId=${proto.userId}, nick=${proto.nickname}`);
            // 加载任务数据并填充到 Proto
            proto.taskList = playerInstance.TaskManager.GetTaskStatusArray();
            utils_1.Logger.Debug(`[LoginManager] 任务数据: 共${playerInstance.TaskManager.GetTaskCount()}个任务`);
            // 加载精灵数据并填充到 Proto（仅背包精灵）
            // 客户端的 initData() 只接收背包精灵的完整信息
            // 仓库精灵通过 getStorageList() 单独获取（发送 GET_PET_LIST）
            const bagPets = playerInstance.PetManager.GetPetsInBag();
            utils_1.Logger.Debug(`[LoginManager] 背包精灵数: ${bagPets.length}`);
            if (bagPets.length > 0) {
                utils_1.Logger.Debug(`[LoginManager] 背包精灵列表（排序后）: ${JSON.stringify(bagPets.map((p, idx) => ({
                    index: idx,
                    petId: p.petId,
                    level: p.level,
                    isDefault: p.isDefault,
                    catchTime: p.catchTime
                })))}`);
            }
            proto.petList = playerInstance.PetManager.GetPetProtoList(bagPets);
            utils_1.Logger.Info(`[LoginManager] 精灵数据: 共${bagPets.length}个背包精灵`);
            if (bagPets.length > 0) {
                utils_1.Logger.Info(`[LoginManager] 背包精灵: ${bagPets.map((p, idx) => `[${idx}]${p.petId}(Lv${p.level},${p.isDefault ? '首发' : ''},CT:0x${p.catchTime.toString(16)})`).join(', ')}`);
                utils_1.Logger.Debug(`[LoginManager] proto.petList 长度: ${proto.petList.length}`);
                utils_1.Logger.Debug(`[LoginManager] proto.petList[0]: ${JSON.stringify({
                    id: proto.petList[0]?.id,
                    level: proto.petList[0]?.level,
                    catchTime: proto.petList[0]?.catchTime,
                    isDefault: bagPets[0]?.isDefault
                })}`);
            }
            else {
                utils_1.Logger.Warn(`[LoginManager] 玩家没有背包精灵！UserID=${userID}`);
            }
            // 当前穿戴只取 clothIds；背包拥有不等于已经装备。
            const wornClothIds = playerInstance.Data.clothIds;
            const clothList = (Array.isArray(wornClothIds)
                ? wornClothIds.map(id => Number(id) || 0).filter(id => id > 0)
                : [])
                .map(id => ({
                id,
                level: 0
            }));
            proto.clothList = clothList;
            utils_1.Logger.Info(`[LoginManager] 服装数据: 共${clothList.length}个服装`);
            // 加载挑战进度数据并填充到 Proto
            const achievementBuffer = playerInstance.ChallengeProgressManager.GetAchievementBuffer();
            proto.bossAchievement = Array.from(achievementBuffer).map(b => b === 1);
            proto.maxPuniLv = playerInstance.ChallengeProgressManager.GetPuniLevel();
            proto.dailyResArr = playerInstance.Data.dailyResArr?.length === 50 ? playerInstance.Data.dailyResArr : new Array(50).fill(0);
            const achievementCount = proto.bossAchievement.filter(a => a).length;
            utils_1.Logger.Info(`[LoginManager] 挑战进度数据: SPT BOSS击败=${achievementCount}/200`);
            // 发送响应
            await playerInstance.SendPacket(proto);
            utils_1.Logger.Info(`[LoginManager] 登录包已发送，等待客户端响应...`);
            // 登录后处理：调用各Manager的OnLogin方法（在发送响应之后）
            await playerInstance.OnLogin();
            utils_1.Logger.Info(`[LoginManager] OnLogin完成，玩家已完全登录`);
            // pushInitialMapEnter: 登录成功后主动推送 2001/2003/2004，使客户端直接进入地图
            const mapId = playerInstance.Data.mapID;
            const x = playerInstance.Data.posX || 500;
            const y = playerInstance.Data.posY || 300;
            require('../Universe/movement').resume(playerInstance, x, y);
            utils_1.Logger.Info(`[LoginManager] pushInitialMapEnter: UID=${userID}, MapID=${mapId}, X=${x}, Y=${y}`);
            // 添加玩家到地图
            OnlineTracker_1.OnlineTracker.Instance.PlayerLogin(userID, session);
            OnlineTracker_1.OnlineTracker.Instance.UpdatePlayerMap(userID, mapId, 0, x, y);
            // 构建并发送 2001 (ENTER_MAP)
            const userInfo = playerInstance.MapManager.buildUserInfo(userID, playerInstance.Data, x, y, playerInstance);
            await playerInstance.SendPacket(new PacketEnterMap_1.PacketEnterMap(userInfo, 0, playerInstance.ClientProtocol));
            // 发送 2003 (LIST_MAP_PLAYER) - 包含同地图所有人
            await playerInstance.MapManager.sendMapPlayerList(mapId);
            // 发送 2004 (MAP_OGRE_LIST)
            await playerInstance.MapManager.sendMapOgreList(mapId);
            // 发送 2021 (MAP_BOSS)
            await playerInstance.MapManager.sendMapBossList(mapId);
            // 发送 9003 (Nono info) - 使客户端 NonoManager.info 有完整数据
            await playerInstance.NoNoManager.HandleNoNoInfo();
            utils_1.Logger.Info(`[LoginManager] pushInitialMapEnter 完成: UID=${userID}, MapID=${mapId}`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 游戏登录失败: ${userID}`, error);
            delete session.AuthenticatedSessionKey;
            const proto = this._packetGameLogin.BuildProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 }, undefined);
            this.sendProto(session, userID, proto.setResult(LoginResult.SYSTEM_ERROR));
        }
    }
    /**
     * 获取玩家数据
     */
    async GetPlayer(userID) {
        try {
            const player = await this._playerRepo.FindByUserId(userID);
            if (!player)
                return null;
            return {
                userID: player.userID,
                nickname: player.nick,
                level: 1,
                exp: 0,
                coins: player.coins,
                roleCreated: true,
            };
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 获取玩家数据失败: ${userID}`, error);
            return null;
        }
    }
    /**
     * 创建玩家
     * @param session 客户端会话
     * @param userID 用户ID
     * @param nickname 昵称
     * @param color 颜色
     */
    async CreatePlayer(session, userID, nickname, color = 0) {
        try {
            const authenticated = this.authenticatedConnections.get(session);
            if (!authenticated || authenticated.accountId !== userID || session.UserID !== userID ||
                !(await this._sessionRepo.ValidateSession(authenticated.sessionKey, userID))) {
                this.sendProto(session, userID, new proto_1.CreateRoleRspProto().setResult(LoginResult.PROTOCOL_ERROR));
                return;
            }
            const account = await this._accountRepo.FindAccountById(userID);
            if (!account || account.status !== 0 || account.roleCreated) {
                this.sendProto(session, userID, new proto_1.CreateRoleRspProto().setResult(LoginResult.PROTOCOL_ERROR));
                return;
            }
            // 1. 创建玩家记录（使用 Repository）
            // 注意：PlayerData 不走 DataSaver，而是通过 PlayerRepository 直接操作数据库
            await this._playerRepo.CreatePlayer(userID, nickname, color);
            // 2. 标记角色已创建
            await this._accountRepo.UpdateRoleCreated(userID, true);
            // 3. 生成新会话
            const ip = session.Address || '127.0.0.1';
            const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);
            utils_1.Logger.Info(`[LoginManager] 创建玩家成功: userID=${userID}, nick=${nickname}, color=${color}`);
            const proto = new proto_1.CreateRoleRspProto().setSession(sessionInfo.sessionKey);
            this.authenticatedConnections.set(session, { accountId: userID, sessionKey: sessionInfo.sessionKey });
            this.sendProto(session, userID, proto);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 创建玩家失败: ${userID}`, error);
            this.sendProto(session, userID, new proto_1.CreateRoleRspProto().setResult(1));
        }
    }
    /**
     * 玩家登出
     */
    async HandleLogout(userID) {
        try {
            await this._sessionRepo.InvalidateAllByAccountId(userID);
            utils_1.Logger.Info(`[LoginManager] 玩家登出: userID=${userID}`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[LoginManager] 登出处理失败: ${userID}`, error);
        }
    }
}
exports.LoginManager = LoginManager;
//# sourceMappingURL=LoginManager.js.map