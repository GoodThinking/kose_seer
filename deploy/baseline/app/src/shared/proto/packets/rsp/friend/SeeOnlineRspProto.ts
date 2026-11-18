import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 在线用户信息
 */
export interface IOnlineInfo {
  userId: number;    // 用户ID
  serverId: number;  // 服务器ID
  mapType: number;   // 地图类型
  mapId: number;     // 地图ID
}

/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态响应
 * 
 * 响应格式:
 * - onlineCount (uint32) - 在线用户数量
 * - 对于每个在线用户：
 *   - userId (uint32) - 用户ID
 *   - serverId (uint32) - 服务器ID
 *   - mapType (uint32) - 地图类型
 *   - mapId (uint32) - 地图ID
 */
export class SeeOnlineRspProto extends BaseProto {
  public onlineList: IOnlineInfo[] = [];

  constructor() {
    super(CommandID.SEE_ONLINE);
  }

  public setOnlineUsers(users: IOnlineInfo[]): void {
    this.onlineList = users;
  }

  serialize(): Buffer {
    const buffers: Buffer[] = [];
    
    // onlineCount
    const countBuf = Buffer.allocUnsafe(4);
    countBuf.writeUInt32BE(this.onlineList.length, 0);
    buffers.push(countBuf);
    
    // 在线用户列表
    for (const user of this.onlineList) {
      const userBuf = Buffer.allocUnsafe(16);
      userBuf.writeUInt32BE(user.userId, 0);
      userBuf.writeUInt32BE(user.serverId, 4);
      userBuf.writeUInt32BE(user.mapType, 8);
      userBuf.writeUInt32BE(user.mapId, 12);
      buffers.push(userBuf);
    }
    
    return Buffer.concat(buffers);
  }
}
