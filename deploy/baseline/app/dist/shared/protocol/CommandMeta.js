"use strict";
/**
 * CommandMeta - 命令元数据系统
 *
 * 此文件已重构为模块化结构，原有的大文件已拆分为：
 * - meta/CommandMetaRegistry.ts - 核心注册表类
 * - meta/login.meta.ts - 登录相关元数据
 * - meta/server.meta.ts - 服务器相关元数据
 * - meta/map.meta.ts - 地图相关元数据
 * - meta/chat.meta.ts - 聊天相关元数据
 *
 * 为了保持向后兼容，此文件重新导出所有内容
 */
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
// 重新导出所有内容
__exportStar(require("./meta"), exports);
//# sourceMappingURL=CommandMeta.js.map