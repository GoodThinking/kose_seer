/**
 * Help 命令
 * 参考 DanhengServer 的 CommandHelp
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
export declare class HelpCommand implements ICommand {
    execute(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=HelpCommand.d.ts.map