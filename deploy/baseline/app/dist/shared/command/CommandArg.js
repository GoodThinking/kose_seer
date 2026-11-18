"use strict";
/**
 * 命令参数类
 * 参考 DanhengServer 的 CommandArg
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandArg = exports.ConsoleCommandSender = void 0;
/**
 * 控制台命令发送者
 */
class ConsoleCommandSender {
    async sendMsg(msg) {
        console.log(msg);
    }
    getUid() {
        return 0; // 控制台没有 UID
    }
    hasPermission(permission) {
        return true; // 控制台拥有所有权限
    }
}
exports.ConsoleCommandSender = ConsoleCommandSender;
/**
 * 命令参数
 */
class CommandArg {
    raw;
    args = [];
    basicArgs = [];
    characterArgs = new Map();
    sender;
    targetUid;
    constructor(raw, sender, targetUid) {
        this.raw = raw;
        this.sender = sender;
        this.targetUid = targetUid;
        this.parseArgs(raw);
    }
    /**
     * 解析参数
     * 支持：
     * - 基本参数：10001 100 50 give list
     * - 字符参数：x10 l50 r5 (单字母+数字)
     * - 目标参数：@10001
     */
    parseArgs(raw) {
        const parts = raw.split(/\s+/).filter(s => s.length > 0);
        for (const part of parts) {
            if (part.length === 0)
                continue;
            const firstChar = part[0];
            // 特殊处理 @target
            if (firstChar === '@') {
                const value = part.substring(1);
                const uid = parseInt(value);
                if (!isNaN(uid)) {
                    this.targetUid = uid;
                }
                this.args.push(part);
                continue;
            }
            // 检查是否是字符参数（单字母+数字，如 x10, l50）
            // 格式：单个字母 + 至少一个数字
            if (part.length >= 2 && /^[a-zA-Z]$/.test(firstChar) && /^\d+$/.test(part.substring(1))) {
                const key = firstChar;
                const value = part.substring(1);
                this.characterArgs.set(key, value);
                this.args.push(part);
            }
            else {
                // 其他都是基本参数
                this.basicArgs.push(part);
                this.args.push(part);
            }
        }
    }
    isDigit(char) {
        return /^\d$/.test(char);
    }
    /**
     * 获取整数参数
     */
    getInt(index, defaultValue = 0) {
        if (this.basicArgs.length <= index)
            return defaultValue;
        const value = parseInt(this.basicArgs[index]);
        return isNaN(value) ? defaultValue : value;
    }
    /**
     * 获取字符串参数
     */
    getString(index, defaultValue = '') {
        if (this.basicArgs.length <= index)
            return defaultValue;
        return this.basicArgs[index];
    }
    /**
     * 获取字符参数
     */
    getCharArg(key, defaultValue = '') {
        return this.characterArgs.get(key) || defaultValue;
    }
    /**
     * 获取字符参数（整数）
     */
    getCharArgInt(key, defaultValue = 0) {
        const value = this.characterArgs.get(key);
        if (!value)
            return defaultValue;
        const num = parseInt(value);
        return isNaN(num) ? defaultValue : num;
    }
    /**
     * 发送消息
     */
    async sendMsg(msg) {
        await this.sender.sendMsg(msg);
    }
    /**
     * 转换为字符串
     */
    toString() {
        return `BasicArgs: [${this.basicArgs.join(', ')}], CharacterArgs: {${Array.from(this.characterArgs.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}}`;
    }
}
exports.CommandArg = CommandArg;
//# sourceMappingURL=CommandArg.js.map