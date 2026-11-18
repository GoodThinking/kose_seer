"use strict";
/**
 * 服务器管理命令集合
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnounceCommand = exports.GCCommand = exports.UptimeCommand = exports.MemoryCommand = exports.ConfigCommand = exports.StatusCommand = void 0;
const CommandArg_1 = require("../CommandArg");
const CommandDecorators_1 = require("../CommandDecorators");
const GMService_1 = require("../../../GMServer/services/GMService");
const config_1 = require("../../config");
const CommandOutput_1 = require("../CommandOutput");
/**
 * Status 命令 - 服务器状态
 */
let StatusCommand = class StatusCommand {
    gmService;
    constructor() {
        this.gmService = new GMService_1.GMService();
    }
    async execute(arg) {
        try {
            const status = await this.gmService.getServerStatus();
            const hours = Math.floor(status.uptime / 3600);
            const minutes = Math.floor((status.uptime % 3600) / 60);
            await CommandOutput_1.CommandOutput.infoBox(arg, '服务器状态', {
                '运行时间': `${hours}小时 ${minutes}分钟`,
                '在线玩家': `${status.onlinePlayers} / ${status.totalPlayers}`,
                '内存使用': `${(status.memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(status.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`
            });
            if (status.mapCounts && status.mapCounts.length > 0) {
                const mapItems = status.mapCounts.slice(0, 10).map((map) => ({
                    label: `地图 ${map.mapId}`,
                    value: `${map.count} 人`
                }));
                await CommandOutput_1.CommandOutput.list(arg, mapItems, '地图分布 (前10)');
            }
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '获取服务器状态失败', error.message);
        }
    }
};
exports.StatusCommand = StatusCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], StatusCommand.prototype, "execute", null);
exports.StatusCommand = StatusCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'status',
        description: '显示服务器状态',
        usage: 'status'
    }),
    __metadata("design:paramtypes", [])
], StatusCommand);
/**
 * Config 命令 - 显示配置
 */
let ConfigCommand = class ConfigCommand {
    async execute(arg) {
        await CommandOutput_1.CommandOutput.infoBox(arg, '服务器配置', {
            '游戏服务器端口': config_1.Config.Game.port,
            'GM 服务器端口': config_1.Config.GM.port,
            '代理服务器端口': config_1.Config.Proxy.listenPort,
            '日志级别': config_1.Config.Logging.level
        });
    }
};
exports.ConfigCommand = ConfigCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ConfigCommand.prototype, "execute", null);
exports.ConfigCommand = ConfigCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'config',
        description: '显示服务器配置信息',
        usage: 'config'
    })
], ConfigCommand);
/**
 * Memory 命令 - 内存使用
 */
let MemoryCommand = class MemoryCommand {
    async execute(arg) {
        const usage = process.memoryUsage();
        await CommandOutput_1.CommandOutput.infoBox(arg, '内存使用情况', {
            'RSS': `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
            'Heap Total': `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            'Heap Used': `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            'External': `${(usage.external / 1024 / 1024).toFixed(2)} MB`
        });
    }
};
exports.MemoryCommand = MemoryCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], MemoryCommand.prototype, "execute", null);
exports.MemoryCommand = MemoryCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'memory',
        description: '显示内存使用情况',
        usage: 'memory',
        alias: ['mem']
    })
], MemoryCommand);
/**
 * Uptime 命令 - 运行时间
 */
let UptimeCommand = class UptimeCommand {
    async execute(arg) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await CommandOutput_1.CommandOutput.info(arg, `服务器运行时间: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
    }
};
exports.UptimeCommand = UptimeCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], UptimeCommand.prototype, "execute", null);
exports.UptimeCommand = UptimeCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'uptime',
        description: '显示服务器运行时间',
        usage: 'uptime'
    })
], UptimeCommand);
/**
 * GC 命令 - 垃圾回收
 */
let GCCommand = class GCCommand {
    async execute(arg) {
        if (global.gc) {
            const before = process.memoryUsage();
            global.gc();
            const after = process.memoryUsage();
            const freed = (before.heapUsed - after.heapUsed) / 1024 / 1024;
            await CommandOutput_1.CommandOutput.success(arg, `垃圾回收完成，释放内存: ${freed.toFixed(2)} MB`);
        }
        else {
            await CommandOutput_1.CommandOutput.warning(arg, '垃圾回收不可用，请使用 --expose-gc 参数启动');
        }
    }
};
exports.GCCommand = GCCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], GCCommand.prototype, "execute", null);
exports.GCCommand = GCCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'gc',
        description: '手动触发垃圾回收（需要 --expose-gc 启动）',
        usage: 'gc'
    })
], GCCommand);
/**
 * Announce 命令 - 全服公告
 */
let AnnounceCommand = class AnnounceCommand {
    gmService;
    constructor() {
        this.gmService = new GMService_1.GMService();
    }
    async execute(arg) {
        if (arg.basicArgs.length === 0) {
            await CommandOutput_1.CommandOutput.usage(arg, 'announce <消息内容>');
            return;
        }
        const message = arg.basicArgs.join(' ');
        try {
            await this.gmService.sendAnnouncement(message, 'system');
            await CommandOutput_1.CommandOutput.success(arg, `已发送公告: ${message}`);
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '发送公告失败', error.message);
        }
    }
};
exports.AnnounceCommand = AnnounceCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], AnnounceCommand.prototype, "execute", null);
exports.AnnounceCommand = AnnounceCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'announce',
        description: '发送全服公告',
        usage: 'announce <消息内容>',
        alias: ['ann'],
        permission: 'admin'
    }),
    __metadata("design:paramtypes", [])
], AnnounceCommand);
//# sourceMappingURL=ServerCommands.js.map