import { BaseProto } from '../../../base/BaseProto';
/**
 * 完成任务响应
 * CMD 2202: COMPLETE_TASK
 *
 * 响应格式：taskId(4) + petId(4) + captureTm(4) + itemCount(4) + [itemId(4) + itemCount(4)]...
 */
export declare class CompleteTaskRspProto extends BaseProto {
    taskId: number;
    petId: number;
    captureTm: number;
    items: Array<{
        id: number;
        count: number;
    }>;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setTaskId(taskId: number): this;
    setPetId(petId: number): this;
    setCaptureTm(captureTm: number): this;
    setItems(items: Array<{
        id: number;
        count: number;
    }>): this;
}
//# sourceMappingURL=CompleteTaskRspProto.d.ts.map