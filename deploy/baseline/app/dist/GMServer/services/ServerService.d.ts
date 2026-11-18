/**
 * 服务器管理服务
 */
export declare class ServerService {
    /**
     * 获取服务器状态
     */
    getServerStatus(): Promise<any>;
    /**
     * 全服公告
     */
    sendAnnouncement(message: string, type: string): Promise<void>;
    /**
     * 设置维护模式
     */
    setMaintenance(enabled: boolean, message?: string): Promise<void>;
}
//# sourceMappingURL=ServerService.d.ts.map