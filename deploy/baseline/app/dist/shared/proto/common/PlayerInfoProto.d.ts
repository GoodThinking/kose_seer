import { BaseProto } from '../base/BaseProto';
/**
 * 玩家基础信息Proto
 * 可在多个协议中复用
 */
export declare class PlayerInfoProto extends BaseProto {
    userId: number;
    nickname: string;
    level: number;
    exp: number;
    coins: number;
    energy: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=PlayerInfoProto.d.ts.map