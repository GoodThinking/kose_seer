import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家响应
 *
 * 客户端解析（FollowCmdListener.as）：
 * - userId (4)
 * - superStage (4) - flag字段，客户端读取为superStage
 * - state (4) - boolean，跟随状态
 * - 如果跟随：
 *   - nick (16)
 *   - color (4)
 *   - power (4) - 体力值（需要*1000）
 *
 * 注意：客户端不读取 result 字段！直接从 userId 开始读取
 */
export declare class NoNoFollowOrHoomRspProto extends BaseProto {
    userId: number;
    superStage: number;
    state: number;
    nick: string;
    color: number;
    power: number;
    isFollow: boolean;
    constructor();
    serialize(): Buffer;
    setUserId(value: number): this;
    setSuperStage(value: number): this;
    setState(value: number): this;
    setNick(value: string): this;
    setColor(value: number): this;
    setPower(value: number): this;
    setIsFollow(value: boolean): this;
}
//# sourceMappingURL=NoNoFollowOrHoomRspProto.d.ts.map