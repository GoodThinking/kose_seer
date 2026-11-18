import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { ITaskRewardItem } from '../../../../../shared/config/game/TaskConfig';
export declare class PacketCompleteTask extends BaseProto {
    private _data;
    constructor(taskId: number, petId: number, captureTm: number, items: ITaskRewardItem[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketCompleteTask.d.ts.map