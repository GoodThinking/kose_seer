"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShinyConfigHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ShinyConfigReqProto_1 = require("../../../../../shared/proto/packets/req/config/ShinyConfigReqProto");
const ShinyConfigRspProto_1 = require("../../../../../shared/proto/packets/rsp/config/ShinyConfigRspProto");
const ShinyConfigManager_1 = require("../../../../Game/Shiny/ShinyConfigManager");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 异色配置请求处理器
 * CMD 109001
 */
let ShinyConfigHandler = class ShinyConfigHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = new ShinyConfigReqProto_1.ShinyConfigReqProto();
            req.deserialize(body);
            Logger_1.Logger.Debug(`[ShinyConfigHandler] 客户端请求异色配置: uid=${player.Uid}`);
            // 获取服务端配置版本和数据
            const serverVersion = ShinyConfigManager_1.ShinyConfigManager.Instance.GetVersion();
            const configs = ShinyConfigManager_1.ShinyConfigManager.Instance.GetAllConfigs();
            // 构造响应
            const rsp = new ShinyConfigRspProto_1.ShinyConfigRspProto();
            rsp.version = serverVersion;
            rsp.configs = configs;
            // 添加当前地图的野怪异色信息
            const mapId = player.Data.mapID || 1;
            const ogres = player.MapSpawnManager.GetMapOgres(mapId);
            Logger_1.Logger.Debug(`[ShinyConfigHandler] 地图 ${mapId} 野怪列表:`);
            for (let i = 0; i < ogres.length; i++) {
                if (ogres[i].petId > 0) {
                    Logger_1.Logger.Debug(`[ShinyConfigHandler]   槽位 ${i}: petId=${ogres[i].petId}, ` +
                        `shiny=${ogres[i].shiny}, originalPetId=${ogres[i].originalPetId}`);
                }
            }
            for (let i = 0; i < ogres.length; i++) {
                if (ogres[i].shiny > 0) {
                    rsp.mapOgres.push({
                        index: i,
                        shinyId: ogres[i].shiny
                    });
                    Logger_1.Logger.Debug(`[ShinyConfigHandler] 添加异色野怪: 槽位=${i}, shinyId=${ogres[i].shiny}`);
                }
            }
            Logger_1.Logger.Debug(`[ShinyConfigHandler] 发送异色配置: version=${serverVersion}, ` +
                `configs=${configs.length}, mapOgres=${rsp.mapOgres.length}`);
            // 发送响应
            await player.SendPacket(rsp);
        }
        catch (error) {
            Logger_1.Logger.Error(`[ShinyConfigHandler] 处理异色配置请求失败: uid=${player.Uid}`, error);
        }
    }
};
exports.ShinyConfigHandler = ShinyConfigHandler;
exports.ShinyConfigHandler = ShinyConfigHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.SHINY_CONFIG_GET, decorators_1.InjectType.NONE)
], ShinyConfigHandler);
//# sourceMappingURL=ShinyConfigHandler.js.map