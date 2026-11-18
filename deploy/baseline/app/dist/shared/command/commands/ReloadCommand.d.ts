/**
 * Reload 命令 - 重新加载配置
 * 参考 DanhengServer 的 CommandReload
 */
import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
export declare class ReloadCommand implements ICommand {
    /**
     * reload all - 重载所有配置
     */
    reloadAll(arg: CommandArg): Promise<void>;
    /**
     * reload skill - 重载技能配置
     */
    reloadSkill(arg: CommandArg): Promise<void>;
    /**
     * reload effect - 重载效果配置
     */
    reloadEffect(arg: CommandArg): Promise<void>;
    /**
     * reload boss - 重载Boss配置
     */
    reloadBoss(arg: CommandArg): Promise<void>;
    /**
     * reload shiny - 重载异色配置
     */
    reloadShiny(arg: CommandArg): Promise<void>;
    default(arg: CommandArg): Promise<void>;
}
//# sourceMappingURL=ReloadCommand.d.ts.map