import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { ClientProtocol } from '../../../../../shared/protocol/ClientProtocol';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { EnterMapRspProto } from '../../../../../shared/proto/packets/rsp/map/EnterMapRspProto';
import { SeerMapUserInfoProto } from '../../../../../shared/proto/common/SeerMapUserInfoProto';

/**
 * 进入地图响应包
 * CMD 2001
 */
export class PacketEnterMap extends BaseProto {
  private _data: Buffer;

  constructor(userInfo?: SeerMapUserInfoProto, result: number = 0, protocol: ClientProtocol = 'kose') {
    super(CommandID.ENTER_MAP);
    const proto = new EnterMapRspProto();
    if (userInfo) {
      proto.userInfo = userInfo;
    }
    if (result !== 0) {
      proto.setResult(result);
    }
    this._data = proto.serialize(protocol);
  }

  public serialize(): Buffer {
    return this._data;
  }
}
