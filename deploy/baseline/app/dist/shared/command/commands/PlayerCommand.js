"use strict";
/**
 * Player 命令
 * 参考 DanhengServer 的命令实现风格
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
exports.PlayerCommand = void 0;
const CommandArg_1 = require("../CommandArg");
const CommandDecorators_1 = require("../CommandDecorators");
const GMService_1 = require("../../../GMServer/services/GMService");
const CommandOutput_1 = require("../CommandOutput");
let PlayerCommand = class PlayerCommand {
    gmService;
    constructor() {
        this.gmService = new GMService_1.GMService();
    }
    /**
     * player list [搜索]
     */
    async list(arg) {
        const search = arg.getString(1);
        const result = await this.gmService.getPlayers(1, 20, search, true);
        if (result.players.length === 0) {
            await CommandOutput_1.CommandOutput.warning(arg, '暂无在线玩家');
            return;
        }
        const rows = result.players.map((player) => [
            player.userID,
            player.nick,
            player.coins,
            player.mapID || '未知'
        ]);
        await CommandOutput_1.CommandOutput.table(arg, ['ID', '昵称', '金币', '地图'], rows, `在线玩家列表 (共 ${result.total} 人)`);
    }
    /**
     * player info <玩家ID>
     */
    async info(arg) {
        if (arg.basicArgs.length < 2) {
            await CommandOutput_1.CommandOutput.usage(arg, 'player info <玩家ID>');
            return;
        }
        const uid = arg.getInt(1);
        if (uid === 0) {
            await CommandOutput_1.CommandOutput.error(arg, '无效的玩家ID');
            return;
        }
        try {
            const player = await this.gmService.getPlayerDetail(uid);
            await CommandOutput_1.CommandOutput.groupedList(arg, {
                [`玩家信息 - ${player.nickname}`]: [
                    { label: 'ID', value: player.uid },
                    { label: '金币', value: player.coins },
                    { label: '能量', value: player.energy },
                    { label: '战斗徽章', value: player.fightBadge },
                    { label: '可分配经验', value: player.allocatableExp }
                ],
                '账户信息': [
                    { label: 'VIP等级', value: player.vipLevel },
                    { label: '精灵数量', value: player.petCount },
                    { label: '物品数量', value: player.itemCount },
                    { label: '任务数量', value: player.taskCount }
                ],
                '统计信息': [
                    { label: '注册时间', value: new Date(player.registerTime).toLocaleString() },
                    { label: '登录次数', value: player.loginCount }
                ]
            });
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '获取玩家信息失败', error.message);
        }
    }
    /**
     * player kick <玩家ID> [原因]
     */
    async kick(arg) {
        if (arg.basicArgs.length < 2) {
            await CommandOutput_1.CommandOutput.usage(arg, 'player kick <玩家ID> [原因]');
            return;
        }
        const uid = arg.getInt(1);
        if (uid === 0) {
            await CommandOutput_1.CommandOutput.error(arg, '无效的玩家ID');
            return;
        }
        const reason = arg.basicArgs.slice(2).join(' ') || 'GM 操作';
        try {
            await this.gmService.kickPlayer(uid, reason);
            await CommandOutput_1.CommandOutput.success(arg, `已踢出玩家 ${uid}`, `原因: ${reason}`);
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '踢出玩家失败', error.message);
        }
    }
    /**
     * player ban <玩家ID> <类型> [原因]
     */
    async ban(arg) {
        if (arg.basicArgs.length < 3) {
            await CommandOutput_1.CommandOutput.usage(arg, 'player ban <玩家ID> <类型> [原因]', [
                '类型: 0=解封, 1=24小时, 2=7天, 3=14天, 4=永久'
            ]);
            return;
        }
        const uid = arg.getInt(1);
        const banType = arg.getInt(2);
        if (uid === 0) {
            await CommandOutput_1.CommandOutput.error(arg, '无效的玩家ID');
            return;
        }
        if (banType < 0 || banType > 4) {
            await CommandOutput_1.CommandOutput.error(arg, '封禁类型必须在 0-4 之间');
            return;
        }
        const reason = arg.basicArgs.slice(3).join(' ') || 'GM 操作';
        try {
            await this.gmService.banPlayer(uid, banType, reason);
            const banTypeNames = ['解封', '24小时封停', '7天封停', '14天封停', '永久封停'];
            await CommandOutput_1.CommandOutput.success(arg, `已${banTypeNames[banType]}玩家 ${uid}`, `原因: ${reason}`);
        }
        catch (error) {
            await CommandOutput_1.CommandOutput.error(arg, '封禁操作失败', error.message);
        }
    }
    async default(arg) {
        // 如果有参数但不匹配任何子命令，提示无效
        if (arg.basicArgs.length > 0) {
            const subCmd = arg.basicArgs[0];
            await CommandOutput_1.CommandOutput.error(arg, `无效的子命令: ${subCmd}`);
            await CommandOutput_1.CommandOutput.availableSubcommands(arg, ['list', 'info', 'kick', 'ban']);
            return;
        }
        await CommandOutput_1.CommandOutput.usage(arg, 'player <list|info|kick|ban> [参数...]');
        await arg.sendMsg('\x1b[2m💡 输入 "help player" 查看详细帮助\x1b[0m');
    }
};
exports.PlayerCommand = PlayerCommand;
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], PlayerCommand.prototype, "list", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], PlayerCommand.prototype, "info", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 kick'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], PlayerCommand.prototype, "kick", null);
__decorate([
    (0, CommandDecorators_1.CommandMethod)('0 ban'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], PlayerCommand.prototype, "ban", null);
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], PlayerCommand.prototype, "default", null);
exports.PlayerCommand = PlayerCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'player',
        description: '玩家管理命令',
        usage: 'player <list|info|kick|ban> [参数...]',
        alias: ['p']
    }),
    __metadata("design:paramtypes", [])
], PlayerCommand);
//# sourceMappingURL=PlayerCommand.js.map