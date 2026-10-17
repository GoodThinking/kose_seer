import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import type { IDriver } from '../../../DataBase/drivers/IDriver';
import type { IItemInfo } from '../../../DataBase/models/ItemData';
import { CommandID } from '../../../shared/protocol/CommandID';
import { BaseProto } from '../../../shared/proto/base/BaseProto';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { PacketBattleReward } from '../../Server/Packet/Send/Battle/PacketBattleReward';
import { BossAbilityConfig } from '../Battle/BossAbility/BossAbilityConfig';
import { BattleEventType, IBattleEndEvent, PlayerEventType } from '../Event/EventTypes';
import type { PlayerInstance } from '../Player/PlayerInstance';

/** Native map 502 uses a local summoning animation and five flame hits in one minute. */
export class SummoningField {
  public static readonly MAP_ID = 502;
  private static readonly sessions = new WeakMap<PlayerInstance, SummoningField>();
  private summoned = false;
  private hits = 0;
  private windowStart = 0;
  private joining = false;
  private visit = 0;

  private constructor(private readonly player: PlayerInstance) {
    player.EventBus.On<IBattleEndEvent>(BattleEventType.BATTLE_END, this.OnVictory.bind(this));
    player.EventBus.On(PlayerEventType.LOGOUT, async () => SummoningField.Reset(player));
  }

  public static For(player: PlayerInstance): SummoningField {
    let state = this.sessions.get(player);
    if (!state) {
      state = new SummoningField(player);
      this.sessions.set(player, state);
    }
    return state;
  }

  public static Reset(player: PlayerInstance): void {
    const state = this.sessions.get(player);
    if (state) {
      state.summoned = false;
      state.hits = 0;
      state.windowStart = 0;
      state.joining = false;
      ++state.visit;
    }
  }

  public async Join(pad: number): Promise<void> {
    if (this.player.Data.mapID !== SummoningField.MAP_ID || ![1, 2, 3].includes(pad) || this.summoned || this.joining) {
      await this.player.SendPacket(new PacketEmpty(CommandID.JOIN_GAME).setResult(5001));
      return;
    }
    this.joining = true;
    const visit = this.visit;
    try {
      await this.player.SendPacket(new PacketEmpty(CommandID.JOIN_GAME));
      if (this.player.Data.mapID !== SummoningField.MAP_ID || this.visit !== visit) return;
      this.summoned = true;
      this.windowStart = Date.now();
      await this.player.SendPacket(new SummoningComplete(this.player.Uid));
    } finally {
      if (this.visit === visit) this.joining = false;
    }
  }

  public Hit(region: number): boolean {
    if (this.player.Data.mapID !== SummoningField.MAP_ID || !this.summoned || region !== 0) return false;
    if (this.hits >= 5) return true;
    const now = Date.now();
    if (now - this.windowStart >= 60000) {
      this.hits = 0;
      this.windowStart = now;
    }
    ++this.hits;
    return true;
  }

  public CanChallenge(region: number): boolean {
    return this.player.Data.mapID === SummoningField.MAP_ID && this.summoned && this.hits >= 5 && region === 0;
  }

  private async OnVictory(event: IBattleEndEvent): Promise<void> {
    if (!event.isVictory || event.playerId !== this.player.Uid || event.extra.sptId !== 115 || !this.CanChallenge(0)) return;
    const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(SummoningField.MAP_ID, 0);
    const itemId = config?.spt?.rewardItemId;
    if (!itemId) throw new Error('Summoning first-victory reward is not configured');
    const inventory = this.player.ItemManager.ItemData as typeof this.player.ItemManager.ItemData & {
      AcquireReward(): Promise<() => void>;
    };
    const release = await inventory.AcquireReward();
    const database = DatabaseManager.Instance as DatabaseManager & {
      WithConnection<T>(work: (driver: IDriver) => Promise<T>): Promise<T>;
    };
    try {
      const granted = await database.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
          const key = 'boss:502:first-victory';
          const [claim] = await driver.query<{ amount: number }>(
            'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
            [this.player.Uid, key, 0]);
          if (claim) {
            await driver.commit();
            committed = true;
            return false;
          }
          const [row] = await driver.query<{ item_list: string }>(
            'SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
          if (!row) throw new Error('Summoning reward inventory missing');
          const items: IItemInfo[] = JSON.parse(row.item_list);
          const item = items.find(entry => entry.itemId === itemId);
          const added = !item || item.count === 0;
          // This essence has Max=1. An already owned essence satisfies the first-victory grant.
          if (item) item.count = Math.max(1, item.count);
          else items.push({ itemId, count: 1, expireTime: 0x057E40 });
          const claimWrite = await driver.execute(
            'INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)',
            [this.player.Uid, key, 0, Math.floor(Date.now() / 1000), 1]);
          const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
            [JSON.stringify(items), this.player.Uid]);
          if (claimWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1) throw new Error('Summoning reward was not saved');
          await driver.commit();
          committed = true;
          inventory.ItemList = items;
          return added;
        } catch (error) {
          if (!committed) await driver.rollback();
          throw error;
        }
      });
      if (granted) await this.player.SendPacket(new PacketBattleReward([{ itemId, itemCnt: 1 }]));
    } finally {
      release();
    }
  }
}

class SummoningComplete extends BaseProto {
  constructor(private readonly userId: number) { super(CommandID.FB_GAME_OVER); }
  public serialize(): Buffer {
    const data = Buffer.alloc(16);
    data.writeUInt32BE(1, 0);
    data.writeUInt32BE(this.userId, 4);
    // Move off the pads before the appearance animation; these coordinates are walkable map floor.
    data.writeUInt32BE(512, 8);
    data.writeUInt32BE(420, 12);
    return data;
  }
}
