import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS请求
 *
 * 注意：虽然go-server使用param2，但实际客户端发送的是bossId
 * 我们的实现使用bossId作为BOSS配置的唯一标识
 */
export declare class ChallengeBossReqProto extends BaseProto {
    bossId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ChallengeBossReqProto.d.ts.map