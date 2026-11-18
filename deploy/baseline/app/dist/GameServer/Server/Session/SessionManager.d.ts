import { Socket } from 'net';
import { PacketParser } from '../../../shared/protocol';
import { IClientSession } from '../Packet/IHandler';
/**
 * 内部会话接口，包含解析器
 */
export interface IInternalSession extends IClientSession {
    Parser: PacketParser;
    PolicyHandled: boolean;
}
/**
 * 客户端会话管理器
 */
export declare class SessionManager {
    private _sessions;
    private _protocolVersion;
    constructor(protocolVersion?: string);
    /**
     * 创建新会话
     */
    CreateSession(socket: Socket): IInternalSession;
    /**
     * 移除会话
     */
    RemoveSession(address: string): void;
    /**
     * 获取会话
     */
    GetSession(address: string): IInternalSession | undefined;
    /**
     * 获取所有会话
     */
    GetAllSessions(): IInternalSession[];
    /**
     * 获取在线人数
     */
    get OnlineCount(): number;
}
//# sourceMappingURL=SessionManager.d.ts.map