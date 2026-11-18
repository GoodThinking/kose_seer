"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = exports.Colors = void 0;
// ANSI 颜色码
exports.Colors = {
    Reset: '\x1b[0m',
    // 前景色
    Black: '\x1b[30m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
    // 亮色
    BrightBlack: '\x1b[90m',
    BrightRed: '\x1b[91m',
    BrightGreen: '\x1b[92m',
    BrightYellow: '\x1b[93m',
    BrightBlue: '\x1b[94m',
    BrightMagenta: '\x1b[95m',
    BrightCyan: '\x1b[96m',
    BrightWhite: '\x1b[97m',
};
// 日志级别
var LogLevel;
(function (LogLevel) {
    LogLevel["Debug"] = "DEBUG";
    LogLevel["Info"] = "INFO";
    LogLevel["Warn"] = "WARN";
    LogLevel["Error"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// 日志级别映射
const LogLevelMap = {
    'debug': LogLevel.Debug,
    'info': LogLevel.Info,
    'warn': LogLevel.Warn,
    'error': LogLevel.Error,
};
// 日志级别对应的颜色
const LevelColors = {
    [LogLevel.Debug]: exports.Colors.BrightBlack,
    [LogLevel.Info]: exports.Colors.BrightGreen,
    [LogLevel.Warn]: exports.Colors.BrightYellow,
    [LogLevel.Error]: exports.Colors.BrightRed,
};
function ParseStackLine(line) {
    const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):\d+\)?/);
    if (!match)
        return null;
    const methodName = match[1] || 'anonymous';
    const filePath = match[2] || 'unknown';
    const lineNum = parseInt(match[3], 10) || 0;
    const isInternal = filePath.startsWith('node:') ||
        filePath.includes('node_modules') ||
        filePath.includes('internal/') ||
        methodName.includes('Module.') ||
        methodName.includes('Wrapper');
    const fileName = filePath.split(/[/\\]/).pop() || filePath;
    return {
        FilePath: fileName,
        Line: lineNum,
        MethodName: methodName,
        IsInternal: isInternal,
    };
}
function IsValidMethodName(name) {
    if (!name)
        return false;
    if (name === 'anonymous')
        return false;
    if (name === 'unknown')
        return false;
    if (name.includes('<'))
        return false;
    // 放宽限制，允许 Object. 和 Module. 前缀
    // if (name.includes('Object.')) return false;
    // if (name.includes('Module.')) return false;
    if (name.includes('Wrapper'))
        return false;
    if (name.includes('process.'))
        return false;
    return true;
}
// 是否为 pkg 打包环境
const isPkg = !!process.pkg;
function IsLoggerFrame(line) {
    return line.includes('GetStackInfo') ||
        line.includes('FormatMessage') ||
        line.includes('Logger.Output') ||
        line.includes('Logger.Debug') ||
        line.includes('Logger.Info') ||
        line.includes('Logger.Warn') ||
        line.includes('Logger.Error');
}
function GetStackInfo(stackIndex = 3) {
    // pkg 打包后栈帧指向 bootstrap.js，无意义，直接跳过
    if (isPkg)
        return { FilePath: '', Line: 0, MethodName: '' };
    const stack = new Error().stack;
    if (!stack)
        return { FilePath: 'unknown', Line: 0, MethodName: 'unknown' };
    const lines = stack.split('\n');
    // 先尝试固定索引
    let targetInfo = null;
    if (lines.length > stackIndex) {
        targetInfo = ParseStackLine(lines[stackIndex]);
    }
    // 如果固定索引失败（解析失败或文件名为unknown），智能查找第一个非Logger内部帧
    if (!targetInfo || targetInfo.FilePath === 'unknown') {
        targetInfo = null;
        for (let i = 1; i < lines.length; i++) {
            if (IsLoggerFrame(lines[i]))
                continue;
            const info = ParseStackLine(lines[i]);
            if (info && !info.IsInternal) {
                targetInfo = info;
                break;
            }
        }
    }
    if (!targetInfo)
        return { FilePath: 'unknown', Line: 0, MethodName: 'unknown' };
    if (!IsValidMethodName(targetInfo.MethodName)) {
        for (let i = 1; i < lines.length; i++) {
            if (IsLoggerFrame(lines[i]))
                continue;
            const info = ParseStackLine(lines[i]);
            if (info && !info.IsInternal && IsValidMethodName(info.MethodName)) {
                targetInfo.MethodName = info.MethodName;
                break;
            }
        }
        if (!IsValidMethodName(targetInfo.MethodName)) {
            targetInfo.MethodName = targetInfo.FilePath.replace(/\.[^.]+$/, '');
        }
    }
    return targetInfo;
}
function FormatTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}
function FormatMessage(level, message, stackInfo, tag) {
    const time = FormatTime();
    const levelColor = LevelColors[level];
    let result = `${exports.Colors.BrightBlack}[${time}]${exports.Colors.Reset} ` +
        `${levelColor}[${level.padEnd(5)}]${exports.Colors.Reset} `;
    // pkg 环境下栈信息无意义，不输出
    if (stackInfo.FilePath) {
        result += `${exports.Colors.Cyan}[${stackInfo.FilePath}:${stackInfo.Line}]${exports.Colors.Reset} `;
    }
    const methodName = tag || stackInfo.MethodName;
    if (methodName) {
        result += `${exports.Colors.Magenta}[${methodName}]${exports.Colors.Reset} `;
    }
    result += `${exports.Colors.White}${message}${exports.Colors.Reset}`;
    return result;
}
function FormatStack(error) {
    if (!error.stack)
        return '';
    const lines = error.stack.split('\n').slice(1);
    return lines.map(line => `${exports.Colors.BrightBlack}${line}${exports.Colors.Reset}`).join('\n');
}
class Logger {
    static _minLevel = LogLevel.Info;
    static _consoleInterface = null;
    /**
     * 设置控制台接口（用于日志与输入提示符的协调）
     */
    static SetConsoleInterface(consoleInterface) {
        Logger._consoleInterface = consoleInterface;
    }
    /**
     * 初始化日志系统（从配置加载）
     */
    static Initialize(configLevel) {
        if (configLevel) {
            const level = LogLevelMap[configLevel.toLowerCase()] || LogLevel.Info;
            Logger._minLevel = level;
            Logger.Info(`[Logger] 日志级别设置为: ${configLevel.toUpperCase()}`);
        }
    }
    static SetMinLevel(level) {
        Logger._minLevel = level;
    }
    static ShouldLog(level) {
        const levels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error];
        return levels.indexOf(level) >= levels.indexOf(Logger._minLevel);
    }
    /**
     * 输出日志（处理与控制台提示符的协调）
     * 日志始终在命令提示符上方显示
     */
    static Output(message, isError = false) {
        if (Logger._consoleInterface) {
            // 清除当前行（命令提示符）
            Logger._consoleInterface.clearLine();
            // 输出日志到上方
            if (isError) {
                console.error(message);
            }
            else {
                console.log(message);
            }
            // 恢复命令提示符到底部
            Logger._consoleInterface.restoreLine();
        }
        else {
            // 如果没有控制台接口，直接输出
            if (isError) {
                console.error(message);
            }
            else {
                console.log(message);
            }
        }
    }
    static Debug(message, options) {
        if (!Logger.ShouldLog(LogLevel.Debug))
            return;
        const stackInfo = GetStackInfo();
        const formattedMessage = FormatMessage(LogLevel.Debug, message, stackInfo, options?.Tag);
        Logger.Output(formattedMessage);
    }
    static Info(message, options) {
        if (!Logger.ShouldLog(LogLevel.Info))
            return;
        const stackInfo = GetStackInfo();
        const formattedMessage = FormatMessage(LogLevel.Info, message, stackInfo, options?.Tag);
        Logger.Output(formattedMessage);
    }
    static Warn(message, options) {
        if (!Logger.ShouldLog(LogLevel.Warn))
            return;
        const stackInfo = GetStackInfo();
        const formattedMessage = FormatMessage(LogLevel.Warn, message, stackInfo, options?.Tag);
        Logger.Output(formattedMessage);
    }
    static Error(message, error, options) {
        if (!Logger.ShouldLog(LogLevel.Error))
            return;
        const stackInfo = GetStackInfo();
        const formattedMessage = FormatMessage(LogLevel.Error, message, stackInfo, options?.Tag);
        Logger.Output(formattedMessage, true);
        if (error) {
            Logger.Output(FormatStack(error), true);
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map