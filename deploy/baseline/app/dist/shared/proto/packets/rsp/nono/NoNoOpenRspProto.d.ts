import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo响应
 *
 * 响应包体：
 * - status (4) - 状态码
 *   - 0: 已经有NoNo
 *   - 非0: 成功获得NoNo
 *
 * 客户端逻辑（GetNoNo.as）：
 * - status == 0: 显示"已经有NoNo"
 * - status != 0: 设置 MainManager.actorInfo.hasNono = true，显示成功消息
 */
export declare class NoNoOpenRspProto extends BaseProto {
    status: number;
    constructor();
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=NoNoOpenRspProto.d.ts.map