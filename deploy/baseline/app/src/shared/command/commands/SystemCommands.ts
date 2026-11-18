/**
 * 系统命令集合
 */

import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
import { CommandInfo, CommandDefault } from '../CommandDecorators';
import { Logger } from '../../utils/Logger';
import { CommandOutput } from '../CommandOutput';

/**
 * Clear 命令 - 清屏
 */
@CommandInfo({
  name: 'clear',
  description: '清空控制台',
  usage: 'clear',
  alias: ['cls']
})
export class ClearCommand implements ICommand {
  @CommandDefault()
  async execute(_arg: CommandArg): Promise<void> {
    console.clear();
    Logger.Info('\x1b[32m赛尔号怀旧服服务端 - 控制台\x1b[0m');
  }
}

/**
 * Exit 命令 - 退出
 */
@CommandInfo({
  name: 'exit',
  description: '停止服务器并退出',
  usage: 'exit',
  alias: ['stop', 'quit']
})
export class ExitCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    await CommandOutput.warning(arg, '正在停止服务器...');
    // 触发退出信号
    process.emit('SIGINT' as any);
  }
}
