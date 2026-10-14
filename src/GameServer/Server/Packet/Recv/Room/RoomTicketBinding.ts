import { timingSafeEqual } from 'crypto';
import { SessionRepository } from '../../../../../DataBase/repositories/Player/SessionRepository';
import { PlayerManager } from '../../../../Game/Player/PlayerManager';
import { PlayerInstance } from '../../../../Game/Player/PlayerInstance';
import { IClientSession, SessionType } from '../../IHandler';

interface RoomTicket {
  mainSession: IClientSession;
  sessionKey: string;
  targetUserId: number;
  ticket: Buffer;
}

/** Bind the opaque room ticket to the authenticated main connection and issued target. */
export class RoomTicketBinding {
  public static readonly Instance = new RoomTicketBinding();
  private readonly _tickets = new WeakMap<PlayerInstance, RoomTicket>();
  private readonly _sessions = new SessionRepository();

  private IsLive(player: PlayerInstance, main: IClientSession, key: string): boolean {
    return player.Initialized && PlayerManager.GetInstance().GetPlayer(player.Uid) === player &&
      player.Session === main && main.Player === player && main.UserID === player.Uid &&
      main.Type === SessionType.MAIN && !main.Socket.destroyed && main.Socket.writable &&
      main.AuthenticatedSessionKey === key;
  }

  private async IsValidSession(key: string, userId: number): Promise<boolean> {
    const info = await this._sessions.ValidateSession(key, userId);
    return !!info && info.sessionKey === key && info.accountId === userId &&
      info.isOnline && info.expireTime > Math.floor(Date.now() / 1000);
  }

  public async Issue(main: IClientSession, targetUserId: number): Promise<Buffer> {
    const player = main.Player;
    const key = main.AuthenticatedSessionKey;
    if (!player || !key || !/^[0-9a-f]{32}$/.test(key) || !this.IsLive(player, main, key)) {
      throw new Error('Room ticket requires an authenticated live main connection');
    }
    if (!await this.IsValidSession(key, player.Uid) || !this.IsLive(player, main, key)) {
      throw new Error('Room ticket main session is no longer valid');
    }
    const ticket = Buffer.alloc(24);
    ticket.writeUInt32BE(player.Uid, 0);
    ticket.writeUInt32BE(targetUserId, 4);
    Buffer.from(key, 'hex').copy(ticket, 8);
    this._tickets.set(player, { mainSession: main, sessionKey: key, targetUserId, ticket });
    return Buffer.from(ticket);
  }

  public CanBind(room: IClientSession, player: PlayerInstance, targetUserId: number, ticket: Buffer): boolean {
    if (ticket.length !== 24 || ticket.readUInt32BE(0) !== player.Uid || ticket.readUInt32BE(4) !== targetUserId) return false;
    const issued = this._tickets.get(player);
    return !!issued && issued.targetUserId === targetUserId && timingSafeEqual(issued.ticket, ticket) &&
      this.IsLive(player, issued.mainSession, issued.sessionKey) && room !== issued.mainSession &&
      !room.Socket.destroyed && room.Socket.writable && !room.Player && room.UserID === 0;
  }

  public async Validate(room: IClientSession, userId: number, targetUserId: number, ticket: Buffer): Promise<PlayerInstance | null> {
    if (ticket.length !== 24 || ticket.readUInt32BE(0) !== userId) return null;
    const player = PlayerManager.GetInstance().GetPlayer(userId);
    if (!player || !this.CanBind(room, player, targetUserId, ticket)) return null;
    const issued = this._tickets.get(player)!;
    if (!await this.IsValidSession(issued.sessionKey, userId) || this._tickets.get(player) !== issued ||
      !this.CanBind(room, player, targetUserId, ticket)) return null;
    return player;
  }
}
