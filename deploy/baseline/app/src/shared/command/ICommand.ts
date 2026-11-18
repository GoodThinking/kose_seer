/**
 * 命令接口
 * 参考 DanhengServer 的 ICommand
 */

import { CommandArg } from './CommandArg';

export interface ICommand {
  // 命令类可以有多个方法，通过装饰器标记
  [key: string]: any;
}
