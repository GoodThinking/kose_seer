import { Socket } from 'net';
import { HeadInfo } from '../../../shared/protocol';
import { CryptoHandler } from '../../../shared/crypto';
export type PlayerInstance = import('../../Game/Player/PlayerInstance').PlayerInstance;
/**
 * Session类型
 */
export declare enum SessionType {
    MAIN = "main",// 主连接
    ROOM = "room"
}
/**
 * 客户端会话接口
 */
export interface IClientSession {
    Socket: Socket;
    UserID: number;
    Address: string;
    Player?: PlayerInstance;
    Crypto?: CryptoHandler;
    EncryptionEnabled?: boolean;
    Type?: SessionType;
}
/**
 * 命令处理器接口
 */
export interface IHandler {
    /**
     * 处理命令 (支持同步和异步)
     */
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): void | Promise<void>;
}
//# sourceMappingURL=IHandler.d.ts.map