/**
 * Help 命令
 * 参考 DanhengServer 的 CommandHelp
 */

import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
import { CommandInfo, CommandDefault } from '../CommandDecorators';
import { CommandManager } from '../CommandManager';

@CommandInfo({
  name: 'help',
  description: '显示所有可用命令',
  usage: 'help [命令名]',
  alias: ['h', '?']
})
export class HelpCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    const commandManager = CommandManager.getInstance();
    const commands = commandManager.getCommandInfo();

    // 检查是否查询特定命令
    if (arg.basicArgs.length >= 1) {
      // 显示特定命令的帮助
      const cmdName = arg.basicArgs[0];
      const info = commands.get(cmdName);
      
      if (!info) {
        await arg.sendMsg(`\x1b[31m✗ 命令不存在: ${cmdName}\x1b[0m`);
        return;
      }

      await arg.sendMsg('');
      await arg.sendMsg('\x1b[1m\x1b[36m╔════════════════════════════════════════════════════════════╗\x1b[0m');
      await arg.sendMsg(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m\x1b[33m${info.name}\x1b[0m - ${info.description.padEnd(42)} \x1b[1m\x1b[36m║\x1b[0m`);
      await arg.sendMsg('\x1b[1m\x1b[36m╠════════════════════════════════════════════════════════════╣\x1b[0m');
      await arg.sendMsg(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m用法:\x1b[0m ${info.usage.padEnd(48)} \x1b[1m\x1b[36m║\x1b[0m`);
      
      if (info.alias && info.alias.length > 0) {
        const aliasStr = info.alias.join(', ');
        await arg.sendMsg(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m别名:\x1b[0m ${aliasStr.padEnd(48)} \x1b[1m\x1b[36m║\x1b[0m`);
      }
      
      if (info.permission) {
        await arg.sendMsg(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m权限:\x1b[0m ${info.permission.padEnd(48)} \x1b[1m\x1b[36m║\x1b[0m`);
      }
      
      await arg.sendMsg('\x1b[1m\x1b[36m╚════════════════════════════════════════════════════════════╝\x1b[0m');
      await arg.sendMsg('');
      return;
    }

    // 显示所有命令
    await arg.sendMsg('');
    await arg.sendMsg('\x1b[1m\x1b[36m╔════════════════════════════════════════════════════════════╗\x1b[0m');
    await arg.sendMsg('\x1b[1m\x1b[36m║\x1b[0m              \x1b[1m\x1b[33m可用命令列表\x1b[0m                          \x1b[1m\x1b[36m║\x1b[0m');
    await arg.sendMsg('\x1b[1m\x1b[36m╚════════════════════════════════════════════════════════════╝\x1b[0m');

    // 按类别分组
    const categories: Record<string, Array<[string, any]>> = {
      '系统命令': [],
      '服务器管理': [],
      '玩家管理': [],
      '物品管理': [],
      '其他': []
    };

    for (const [name, info] of commands.entries()) {
      if (['help', 'clear', 'exit', 'stop', 'quit'].includes(name)) {
        categories['系统命令'].push([name, info]);
      } else if (['status', 'config', 'reload', 'memory', 'uptime', 'gc'].includes(name)) {
        categories['服务器管理'].push([name, info]);
      } else if (name.startsWith('player')) {
        categories['玩家管理'].push([name, info]);
      } else if (name.startsWith('item') || name.startsWith('pet') || name === 'give') {
        categories['物品管理'].push([name, info]);
      } else {
        categories['其他'].push([name, info]);
      }
    }

    for (const [category, cmds] of Object.entries(categories)) {
      if (cmds.length === 0) continue;

      await arg.sendMsg('');
      await arg.sendMsg(`  \x1b[1m\x1b[33m▶ ${category}\x1b[0m`);
      await arg.sendMsg('  \x1b[2m' + '─'.repeat(58) + '\x1b[0m');
      
      for (const [name, info] of cmds.sort((a, b) => a[0].localeCompare(b[0]))) {
        const nameStr = `\x1b[32m${name}\x1b[0m`.padEnd(20 + 9); // +9 for color codes
        await arg.sendMsg(`    ${nameStr} ${info.description}`);
      }
    }

    await arg.sendMsg('');
    await arg.sendMsg('  \x1b[2m💡 提示: 输入 "help <命令名>" 查看详细帮助\x1b[0m');
    await arg.sendMsg('');
  }
}
