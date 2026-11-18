"use strict";
/**
 * Reload 命令 - 重新加载配置
 * 参考 DanhengServer 的 CommandReload
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReloadCommand = void 0;
const CommandArg_1 = require("../CommandArg");
const CommandDecorators_1 = require("../CommandDecorators");
const ConfigRegistry_1 = require("../../config/ConfigRegistry");
const CommandOutput_1 = require("../CommandOutput");
let ReloadCommand = class ReloadCommand {
    /**
     * reload all - 重载所有配置
     */
    async reloadAll(arg) {
        await CommandOutput_1.CommandOutput.progress(arg, '正在重新加载所有配置...');
        try {
            await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
            await CommandOutput_1.CommandOutput.success(arg, '所有配置重新加载成功');
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '配置重新加载失败', String(error));
        }
    }
    /**
     * reload skill - 重载技能配置
     */
    async reloadSkill(arg) {
        await CommandOutput_1.CommandOutput.progress(arg, '正在重新加载技能配置...');
        try {
            // TODO: 实现单独重载技能配置
            await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
            await CommandOutput_1.CommandOutput.success(arg, '技能配置重新加载成功');
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '技能配置重新加载失败', String(error));
        }
    }
    /**
     * reload effect - 重载效果配置
     */
    async reloadEffect(arg) {
        await CommandOutput_1.CommandOutput.progress(arg, '正在重新加载效果配置...');
        try {
            // TODO: 实现单独重载效果配置
            await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
            await CommandOutput_1.CommandOutput.success(arg, '效果配置重新加载成功');
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '效果配置重新加载失败', String(error));
        }
    }
    /**
     * reload boss - 重载Boss配置
     */
    async reloadBoss(arg) {
        await CommandOutput_1.CommandOutput.progress(arg, '正在重新加载Boss配置...');
        try {
            // TODO: 实现单独重载Boss配置
            await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
            await CommandOutput_1.CommandOutput.success(arg, 'Boss配置重新加载成功');
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, 'Boss配置重新加载失败', String(error));
        }
    }
    /**
     * reload shiny - 重载异色配置
     */
    async reloadShiny(arg) {
        await CommandOutput_1.CommandOutput.progress(arg, '正在重新加载异色配置...');
        try {
            const { ShinyConfigManager } = await Promise.resolve().then(() => __importStar(require('../../../GameServer/Game/Shiny/ShinyConfigManager')));
            await ShinyConfigManager.Instance.Reload();
            const stats = ShinyConfigManager.Instance.GetStats();
            await CommandOutput_1.CommandOutput.success(arg, `异色配置重新加载成功 (共 ${stats.total} 个配置, version=${stats.version})`);
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '异色配置重新加载失败', String(error));
        }
    }
    async default(arg) {
        // 如果有参数但不匹配任何子命令，提示无效
        if (arg.basicArgs.length > 0) {
            const subCmd = arg.basicArgs[0];
            await CommandOutput_1.CommandOutput.error(arg, `无效的子命令: ${subCmd}`);
            await CommandOutput_1.CommandOutput.availableSubcommands(arg, ['all', 'skill', 'effect', 'boss', 'shiny']);
            return;
        }
        // 默认重载所有配置
        await this.reloadAll(arg);
    }
};
exports.ReloadCommand = ReloadCommand;
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "reloadAll", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 skill'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "reloadSkill", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 effect'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "reloadEffect", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 boss'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "reloadBoss", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 shiny'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "reloadShiny", null);
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ReloadCommand.prototype, "default", null);
exports.ReloadCommand = ReloadCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'reload',
        description: '重新加载游戏配置',
        usage: 'reload [all|skill|effect|boss]',
        permission: 'admin'
    })
], ReloadCommand);
//# sourceMappingURL=ReloadCommand.js.map