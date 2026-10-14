import { PlayerInstance } from '../Player/PlayerInstance';
import { CommitBalanceReward } from '../Reward/CommitBalanceReward';
import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';

/** User-approved private-server rule: shared weekly claim, Monday 00:00 Asia/Shanghai. */
export function ReceiverWeek(unixSeconds: number): number {
  return Math.floor((unixSeconds + 28800 + 259200) / 604800) * 604800 - 259200 - 28800;
}
export class ReceiverAlreadyClaimed extends Error {}

export class ExperienceReceiver {
  constructor(private readonly player: PlayerInstance) {}
  private ValidateType(type: number): void {
    if (type !== 1004 && type !== 2002) throw new Error('Unsupported receiver type');
    if (type === 2002 && !this.player.Data.superNono) throw new Error('Super NoNo required');
  }
  public async Count(type: number): Promise<number> {
    this.ValidateType(type);
    return DatabaseManager.Instance.WithConnection(async driver => {
      const rows = await driver.query(
        'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
        [this.player.Uid, 'experience', ReceiverWeek(Math.floor(Date.now() / 1000))]
      );
      return rows.length ? 1 : 0;
    });
  }
  public async Claim(type: number): Promise<number> {
    this.ValidateType(type);
    if (!this.player.Data.hasNono || !(this.player.Data.nonoState & 2)) throw new Error('Following NoNo required');
    const config = ConfigLoader.Instance.LoadJson<{ experience: number }>('data/json/experience_receiver.json');
    if (!config || !Number.isSafeInteger(config.experience) || config.experience <= 0) {
      throw new Error('Invalid receiver reward configuration');
    }
    const experience = config.experience;
    await CommitBalanceReward(this.player, { experience }, async (driver, now) => {
      const week = ReceiverWeek(now);
      const claimed = await driver.query(
        'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
        [this.player.Uid, 'experience', week]
      );
      if (claimed.length) throw new ReceiverAlreadyClaimed('Receiver already claimed');
      const write = await driver.execute(
        'INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)',
        [this.player.Uid, 'experience', week, now, experience]
      );
      if (write.affectedRows !== 1) throw new Error('Receiver claim was not saved');
      return () => {};
    });
    return experience;
  }
}
