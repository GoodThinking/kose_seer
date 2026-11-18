"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmdMeta = void 0;
const CommandMetaRegistry_1 = require("./CommandMetaRegistry");
const login_meta_1 = require("./login.meta");
const server_meta_1 = require("./server.meta");
const chat_meta_1 = require("./chat.meta");
const map_meta_1 = require("./map.meta");
const pet_meta_1 = require("./pet.meta");
const system_meta_1 = require("./system.meta");
const item_meta_1 = require("./item.meta");
const social_meta_1 = require("./social.meta");
const nono_meta_1 = require("./nono.meta");
const battle_meta_1 = require("./battle.meta");
// 导出类型和接口
__exportStar(require("./CommandMetaRegistry"), exports);
// 创建全局注册表实例
exports.CmdMeta = new CommandMetaRegistry_1.CommandMetaRegistry();
// 注册所有元数据
exports.CmdMeta.RegisterBatch(login_meta_1.LoginMetadata);
exports.CmdMeta.RegisterBatch(server_meta_1.ServerMetadata);
exports.CmdMeta.RegisterBatch(chat_meta_1.ChatMetadata);
exports.CmdMeta.RegisterBatch(map_meta_1.mapMeta);
exports.CmdMeta.RegisterBatch(pet_meta_1.petMeta);
exports.CmdMeta.RegisterBatch(system_meta_1.SystemModuleMetadata);
exports.CmdMeta.RegisterBatch(item_meta_1.ItemModuleMetadata);
exports.CmdMeta.RegisterBatch(social_meta_1.SocialMetadata);
exports.CmdMeta.RegisterBatch(nono_meta_1.NoNoModuleMetadata);
exports.CmdMeta.RegisterBatch(battle_meta_1.battleMeta);
//# sourceMappingURL=index.js.map