import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { ITaskBuffer, ITaskInfo, TaskData, TaskStatus } from '../../../DataBase/models/TaskData';

async function SaveTaskColumn(
  tasks: TaskData, column: 'task_list' | 'task_buffers',
  stage: () => { value: string; publish: () => void }
): Promise<void> {
  await DatabaseManager.Instance.WithConnection(async driver => {
    const candidate = stage();
    await driver.beginTransaction();
    let committed = false;
    try {
      const result = await driver.execute(
        `UPDATE player_tasks SET ${column} = ? WHERE owner_id = ?`,
        [candidate.value, tasks.Uid]
      );
      if (result.affectedRows !== 1) throw new Error('Task data missing');
      await driver.commit();
      committed = true;
      // Publish before releasing the connection; queued saves see only committed state.
      candidate.publish();
    } catch (error) {
      if (!committed) await driver.rollback();
      throw error;
    }
  });
}

/** Accept without exposing an unpersisted task to readers or queued auto-saves. */
export async function SaveAcceptedTask(tasks: TaskData, taskId: number): Promise<void> {
  await SaveTaskColumn(tasks, 'task_list', () => {
    // The handler's check may precede another queued acceptance.
    if (tasks.IsTaskAccepted(taskId)) throw new Error('Task already accepted');
    const accepted: ITaskInfo = {
      taskId, status: TaskStatus.ACCEPTED,
      acceptTime: Math.floor(Date.now() / 1000), completeTime: 0
    };
    const staged = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: accepted };
    return { value: JSON.stringify(staged), publish: () => { tasks.TaskList.set(taskId, accepted); } };
  });
}

/** Complete a task with no rewards; publish only the committed task entry. */
export async function SaveCompletedTask(tasks: TaskData, taskId: number): Promise<void> {
  await SaveTaskColumn(tasks, 'task_list', () => {
    const task = tasks.GetTask(taskId);
    if (!task || (task.status !== TaskStatus.ACCEPTED && task.status !== TaskStatus.IN_PROGRESS)) {
      throw new Error('Task is not pending completion');
    }
    const completed: ITaskInfo = {
      ...task, status: TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000)
    };
    const staged = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: completed };
    return { value: JSON.stringify(staged), publish: () => { tasks.TaskList.set(taskId, completed); } };
  });
}

/** Build the next buffer only after entering the shared connection queue. */
export async function SaveTaskBuffer(
  tasks: TaskData, taskId: number, update: (current: ITaskBuffer | undefined) => ITaskBuffer
): Promise<void> {
  await SaveTaskColumn(tasks, 'task_buffers', () => {
    const buffer = update(tasks.TaskBuffers.get(taskId));
    const staged = { ...JSON.parse(tasks.ToRow().task_buffers), [taskId]: buffer };
    return { value: JSON.stringify(staged), publish: () => { tasks.TaskBuffers.set(taskId, buffer); } };
  });
}
