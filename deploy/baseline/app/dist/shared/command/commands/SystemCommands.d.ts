/**
 * 系统命令集合
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
/**
 * Clear 命令 - 清屏
 */
export declare class ClearCommand implements ICommand {
    execute(_arg: CommandArg): Promise<void>;
}
/**
 * Exit 命令 - 退出
 */
export declare class ExitCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=SystemCommands.d.ts.map