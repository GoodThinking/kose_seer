import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';

@Opcode(CommandID.PET_ROOM_SHOW, InjectType.NONE)
export class PetRoomShowHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    if (session.Player) await session.Player.PetManager.HandlePetRoomShow(body);
  }
}
