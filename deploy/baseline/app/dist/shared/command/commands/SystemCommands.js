"use strict";
/**
 * 系统命令集合
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
exports.ExitCommand = exports.ClearCommand = void 0;
const CommandArg_1 = require("../CommandArg");
const CommandDecorators_1 = require("../CommandDecorators");
const Logger_1 = require("../../utils/Logger");
const CommandOutput_1 = require("../CommandOutput");
/**
 * Clear 命令 - 清屏
 */
let ClearCommand = class ClearCommand {
    async execute(_arg) {
        console.clear();
        Logger_1.Logger.Info('\x1b[32m赛尔号怀旧服服务端 - 控制台\x1b[0m');
    }
};
exports.ClearCommand = ClearCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ClearCommand.prototype, "execute", null);
exports.ClearCommand = ClearCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'clear',
        description: '清空控制台',
        usage: 'clear',
        alias: ['cls']
    })
], ClearCommand);
/**
 * Exit 命令 - 退出
 */
let ExitCommand = class ExitCommand {
    async execute(arg) {
        await CommandOutput_1.CommandOutput.warning(arg, '正在停止服务器...');
        // 触发退出信号
        process.emit('SIGINT');
    }
};
exports.ExitCommand = ExitCommand;
__decorate([
    (0, CommandDecorators_1.CommandDefault)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandArg_1.CommandArg]),
    __metadata("design:returntype", Promise)
], ExitCommand.prototype, "execute", null);
exports.ExitCommand = ExitCommand = __decorate([
    (0, CommandDecorators_1.CommandInfo)({
        name: 'exit',
        description: '停止服务器并退出',
        usage: 'exit',
        alias: ['stop', 'quit']
    })
], ExitCommand);
//# sourceMappingURL=SystemCommands.js.map