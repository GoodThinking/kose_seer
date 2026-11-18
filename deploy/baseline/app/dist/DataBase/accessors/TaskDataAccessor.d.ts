/**
 * TaskData 访问器
 * 提供 TaskData 的便捷访问接口
 */
import { TaskData } from '../models/TaskData';
/**
 * TaskData 访问器
 */
export declare class TaskDataAccessor {
    private static _instance;
    private constructor();
    static get Instance(): TaskDataAccessor;
    /**
     * 获取或创建 TaskData
     */
    GetOrCreate(uid: number): Promise<TaskData>;
    /**
     * 获取 TaskData（不创建）
     */
    Get(uid: number): TaskData | null;
    /**
     * 保存 TaskData
     */
    Save(data: TaskData): Promise<void>;
}
//# sourceMappingURL=TaskDataAccessor.d.ts.map