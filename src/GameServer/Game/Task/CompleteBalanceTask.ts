import { PlayerInstance } from '../Player/PlayerInstance';
import { CommitBalanceReward, BalanceReward } from '../Reward/CommitBalanceReward';
import { ITaskBuffer, TaskStatus } from '../../../DataBase/models/TaskData';
import { GoldToWire } from '../../../shared/protocol/GoldCurrency';
import { DecodeKoseTaskBuffer } from './Task96Buffer';

export async function CompleteBalanceTask(player: PlayerInstance, taskId: number, reward: BalanceReward): Promise<void> {
  await CommitBalanceReward(player, reward, async (driver, now) => {
    const rows = await driver.query<{ task_list: string; task_buffers: string }>(
      'SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [player.Uid]
    );
    if (!rows[0]) throw new Error('Reward tasks missing');
    const list = JSON.parse(rows[0].task_list);
    const task = list[taskId];
    if (!task || (task.status !== TaskStatus.ACCEPTED && task.status !== TaskStatus.IN_PROGRESS)) {
      throw new Error('Balance task is not accepted');
    }
    const buffers = JSON.parse(rows[0].task_buffers);
    const buffer = buffers[taskId];
    if (taskId === 88 && ![85, 86, 87].every(id => list[id]?.status === TaskStatus.COMPLETED)) {
      throw new Error('Task 88 requires completed onboarding steps');
    }
    if (taskId === 88) GoldToWire(player.Data.gold + (reward.gold ?? 0));
    if (taskId === 96) {
      const xinBytes = buffer?.xinBytes;
      let stages: number[];
      if (xinBytes !== undefined) {
        if (!Array.isArray(xinBytes) || xinBytes.length !== 100 ||
            xinBytes.some((n: number) => !Number.isInteger(n) || n < 0 || n > 0xff)) {
          throw new Error('Invalid task 96 progress bytes');
        }
        stages = xinBytes;
      } else {
        stages = DecodeKoseTaskBuffer(buffer as ITaskBuffer | undefined, 96);
      }
      if (![0, 1, 2].every(i => stages[i] === 1)) throw new Error('Task 96 progress incomplete');
      if (!player.Data.hasNono || !(player.Data.nonoState & 2)) throw new Error('Task 96 requires following NoNo');
      if (xinBytes !== undefined) {
        buffers[taskId] = { ...buffer, xinBytes: xinBytes.map((n: number, i: number) => i === 3 ? 1 : n) };
      } else {
        const normalized: ITaskBuffer = { ...buffer };
        stages.forEach((byte, i) => { normalized[i] = byte; });
        normalized[3] = 1;
        buffers[taskId] = normalized;
      }
    }
    const completed = { ...task, status: TaskStatus.COMPLETED, completeTime: now };
    list[taskId] = completed;
    const write = await driver.execute(
      'UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?',
      [JSON.stringify(list), JSON.stringify(buffers), player.Uid]
    );
    if (write.affectedRows !== 1) throw new Error('Reward tasks disappeared');
    return () => {
      player.TaskManager.TaskData.TaskList.set(taskId, completed);
      if (buffers[taskId]) player.TaskManager.TaskData.TaskBuffers.set(taskId, buffers[taskId]);
    };
  });
}
