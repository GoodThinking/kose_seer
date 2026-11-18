/**
 * 服务器管理命令集合
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
/**
 * Status 命令 - 服务器状态
 */
export declare class StatusCommand implements ICommand {
    private gmService;
    constructor();
    execute(arg: CommandArg): Promise<void>;
}
/**
 * Config 命令 - 显示配置
 */
export declare class ConfigCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
/**
 * Memory 命令 - 内存使用
 */
export declare class MemoryCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
/**
 * Uptime 命令 - 运行时间
 */
export declare class UptimeCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
/**
 * GC 命令 - 垃圾回收
 */
export declare class GCCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
/**
 * Announce 命令 - 全服公告
 */
export declare class AnnounceCommand implements ICommand {
    private gmService;
    constructor();
    execute(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=ServerCommands.d.ts.map