import { Socket } from 'net';
/**
 * Flash Socket Policy 处理器
 */
export declare class PolicyHandler {
    /**
     * 检查并处理策略文件请求
     * @returns true 如果是策略请求并已处理，false 否则
     */
    static Handle(socket: Socket, data: Buffer, address: string): boolean;
}
//# sourceMappingURL=PolicyHandler.d.ts.map