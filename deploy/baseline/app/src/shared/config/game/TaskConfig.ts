import { Logger } from '../../utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 任务奖励物品
 */
export interface ITaskRewardItem {
  itemId: number;
  count: number;
}

/**
 * 任务特殊奖励
 */
export interface ITaskSpecialReward {
  type: number;
  value: number;
}

/**
 * 任务精灵奖励
 */
export interface ITaskPetReward {
  petId: number;
  level: number;
  dv: number;
  nature: number;
}

/**
 * 任务家具奖励
 */
export interface ITaskFitmentReward {
  fitmentId: number;
  count: number;
}

/**
 * 任务奖励
 */
export interface ITaskRewards {
  items?: ITaskRewardItem[];
  coins?: number;
  special?: ITaskSpecialReward[];
  pets?: ITaskPetReward[];
  fitments?: ITaskFitmentReward[];
}

/**
 * 任务配置
 */
export interface ITaskConfig {
  name: string;
  type: string;
  paramMap?: { [key: string]: number };
  targetItemId?: number;
  rewards?: ITaskRewards;
}

interface ITaskConfigFile {
  tasks: { [taskId: string]: ITaskConfig };
}

export class TaskConfig {
  private static _instance: TaskConfig;
  private _tasks: Map<number, ITaskConfig> = new Map();
  private _loaded: boolean = false;

  private constructor() {}

  public static get Instance(): TaskConfig {
    if (!TaskConfig._instance) {
      TaskConfig._instance = new TaskConfig();
    }
    return TaskConfig._instance;
  }

  public Load(): void {
    if (this._loaded) {
      return;
    }

    try {
      const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'tasks.json');
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: ITaskConfigFile = JSON.parse(configData);

      for (const [taskIdStr, taskConfig] of Object.entries(config.tasks)) {
        const taskId = parseInt(taskIdStr, 10);
        this._tasks.set(taskId, taskConfig);
      }

      this._loaded = true;
      Logger.Info(`[TaskConfig] Loaded ${this._tasks.size} tasks`);
    } catch (error) {
      Logger.Error('[TaskConfig] Failed to load task config', error as Error);
    }
  }

  public GetTask(taskId: number): ITaskConfig | undefined {
    if (!this._loaded) {
      this.Load();
    }
    return this._tasks.get(taskId);
  }

  public HasTask(taskId: number): boolean {
    if (!this._loaded) {
      this.Load();
    }
    return this._tasks.has(taskId);
  }

  public GetAllTaskIds(): number[] {
    if (!this._loaded) {
      this.Load();
    }
    return Array.from(this._tasks.keys());
  }
}
