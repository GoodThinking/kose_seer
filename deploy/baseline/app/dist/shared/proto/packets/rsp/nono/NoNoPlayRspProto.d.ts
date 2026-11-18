import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9013 NONO_PLAY] NoNo 玩耍响应
 *
 * 玩耍会增加 NoNo 的心情值
 */
export declare class NoNoPlayRspProto extends BaseProto {
    itemId: number;
    power: number;
    ai: number;
    mate: number;
    iq: number;
    constructor();
    serialize(): Buffer;
    setPower(value: number): this;
    setAi(value: number): this;
    setMate(value: number): this;
    setIq(value: number): this;
}
//# sourceMappingURL=NoNoPlayRspProto.d.ts.map