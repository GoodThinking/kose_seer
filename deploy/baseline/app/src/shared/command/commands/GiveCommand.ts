/**
 * Give 命令 - 发送物品/精灵
 * 参考 DanhengServer 的 CommandGive
 */

import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
import { CommandInfo, CommandMethod, CommandDefault } from '../CommandDecorators';
import { GMService } from '../../../GMServer/services/GMService';
import { CommandOutput } from '../CommandOutput';

@CommandInfo({
  name: 'give',
  description: '发送物品或精灵给玩家',
  usage: 'give <item|pet> <玩家ID> <ID> [参数...]',
  alias: ['g']
})
export class GiveCommand implements ICommand {
  private gmService: GMService;

  constructor() {
    this.gmService = new GMService();
  }

  /**
   * give item <玩家ID> <物品ID> [x数量] [e过期时间]
   * 示例: give item 10001 300001 x10 e604800
   */
  @CommandMethod('0 item')
  async giveItem(arg: CommandArg): Promise<void> {
    if (arg.basicArgs.length < 3) {
      await CommandOutput.usage(arg, 'give item <玩家ID> <物品ID> [x数量] [e过期时间]', [
        'give item 10001 300001 x10 e604800  # 发送10个物品，7天后过期'
      ]);
      return;
    }

    const uid = arg.getInt(1);
    const itemId = arg.getInt(2);
    const count = arg.getCharArgInt('x', 1);
    const expireTime = arg.getCharArgInt('e', 0);

    if (uid === 0 || itemId === 0) {
      await CommandOutput.error(arg, '无效的参数');
      return;
    }

    try {
      await this.gmService.giveItem(uid, itemId, count, expireTime);
      await CommandOutput.success(arg, '已发送物品', 
        `玩家: ${uid} | 物品: ${itemId} | 数量: ${count}${expireTime > 0 ? ` | 过期: ${expireTime}秒` : ''}`);
    } catch (error) {
      await CommandOutput.error(arg, '发送物品失败', (error as Error).message);
    }
  }

  /**
   * give pet <玩家ID> <精灵ID> [l等级] [s闪光:0/1]
   * 示例: give pet 10001 2001 l100 s1
   */
  @CommandMethod('0 pet')
  async givePet(arg: CommandArg): Promise<void> {
    if (arg.basicArgs.length < 3) {
      await CommandOutput.usage(arg, 'give pet <玩家ID> <精灵ID> [l等级] [s闪光:0/1]', [
        'give pet 10001 2001 l100 s1  # 发送100级闪光精灵'
      ]);
      return;
    }

    const uid = arg.getInt(1);
    const petId = arg.getInt(2);
    const level = arg.getCharArgInt('l', 1);
    const shiny = arg.getCharArgInt('s', 0) === 1;

    if (uid === 0 || petId === 0) {
      await CommandOutput.error(arg, '无效的参数');
      return;
    }

    try {
      await this.gmService.givePet(uid, petId, level, shiny);
      await CommandOutput.success(arg, '已发送精灵',
        `玩家: ${uid} | 精灵: ${petId} | 等级: ${level}${shiny ? ' | ✨闪光' : ''}`);
    } catch (error) {
      await CommandOutput.error(arg, '发送精灵失败', (error as Error).message);
    }
  }

  /**
   * give coins <玩家ID> <金额>
   */
  @CommandMethod('0 coins')
  async giveCoins(arg: CommandArg): Promise<void> {
    if (arg.basicArgs.length < 3) {
      await CommandOutput.usage(arg, 'give coins <玩家ID> <金额>');
      return;
    }

    const uid = arg.getInt(1);
    const amount = arg.getInt(2);

    if (uid === 0) {
      await CommandOutput.error(arg, '无效的玩家ID');
      return;
    }

    try {
      await this.gmService.modifyCoins(uid, amount);
      await CommandOutput.success(arg, '已修改金币',
        `玩家: ${uid} | 变化: ${amount > 0 ? '+' : ''}${amount}`);
    } catch (error) {
      await CommandOutput.error(arg, '修改金币失败', (error as Error).message);
    }
  }

  @CommandDefault()
  async default(arg: CommandArg): Promise<void> {
    // 如果有参数但不匹配任何子命令，提示无效
    if (arg.basicArgs.length > 0) {
      const subCmd = arg.basicArgs[0];
      await CommandOutput.error(arg, `无效的子命令: ${subCmd}`);
      await CommandOutput.availableSubcommands(arg, ['item', 'pet', 'coins']);
      return;
    }
    
    await CommandOutput.usage(arg, 'give <item|pet|coins> <玩家ID> <ID> [参数...]', [
      'give item 10001 300001 x10 e604800  # 发送10个物品，7天后过期',
      'give pet 10001 2001 l100 s1         # 发送100级闪光精灵',
      'give coins 10001 10000              # 增加10000金币'
    ]);
    await arg.sendMsg('\n\x1b[2m💡 输入 "help give" 查看详细帮助\x1b[0m');
  }
}
