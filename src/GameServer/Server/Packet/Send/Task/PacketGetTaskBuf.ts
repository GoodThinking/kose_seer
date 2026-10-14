import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetTaskBufRspProto } from '../../../../../shared/proto/packets/rsp/task/GetTaskBufRspProto';
import { ClientProtocol } from '../../../../../shared/protocol/ClientProtocol';

export class PacketGetTaskBuf extends BaseProto {
  private readonly _proto: GetTaskBufRspProto;

  constructor(taskId: number, buffers: number[], rawBuffer?: Buffer, result: number = 0) {
    super(CommandID.GET_TASK_BUF);
    this.setResult(result);

    this._proto = new GetTaskBufRspProto();
    this._proto.taskId = taskId;
    this._proto.buffers = buffers.slice();
    this._proto.rawBuffer = rawBuffer && Buffer.from(rawBuffer);
  }

  public serialize(protocol: ClientProtocol = 'kose'): Buffer {
    return this._proto.serialize(protocol);
  }
}
