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
    paramMap?: {
        [key: string]: number;
    };
    targetItemId?: number;
    rewards?: ITaskRewards;
}
export declare class TaskConfig {
    private static _instance;
    private _tasks;
    private _loaded;
    private constructor();
    static get Instance(): TaskConfig;
    Load(): void;
    GetTask(taskId: number): ITaskConfig | undefined;
    HasTask(taskId: number): boolean;
    GetAllTaskIds(): number[];
}
//# sourceMappingURL=TaskConfig.d.ts.map