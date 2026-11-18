/**
 * Player 命令
 * 参考 DanhengServer 的命令实现风格
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
export declare class PlayerCommand implements ICommand {
    private gmService;
    constructor();
    /**
     * player list [搜索]
     */
    list(arg: CommandArg): Promise<void>;
    /**
     * player info <玩家ID>
     */
    info(arg: CommandArg): Promise<void>;
    /**
     * player kick <玩家ID> [原因]
     */
    kick(arg: CommandArg): Promise<void>;
    /**
     * player ban <玩家ID> <类型> [原因]
     */
    ban(arg: CommandArg): Promise<void>;
    default(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=PlayerCommand.d.ts.map