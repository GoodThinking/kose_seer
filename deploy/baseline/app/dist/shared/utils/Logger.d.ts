export declare const Colors: {
    readonly Reset: "\u001B[0m";
    readonly Black: "\u001B[30m";
    readonly Red: "\u001B[31m";
    readonly Green: "\u001B[32m";
    readonly Yellow: "\u001B[33m";
    readonly Blue: "\u001B[34m";
    readonly Magenta: "\u001B[35m";
    readonly Cyan: "\u001B[36m";
    readonly White: "\u001B[37m";
    readonly BrightBlack: "\u001B[90m";
    readonly BrightRed: "\u001B[91m";
    readonly BrightGreen: "\u001B[92m";
    readonly BrightYellow: "\u001B[93m";
    readonly BrightBlue: "\u001B[94m";
    readonly BrightMagenta: "\u001B[95m";
    readonly BrightCyan: "\u001B[96m";
    readonly BrightWhite: "\u001B[97m";
};
export declare enum LogLevel {
    Debug = "DEBUG",
    Info = "INFO",
    Warn = "WARN",
    Error = "ERROR"
}
interface ILogOptions {
    Tag?: string;
}
interface IConsoleInterface {
    clearLine(): void;
    restoreLine(): void;
}
export declare class Logger {
    private static _minLevel;
    private static _consoleInterface;
    /**
     * 设置控制台接口（用于日志与输入提示符的协调）
     */
    static SetConsoleInterface(consoleInterface: IConsoleInterface | null): void;
    /**
     * 初始化日志系统（从配置加载）
     */
    static Initialize(configLevel?: string): void;
    static SetMinLevel(level: LogLevel): void;
    private static ShouldLog;
    /**
     * 输出日志（处理与控制台提示符的协调）
     * 日志始终在命令提示符上方显示
     */
    private static Output;
    static Debug(message: string, options?: ILogOptions): void;
    static Info(message: string, options?: ILogOptions): void;
    static Warn(message: string, options?: ILogOptions): void;
    static Error(message: string, error?: Error, options?: ILogOptions): void;
}
export {};
//# sourceMappingURL=Logger.d.ts.map