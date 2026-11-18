"use strict";
/**
 * 命令系统导出
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
exports.CommandDefault = exports.CommandMethod = exports.CommandInfo = exports.ConsoleCommandSender = exports.CommandArg = exports.CommandManager = void 0;
var CommandManager_1 = require("./CommandManager");
Object.defineProperty(exports, "CommandManager", { enumerable: true, get: function () { return CommandManager_1.CommandManager; } });
var CommandArg_1 = require("./CommandArg");
Object.defineProperty(exports, "CommandArg", { enumerable: true, get: function () { return CommandArg_1.CommandArg; } });
Object.defineProperty(exports, "ConsoleCommandSender", { enumerable: true, get: function () { return CommandArg_1.ConsoleCommandSender; } });
var CommandDecorators_1 = require("./CommandDecorators");
Object.defineProperty(exports, "CommandInfo", { enumerable: true, get: function () { return CommandDecorators_1.CommandInfo; } });
Object.defineProperty(exports, "CommandMethod", { enumerable: true, get: function () { return CommandDecorators_1.CommandMethod; } });
Object.defineProperty(exports, "CommandDefault", { enumerable: true, get: function () { return CommandDecorators_1.CommandDefault; } });
__exportStar(require("./commands"), exports);
//# sourceMappingURL=index.js.map