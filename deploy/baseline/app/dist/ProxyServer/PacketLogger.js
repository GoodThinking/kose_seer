"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLogger = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * 数据包日志记录器
 * 将捕获的数据包写入日志文件
 */
class PacketLogger {
    _logDir;
    _currentLogFile = '';
    _enabled = true;
    constructor(logDir) {
        this._logDir = logDir || (0, path_1.join)(process.cwd(), 'logs', 'proxy');
        this.EnsureLogDir();
        this.CreateNewLogFile();
    }
    /**
     * 确保日志目录存在
     */
    EnsureLogDir() {
        if (!(0, fs_1.existsSync)(this._logDir)) {
            (0, fs_1.mkdirSync)(this._logDir, { recursive: true });
        }
    }
    /**
     * 创建新的日志文件
     */
    CreateNewLogFile() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const fileName = `proxy_${dateStr}_${timeStr}.log`;
        this._currentLogFile = (0, path_1.join)(this._logDir, fileName);
        // 写入文件头
        const header = [
            '================================================================================',
            `KOSE Proxy Packet Log`,
            `Started: ${now.toLocaleString()}`,
            '================================================================================',
            '',
        ].join('\n');
        (0, fs_1.writeFileSync)(this._currentLogFile, header, 'utf8');
    }
    /**
     * 记录数据包
     */
    LogPacket(packet) {
        if (!this._enabled)
            return;
        const time = new Date(packet.timestamp);
        const timeStr = time.toLocaleTimeString() + '.' + String(time.getMilliseconds()).padStart(3, '0');
        const arrow = packet.direction === 'C2S' ? '>>>' : '<<<';
        const directionText = packet.direction === 'C2S' ? 'Client → Server' : 'Server → Client';
        const lines = [
            '--------------------------------------------------------------------------------',
            `[#${packet.id}] ${timeStr} ${arrow} ${directionText}`,
            `CMD: ${packet.cmdID} (${packet.cmdName}) ${packet.cmdDesc ? `[${packet.cmdDesc}]` : ''}`,
            `UserID: ${packet.userID} | Result: ${packet.result} | BodyLen: ${packet.bodyLength}`,
            `Format: ${packet.formatString}`,
        ];
        // 字段信息
        if (packet.fields.length > 0) {
            lines.push('Fields:');
            for (const field of packet.fields) {
                const desc = field.desc ? ` // ${field.desc}` : '';
                lines.push(`  ${field.name} = ${field.value}${desc}`);
            }
        }
        // Body Hex
        if (packet.bodyHex) {
            lines.push(`Body (Hex): ${packet.bodyHex}`);
        }
        // 原始数据
        lines.push(`Raw (Hex): ${packet.rawHex}`);
        lines.push('');
        const logContent = lines.join('\n');
        (0, fs_1.appendFileSync)(this._currentLogFile, logContent, 'utf8');
    }
    /**
     * 写入分隔线（用于会话开始/结束）
     */
    LogSessionStart(clientAddr, remoteAddr) {
        if (!this._enabled)
            return;
        const now = new Date();
        const lines = [
            '',
            '================================================================================',
            `SESSION START: ${now.toLocaleString()}`,
            `Client: ${clientAddr}`,
            `Remote: ${remoteAddr}`,
            '================================================================================',
            '',
        ].join('\n');
        (0, fs_1.appendFileSync)(this._currentLogFile, lines, 'utf8');
    }
    /**
     * 写入会话结束
     */
    LogSessionEnd(clientAddr) {
        if (!this._enabled)
            return;
        const now = new Date();
        const lines = [
            '',
            `================================================================================`,
            `SESSION END: ${now.toLocaleString()}`,
            `Client: ${clientAddr}`,
            `================================================================================`,
            '',
        ].join('\n');
        (0, fs_1.appendFileSync)(this._currentLogFile, lines, 'utf8');
    }
    /**
     * 启用/禁用日志
     */
    SetEnabled(enabled) {
        this._enabled = enabled;
    }
    /**
     * 获取当前日志文件路径
     */
    get CurrentLogFile() {
        return this._currentLogFile;
    }
    /**
     * 获取日志目录
     */
    get LogDir() {
        return this._logDir;
    }
    /**
     * 是否启用
     */
    get IsEnabled() {
        return this._enabled;
    }
}
exports.PacketLogger = PacketLogger;
//# sourceMappingURL=PacketLogger.js.map