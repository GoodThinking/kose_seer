import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { Logger } from '../../../../../shared/utils';

class PacketPetBargeList extends BaseProto {
  constructor(private readonly data: Buffer) {
    super(CommandID.PET_BARGE_LIST);
  }
  serialize(): Buffer {
    return this.data;
  }
}

/**
 * [CMD: 2309 PET_BARGE_LIST] 精灵图鉴点亮/收集查询
 */
@Opcode(CommandID.PET_BARGE_LIST, InjectType.NONE)
export class PetBargeListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    let startId = 1;
    let endId = 1;
    if (body && body.length >= 8) {
      startId = body.readUInt32BE(0);
      endId = body.readUInt32BE(4);
    } else if (body && body.length >= 4) {
      startId = endId = body.readUInt32BE(0);
    }

    if (startId <= 0) startId = 1;
    if (endId < startId) endId = startId;
    if (endId - startId > 200) endId = startId + 200;

    const ownedPetIds = new Set<number>();
    try {
      for (const p of player.PetManager.PetData.PetList) {
        if (p && p.petId > 0) ownedPetIds.add(p.petId);
      }
    } catch (err) {
      Logger.Warn(`[PetBargeList] 读取精灵列表异常: ${(err as Error).message}`);
    }

    const count = endId - startId + 1;
    const buf = Buffer.alloc(4 + count * 16);
    buf.writeUInt32BE(count, 0);

    let offset = 4;
    for (let id = startId; id <= endId; id++) {
      const owned = ownedPetIds.has(id) ? 1 : 0;
      buf.writeUInt32BE(id, offset);          // monID
      buf.writeUInt32BE(owned, offset + 4);   // enCntCnt
      buf.writeUInt32BE(owned, offset + 8);   // isCatched
      buf.writeUInt32BE(owned, offset + 12);  // isKilled
      offset += 16;
    }

    await player.SendPacket(new PacketPetBargeList(buf));
    Logger.Debug(`[PetBargeList] 用户 ${player.Uid} 查询图鉴: start=${startId}, end=${endId}, owned=${ownedPetIds.size}`);
  }
}
