/**
 * 服务器管理命令集合
 */

import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
import { CommandInfo, CommandDefault } from '../CommandDecorators';
import { GMService } from '../../../GMServer/services/GMService';
import { Config } from '../../config';
import { CommandOutput } from '../CommandOutput';

/**
 * Status 命令 - 服务器状态
 */
@CommandInfo({
  name: 'status',
  description: '显示服务器状态',
  usage: 'status'
})
export class StatusCommand implements ICommand {
  private gmService: GMService;

  constructor() {
    this.gmService = new GMService();
  }

  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    try {
      const status = await this.gmService.getServerStatus();
      
      const hours = Math.floor(status.uptime / 3600);
      const minutes = Math.floor((status.uptime % 3600) / 60);
      
      await CommandOutput.infoBox(arg, '服务器状态', {
        '运行时间': `${hours}小时 ${minutes}分钟`,
        '在线玩家': `${status.onlinePlayers} / ${status.totalPlayers}`,
        '内存使用': `${(status.memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(status.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`
      });
      
      if (status.mapCounts && status.mapCounts.length > 0) {
        const mapItems = status.mapCounts.slice(0, 10).map((map: any) => ({
          label: `地图 ${map.mapId}`,
          value: `${map.count} 人`
        }));
        await CommandOutput.list(arg, mapItems, '地图分布 (前10)');
      }
    } catch (error) {
      await CommandOutput.error(arg, '获取服务器状态失败', (error as Error).message);
    }
  }
}

/**
 * Config 命令 - 显示配置
 */
@CommandInfo({
  name: 'config',
  description: '显示服务器配置信息',
  usage: 'config'
})
export class ConfigCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    await CommandOutput.infoBox(arg, '服务器配置', {
      '游戏服务器端口': Config.Game.port,
      'GM 服务器端口': Config.GM.port,
      '代理服务器端口': Config.Proxy.listenPort,
      '日志级别': Config.Logging.level
    });
  }
}

/**
 * Memory 命令 - 内存使用
 */
@CommandInfo({
  name: 'memory',
  description: '显示内存使用情况',
  usage: 'memory',
  alias: ['mem']
})
export class MemoryCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    const usage = process.memoryUsage();
    await CommandOutput.infoBox(arg, '内存使用情况', {
      'RSS': `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
      'Heap Total': `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      'Heap Used': `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      'External': `${(usage.external / 1024 / 1024).toFixed(2)} MB`
    });
  }
}

/**
 * Uptime 命令 - 运行时间
 */
@CommandInfo({
  name: 'uptime',
  description: '显示服务器运行时间',
  usage: 'uptime'
})
export class UptimeCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    await CommandOutput.info(arg, `服务器运行时间: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
  }
}

/**
 * GC 命令 - 垃圾回收
 */
@CommandInfo({
  name: 'gc',
  description: '手动触发垃圾回收（需要 --expose-gc 启动）',
  usage: 'gc'
})
export class GCCommand implements ICommand {
  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();
      const freed = (before.heapUsed - after.heapUsed) / 1024 / 1024;
      await CommandOutput.success(arg, `垃圾回收完成，释放内存: ${freed.toFixed(2)} MB`);
    } else {
      await CommandOutput.warning(arg, '垃圾回收不可用，请使用 --expose-gc 参数启动');
    }
  }
}

/**
 * Announce 命令 - 全服公告
 */
@CommandInfo({
  name: 'announce',
  description: '发送全服公告',
  usage: 'announce <消息内容>',
  alias: ['ann'],
  permission: 'admin'
})
export class AnnounceCommand implements ICommand {
  private gmService: GMService;

  constructor() {
    this.gmService = new GMService();
  }

  @CommandDefault()
  async execute(arg: CommandArg): Promise<void> {
    if (arg.basicArgs.length === 0) {
      await CommandOutput.usage(arg, 'announce <消息内容>');
      return;
    }

    const message = arg.basicArgs.join(' ');

    try {
      await this.gmService.sendAnnouncement(message, 'system');
      await CommandOutput.success(arg, `已发送公告: ${message}`);
    } catch (error) {
      await CommandOutput.error(arg, '发送公告失败', (error as Error).message);
    }
  }
}
