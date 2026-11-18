/**
 * 命令输出格式化工具
 * 提供统一的高级显示格式
 */
import { CommandArg } from './CommandArg';
export declare class CommandOutput {
    /**
     * 显示成功消息
     */
    static success(arg: CommandArg, message: string, details?: string): Promise<void>;
    /**
     * 显示错误消息
     */
    static error(arg: CommandArg, message: string, details?: string): Promise<void>;
    /**
     * 显示警告消息
     */
    static warning(arg: CommandArg, message: string): Promise<void>;
    /**
     * 显示信息消息
     */
    static info(arg: CommandArg, message: string): Promise<void>;
    /**
     * 显示信息框
     */
    static infoBox(arg: CommandArg, title: string, items: Record<string, string | number>): Promise<void>;
    /**
     * 显示表格
     */
    static table(arg: CommandArg, headers: string[], rows: (string | number)[][], title?: string): Promise<void>;
    /**
     * 显示列表
     */
    static list(arg: CommandArg, items: Array<{
        label: string;
        value: string | number;
        highlight?: boolean;
    }>, title?: string): Promise<void>;
    /**
     * 显示分组列表
     */
    static groupedList(arg: CommandArg, groups: Record<string, Array<{
        label: string;
        value: string | number;
    }>>): Promise<void>;
    /**
     * 显示进度信息
     */
    static progress(arg: CommandArg, message: string): Promise<void>;
    /**
     * 显示用法提示
     */
    static usage(arg: CommandArg, usage: string, examples?: string[]): Promise<void>;
    /**
     * 显示可用子命令
     */
    static availableSubcommands(arg: CommandArg, subcommands: string[]): Promise<void>;
    /**
     * 去除 ANSI 转义码（用于计算实际长度）
     */
    private static stripAnsi;
}
//# sourceMappingURL=CommandOutput.d.ts.map