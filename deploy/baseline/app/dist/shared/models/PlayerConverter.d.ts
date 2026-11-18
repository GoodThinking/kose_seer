/**
 * 玩家数据模型转换器
 * 负责在内部数据模型(IPlayerInfo)和Proto之间转换
 */
import { IPlayerInfo } from './PlayerModel';
import { LoginRspProto } from '../proto';
import { IClothInfo } from './PlayerModel';
/**
 * 将IPlayerInfo转换为LoginRspProto
 * 用于游戏登录响应
 */
export declare function PlayerInfoToLoginProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto;
/**
 * 从LoginRspProto提取基础玩家信息
 * 用于更新IPlayerInfo的部分字段
 */
export declare function LoginProtoToPlayerInfo(proto: LoginRspProto, existingPlayer: IPlayerInfo): IPlayerInfo;
/**
 * 创建简化的服装信息列表
 * 用于Proto序列化
 */
export declare function SimplifyClothes(clothes: IClothInfo[]): Array<{
    id: number;
}>;
//# sourceMappingURL=PlayerConverter.d.ts.map