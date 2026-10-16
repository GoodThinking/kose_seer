import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { PlayerInstance } from '../Player/PlayerInstance';

export class FunctionalItemError extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
  }
}

function isUInt32(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
}

export async function UseLearningMultiplierItem(player: PlayerInstance, itemId: number): Promise<number> {
  const configuredUses = GameConfig.GetItemById(itemId)?.DualEvTimes;
  if (!isUInt32(configuredUses) || configuredUses === 0) {
    throw new FunctionalItemError(5001, 'Item has no configured learning multiplier');
  }

  const inventory = player.ItemManager.ItemData;
  const releaseInventory = await inventory.AcquireReward();
  const releaseEffect = await player.Data.AcquireConsumableMutation();
  try {
    if (player.Session.Socket.destroyed || player.Session.Player !== player) {
      throw new FunctionalItemError(5001, 'Session ended');
    }
    const staged = inventory.ItemList.map(item => ({...item}));
    const item = staged.find(entry => entry.itemId === itemId);
    if (!item || !isUInt32(item.count) || item.count < 1) {
      throw new FunctionalItemError(5001, 'Learning multiplier item missing');
    }
    item.count--;
    const items = item.count ? staged : staged.filter(entry => entry !== item);

    return await DatabaseManager.Instance.WithConnection(async driver => {
      await driver.beginTransaction();
      let committed = false;
      try {
        const [row] = await driver.query<{learn_times: unknown}>(
          'SELECT learn_times FROM players WHERE user_id = ?', [player.Uid]
        );
        if (!row || !isUInt32(row.learn_times) || row.learn_times + configuredUses > 0xffffffff) {
          throw new FunctionalItemError(5001, 'Invalid learning multiplier balance');
        }
        const learnTimes = row.learn_times + configuredUses;
        const itemWrite = await driver.execute(
          'UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]
        );
        const effectWrite = await driver.execute(
          'UPDATE players SET learn_times = ? WHERE user_id = ? AND learn_times = ?',
          [learnTimes, player.Uid, row.learn_times]
        );
        if (itemWrite.affectedRows !== 1 || effectWrite.affectedRows !== 1) {
          throw new Error('Learning multiplier item was not saved');
        }
        await driver.commit();
        committed = true;
        inventory.ItemList = items;
        player.Data.PublishLearnTimes(learnTimes);
        return learnTimes;
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally {
    releaseEffect();
    releaseInventory();
  }
}
