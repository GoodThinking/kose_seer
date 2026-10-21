import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { DatabaseManager } from '../../../../../DataBase/DatabaseManager';

/** Read-only, self-scoped collection snapshot: uint32 count followed by species IDs. */
export const PET_COLLECTION = 91001;
class PacketPetCollection extends BaseProto {
  constructor(private readonly ids: number[]) { super(PET_COLLECTION); }
  serialize(): Buffer {
    const body = Buffer.alloc(4 + this.ids.length * 4);
    body.writeUInt32BE(this.ids.length, 0);
    this.ids.forEach((id, index) => body.writeUInt32BE(id, 4 + index * 4));
    return body;
  }
}

@Opcode(PET_COLLECTION, InjectType.NONE)
export class PetCollectionHandler implements IHandler {
  async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 0) throw new Error('Invalid collection snapshot request');
    const rows = await DatabaseManager.Instance.Query<{pet_id: number}>(
      'SELECT pet_id FROM player_pet_collection WHERE owner_id = ? ORDER BY pet_id', [player.Uid]);
    await player.SendPacket(new PacketPetCollection(rows.map(row => row.pet_id)));
  }
}
