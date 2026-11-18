/**
 * 命令管理器
 * 参考 DanhengServer 的 CommandManager
 */
import { ICommand } from './ICommand';
import { ICommandSender } from './CommandArg';
import { CommandInfo as CommandInfoType } from './CommandDecorators';
export declare class CommandManager {
    private static instance;
    private rl;
    private commands;
    private commandInfo;
    private commandAlias;
    private commandHistory;
    private historyIndex;
    private isRunning;
    private readonly MAX_HISTORY;
    private constructor();
    static getInstance(): CommandManager;
    /**
     * 设置日志系统集成
     * 确保日志在命令提示符上方显示，命令提示符始终在底部
     */
    private setupLoggerIntegration;
    /**
     * 注册命令
     */
    registerCommand(commandClass: new () => ICommand): void;
    /**
     * 批量注册命令
     */
    registerCommands(commandClasses: Array<new () => ICommand>): void;
    /**
     * 启动命令管理器
     * 命令提示符始终在底部，日志在上方滚动
     */
    start(): void;
    /**
     * 处理命令
     */
    handleCommand(input: string, sender: ICommandSender): Promise<void>;
    /**
     * 获取所有命令信息
     */
    getCommandInfo(): Map<string, CommandInfoType>;
    /**
     * 停止命令管理器
     */
    stop(): void;
    /**
     * 获取运行状态
     */
    get running(): boolean;
}
//# sourceMappingURL=CommandManager.d.ts.map