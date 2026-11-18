/**
 * Give 命令 - 发送物品/精灵
 * 参考 DanhengServer 的 CommandGive
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
export declare class GiveCommand implements ICommand {
    private gmService;
    constructor();
    /**
     * give item <玩家ID> <物品ID> [x数量] [e过期时间]
     * 示例: give item 10001 300001 x10 e604800
     */
    giveItem(arg: CommandArg): Promise<void>;
    /**
     * give pet <玩家ID> <精灵ID> [l等级] [s闪光:0/1]
     * 示例: give pet 10001 2001 l100 s1
     */
    givePet(arg: CommandArg): Promise<void>;
    /**
     * give coins <玩家ID> <金额>
     */
    giveCoins(arg: CommandArg): Promise<void>;
    default(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=GiveCommand.d.ts.map