"use strict";
// 导入所有Handler以触发装饰器注册
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
// 登录相关Handler
__exportStar(require("./Login"), exports);
// 地图相关Handler
__exportStar(require("./Map"), exports);
// 精灵相关Handler
__exportStar(require("./Pet"), exports);
// 战斗相关Handler
__exportStar(require("./Battle"), exports);
// 物品相关Handler
__exportStar(require("./Item"), exports);
// 系统相关Handler
__exportStar(require("./System"), exports);
// NoNo相关Handler
__exportStar(require("./NoNo"), exports);
// 任务相关Handler
__exportStar(require("./Task"), exports);
// 邮件相关Handler
__exportStar(require("./Mail"), exports);
// 魂珠相关Handler
__exportStar(require("./SoulBead"), exports);
// 好友相关Handler
__exportStar(require("./Friend"), exports);
// 兑换相关Handler
__exportStar(require("./Exchange"), exports);
// 用户相关Handler
__exportStar(require("./User"), exports);
// 配置相关Handler
__exportStar(require("./Config"), exports);
// 房间/家具相关Handler
__exportStar(require("./Room"), exports);
//# sourceMappingURL=index.js.map