"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProto = void 0;
/**
 * Proto基类
 * 所有协议消息都继承此类
 */
class BaseProto {
    /**
     * 命令ID（通过构造函数传入）
     */
    cmdId;
    /**
     * 结果码（默认0=成功）
     */
    result = 0;
    /**
     * 构造函数
     * @param cmdId 命令ID（子类通过super(cmdId)传入）
     */
    constructor(cmdId) {
        this.cmdId = cmdId;
    }
    /**
     * 获取命令ID
     */
    getCmdId() {
        return this.cmdId;
    }
    /**
     * 获取结果码
     */
    getResult() {
        return this.result;
    }
    /**
     * 设置结果码
     */
    setResult(result) {
        this.result = result;
        return this;
    }
    /**
     * 辅助方法：构建固定长度的字符串Buffer
     */
    buildString(str, length) {
        const buffer = Buffer.alloc(length);
        if (str) {
            Buffer.from(str, 'utf8').copy(buffer, 0, 0, Math.min(Buffer.byteLength(str, 'utf8'), length));
        }
        return buffer;
    }
    /**
     * 辅助方法：从Buffer读取字符串
     */
    readString(buffer) {
        return buffer.toString('utf8').replace(/\0/g, '').trim();
    }
    /**
     * 辅助方法：构建固定长度的Buffer
     */
    buildBuffer(data, length) {
        const buffer = Buffer.alloc(length);
        if (data) {
            const source = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            source.copy(buffer, 0, 0, Math.min(source.length, length));
        }
        return buffer;
    }
}
exports.BaseProto = BaseProto;
//# sourceMappingURL=BaseProto.js.map