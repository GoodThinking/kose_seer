/**
 * 命令参数类
 * 参考 DanhengServer 的 CommandArg
 */
export interface ICommandSender {
    sendMsg(msg: string): Promise<void> | void;
    getUid(): number;
    hasPermission(permission: string): boolean;
}
/**
 * 控制台命令发送者
 */
export declare class ConsoleCommandSender implements ICommandSender {
    sendMsg(msg: string): Promise<void>;
    getUid(): number;
    hasPermission(permission: string): boolean;
}
/**
 * 命令参数
 */
export declare class CommandArg {
    raw: string;
    args: string[];
    basicArgs: string[];
    characterArgs: Map<string, string>;
    sender: ICommandSender;
    targetUid?: number;
    constructor(raw: string, sender: ICommandSender, targetUid?: number);
    /**
     * 解析参数
     * 支持：
     * - 基本参数：10001 100 50 give list
     * - 字符参数：x10 l50 r5 (单字母+数字)
     * - 目标参数：@10001
     */
    private parseArgs;
    private isDigit;
    /**
     * 获取整数参数
     */
    getInt(index: number, defaultValue?: number): number;
    /**
     * 获取字符串参数
     */
    getString(index: number, defaultValue?: string): string;
    /**
     * 获取字符参数
     */
    getCharArg(key: string, defaultValue?: string): string;
    /**
     * 获取字符参数（整数）
     */
    getCharArgInt(key: string, defaultValue?: number): number;
    /**
     * 发送消息
     */
    sendMsg(msg: string): Promise<void>;
    /**
     * 转换为字符串
     */
    toString(): string;
}
//# sourceMappingURL=CommandArg.d.ts.map