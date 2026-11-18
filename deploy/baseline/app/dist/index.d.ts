import { GameServer } from './GameServer';
import { ProxyServer } from './ProxyServer';
import { GMServer } from './GMServer/GMServer';
/**
 * 命令行参数解析
 */
interface StartupOptions {
    game: boolean;
    gm: boolean;
    proxy: boolean;
    all: boolean;
    help: boolean;
}
/**
 * 服务管理器
 * 统一管理所有服务的启动和停止
 */
declare class ServiceManager {
    private _gameServer;
    private _gmServer;
    private _proxyServer;
    constructor();
    /**
     * 根据选项启动服务
     */
    Start(options: StartupOptions): Promise<void>;
    /**
     * 停止所有已启动的服务
     */
    StopAll(): Promise<void>;
    /**
     * 获取服务状态
     */
    GetStatus(): {
        game: boolean;
        gm: boolean;
        proxy: boolean;
    };
    /**
     * 获取服务器实例（用于控制台命令）
     */
    GetServers(): {
        game: GameServer | null;
        gm: GMServer | null;
        proxy: ProxyServer | null;
    };
}
export { ServiceManager };
//# sourceMappingURL=index.d.ts.map