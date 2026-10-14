import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { ItemData } from '../../../DataBase/models/ItemData';
import { TaskData, TaskStatus } from '../../../DataBase/models/TaskData';
import { ITaskRewardItem } from '../../../shared/config/game/TaskConfig';
import { ItemSystem } from '../Item/ItemSystem';

/** Starter item tasks: inventory and completion are published after the same durable commit. */
export async function CompleteItemTask(tasks: TaskData, items: ItemData, rewards: ITaskRewardItem[], taskId: 85 | 87): Promise<void> {
  if ((taskId !== 85 && taskId !== 87) || tasks.Uid !== items.Uid || !rewards.length || rewards.some(reward =>
    !Number.isInteger(reward.itemId) || !ItemSystem.Exists(reward.itemId) ||
    !Number.isInteger(reward.count) || reward.count <= 0 || reward.count > 0xFFFFFFFF)) {
    throw new Error('Invalid starter item task rewards');
  }
  const release = items.ReserveReward();
  try {
    await DatabaseManager.Instance.WithConnection(async driver => {
      let committed = false;
      await driver.beginTransaction();
      try {
        const rows = await driver.query<any>('SELECT task_list FROM player_tasks WHERE owner_id = ?', [tasks.Uid]);
        const task = tasks.GetTask(taskId);
        if (!task || task.status !== TaskStatus.ACCEPTED ||
            !rows[0] || JSON.parse(rows[0].task_list)[taskId]?.status !== TaskStatus.ACCEPTED) {
          throw new Error('Item task is not accepted');
        }
        const stagedItems = items.ItemList.map(item => ({ ...item }));
        for (const reward of rewards) {
          const existing = stagedItems.find(item => item.itemId === reward.itemId);
          if (existing) {
            if (!Number.isInteger(existing.count) || existing.count < 0 || existing.count + reward.count > 0xFFFFFFFF) {
              throw new Error('Item count out of range');
            }
            existing.count += reward.count;
          } else {
            stagedItems.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
          }
        }
        const completed = { ...task, status: TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000) };
        const stagedTasks = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: completed };
        const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(stagedItems), items.Uid]);
        const taskWrite = await driver.execute('UPDATE player_tasks SET task_list = ? WHERE owner_id = ?', [JSON.stringify(stagedTasks), tasks.Uid]);
        if (itemWrite.affectedRows !== 1 || taskWrite.affectedRows !== 1) throw new Error('Item task data disappeared');
        await driver.commit();
        committed = true;
        // No await before both caches are published. Queued DataSaver snapshots see the committed state.
        items.ItemList = stagedItems;
        tasks.TaskList.set(taskId, completed);
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally { release(); }
}
