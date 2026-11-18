/**
 * 日志管理服务
 */
export declare class LogService {
    /**
     * 获取操作日志
     */
    getLogs(page: number, limit: number, type?: string, uid?: number): Promise<any>;
    /**
     * 记录操作日志
     */
    addLog(type: string, uid: number, operator: string, action: string, details: string): Promise<void>;
}
//# sourceMappingURL=LogService.d.ts.map