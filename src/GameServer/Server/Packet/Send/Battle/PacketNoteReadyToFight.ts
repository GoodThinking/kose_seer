import { ClientProtocol } from '../../../../../shared/protocol/ClientProtocol';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteReadyToFightRspProto } from '../../../../../shared/proto/packets/rsp/battle/NoteReadyToFightRspProto';
import { SimplePetInfoProto } from '../../../../../shared/proto/common/SimplePetInfoProto';

/**
 * 准备战斗通知包
 * CMD 2503
 */
export class PacketNoteReadyToFight extends BaseProto {
  private _data: Buffer;

  constructor(
    playerUserId: number,
    playerNick: string,
    playerPets: SimplePetInfoProto[],
    enemyUserId: number,
    enemyNick: string,
    enemyPets: SimplePetInfoProto[],
    protocol: ClientProtocol = 'kose'
  ) {
    super(CommandID.NOTE_READY_TO_FIGHT);
    
    const proto = new NoteReadyToFightRspProto();
    proto.setPlayerInfo(playerUserId, playerNick, playerPets);
    proto.setEnemyInfo(enemyUserId, enemyNick, enemyPets);
    
    this._data = proto.serialize(protocol);
  }

  public serialize(): Buffer {
    return this._data;
  }
}
