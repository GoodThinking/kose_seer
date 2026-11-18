import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';

class PacketArenaInfo extends BaseProto {
  constructor(private readonly data: Buffer) {
    super(CommandID.ARENA_GET_INFO);
  }
  serialize(): Buffer {
    return this.data;
  }
}

/**
 * [CMD: 2419 ARENA_GET_INFO] 擂台信息查询
 */
@Opcode(CommandID.ARENA_GET_INFO, InjectType.NONE)
export class ArenaGetInfoHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    // 返回空擂台状态：flag=0, hostID=0, hostWins=0
    const buf = Buffer.alloc(12);
    await player.SendPacket(new PacketArenaInfo(buf));
  }
}

class PacketAchieveTitleList extends BaseProto {
  constructor(private readonly data: Buffer) {
    super(CommandID.ACHIEVETITLELIST);
  }
  serialize(): Buffer {
    return this.data;
  }
}

/**
 * [CMD: 3403 ACHIEVETITLELIST] 成就称号列表
 */
@Opcode(CommandID.ACHIEVETITLELIST, InjectType.NONE)
export class AchieveTitleListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    // 当前无特殊称号，返回 count = 0
    const buf = Buffer.alloc(4);
    await player.SendPacket(new PacketAchieveTitleList(buf));
  }
}
