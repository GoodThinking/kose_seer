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
/**
 * 仓库模块导出
 *
 * 架构说明：（DatabaseHelper + Data Models）
 * - Repository 仅保留登录/注册相关功能（Player/Account/Session/EmailCode）
 * - 游戏数据（Item/Pet/Task/Friend/Mail）使用 Data 类 + DatabaseHelper
 */
__exportStar(require("./BaseRepository"), exports);
__exportStar(require("./Player"), exports);
//# sourceMappingURL=index.js.map