/**
 * 命令管理器
 * 参考 DanhengServer 的 CommandManager
 */

import * as readline from 'readline';
import { Logger } from '../utils';
import { ICommand } from './ICommand';
import { CommandArg, ConsoleCommandSender, ICommandSender } from './CommandArg';
import { getCommandInfo, getCommandMethods, CommandInfo as CommandInfoType } from './CommandDecorators';

export class CommandManager {
  private static instance: CommandManager;
  private rl: readline.Interface;
  private commands: Map<string, ICommand> = new Map();
  private commandInfo: Map<string, CommandInfoType> = new Map();
  private commandAlias: Map<string, string> = new Map();
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private isRunning: boolean = false;
  private readonly MAX_HISTORY = 100;

  private constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[36mkose_console>\x1b[0m ',
      terminal: true
    });

    this.setupLoggerIntegration();
  }

  public static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  /**
   * 设置日志系统集成
   * 确保日志在命令提示符上方显示，命令提示符始终在底部
   */
  private setupLoggerIntegration(): void {
    Logger.SetConsoleInterface({
      clearLine: () => {
        if (this.isRunning && process.stdout.isTTY) {
          // 清除当前行（命令提示符）
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }
      },
      restoreLine: () => {
        if (this.isRunning && process.stdout.isTTY) {
          // 重新显示命令提示符
          this.rl.prompt(true);
        }
      }
    });
  }

  /**
   * 注册命令
   */
  public registerCommand(commandClass: new () => ICommand): void {
    const info = getCommandInfo(commandClass);
    if (!info) {
      Logger.Warn(`[CommandManager] 命令类 ${commandClass.name} 没有 @CommandInfo 装饰器`);
      return;
    }

    const instance = new commandClass();
    this.commands.set(info.name, instance);
    this.commandInfo.set(info.name, info);

    // 注册别名
    if (info.alias) {
      for (const alias of info.alias) {
        this.commandAlias.set(alias, info.name);
      }
    }

    Logger.Debug(`[CommandManager] 注册命令: ${info.name}${info.alias ? ` (别名: ${info.alias.join(', ')})` : ''}`);
  }

  /**
   * 批量注册命令
   */
  public registerCommands(commandClasses: Array<new () => ICommand>): void {
    for (const commandClass of commandClasses) {
      this.registerCommand(commandClass);
    }
    Logger.Info(`[CommandManager] 已注册 ${this.commands.size} 个命令`);
  }

  /**
   * 启动命令管理器
   * 命令提示符始终在底部，日志在上方滚动
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // 延迟显示欢迎信息，确保在所有服务启动日志之后
    setTimeout(() => {
      console.log('');
      console.log('\x1b[1m\x1b\x1b[0m  \x1b[2m 输入 "help" 查看可用命令\x1b\x1b[0m');
      console.log('');
      this.rl.prompt();
    }, 100);

    this.rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        this.rl.prompt();
        return;
      }

      // 添加到历史
      if (this.commandHistory.length >= this.MAX_HISTORY) {
        this.commandHistory.shift();
      }
      if (this.commandHistory.length === 0 || this.commandHistory[this.commandHistory.length - 1] !== input) {
        this.commandHistory.push(input);
      }
      this.historyIndex = this.commandHistory.length;

      // 处理命令
      await this.handleCommand(input, new ConsoleCommandSender());

      if (this.isRunning) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      if (this.isRunning) {
        this.stop();
      }
    });

    // 处理 Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log('\n\x1b[33m⚠ 按 Ctrl+C 再次或输入 "exit" 退出\x1b[0m');
      this.rl.prompt();
    });
  }

  /**
   * 处理命令
   */
  public async handleCommand(input: string, sender: ICommandSender): Promise<void> {
    try {
      // 移除开头的 /
      if (input.startsWith('/')) {
        input = input.substring(1);
      }

      const parts = input.split(/\s+/);
      let cmd = parts[0];

      // 检查别名
      if (this.commandAlias.has(cmd)) {
        cmd = this.commandAlias.get(cmd)!;
      }

      // 查找命令
      const command = this.commands.get(cmd);
      if (!command) {
        await sender.sendMsg(`\x1b[31m未知命令: ${cmd}\x1b[0m`);
        await sender.sendMsg('输入 "help" 查看可用命令');
        return;
      }

      const info = this.commandInfo.get(cmd)!;

      // 检查权限
      if (info.permission && !sender.hasPermission(info.permission)) {
        await sender.sendMsg('\x1b[31m权限不足\x1b[0m');
        return;
      }

      // 构建参数
      const argString = parts.slice(1).join(' ');
      const arg = new CommandArg(argString, sender);

      // 查找匹配的方法
      const methods = getCommandMethods(command.constructor);
      if (!methods) {
        await sender.sendMsg('\x1b[31m命令实现错误：没有找到命令方法\x1b[0m');
        return;
      }

      let executed = false;

      // 尝试匹配条件方法
      for (const [methodName, methodInfo] of methods.entries()) {
        if (methodInfo.isDefault) continue;

        if (methodInfo.conditions) {
          let allMatch = true;
          for (const condition of methodInfo.conditions) {
            if (arg.basicArgs.length <= condition.index) {
              allMatch = false;
              break;
            }
            if (arg.basicArgs[condition.index] !== condition.shouldBe) {
              allMatch = false;
              break;
            }
          }

          if (allMatch) {
            await (command as any)[methodName](arg);
            executed = true;
            break;
          }
        }
      }

      // 如果没有匹配的条件方法，尝试默认方法
      if (!executed) {
        for (const [methodName, methodInfo] of methods.entries()) {
          if (methodInfo.isDefault) {
            await (command as any)[methodName](arg);
            executed = true;
            break;
          }
        }
      }

      if (!executed) {
        await sender.sendMsg(`\x1b[33m用法: ${info.usage}\x1b[0m`);
      }
    } catch (error) {
      await sender.sendMsg(`\x1b[31m执行命令失败: ${error}\x1b[0m`);
      Logger.Error('[CommandManager] 执行命令失败', error as Error);
    }
  }

  /**
   * 获取所有命令信息
   */
  public getCommandInfo(): Map<string, CommandInfoType> {
    return this.commandInfo;
  }

  /**
   * 停止命令管理器
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    this.rl.removeAllListeners();
    this.rl.close();
    Logger.SetConsoleInterface(null);

    if (process.stdin.isTTY) {
      process.stdin.pause();
      process.stdin.unref();
    }
  }

  /**
   * 获取运行状态
   */
  public get running(): boolean {
    return this.isRunning;
  }
}
