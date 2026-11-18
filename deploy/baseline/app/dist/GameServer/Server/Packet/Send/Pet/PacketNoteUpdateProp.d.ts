import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IUpdatePropInfo } from '../../../../../shared/proto/packets/rsp/pet/NoteUpdatePropRspProto';
/**
 * NOTE_UPDATE_PROP 数据包 (2508)
 * 推送精灵属性更新信息
 */
export declare class PacketNoteUpdateProp extends BaseProto {
    private _data;
    constructor(addition: number, pets: IUpdatePropInfo[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoteUpdateProp.d.ts.map