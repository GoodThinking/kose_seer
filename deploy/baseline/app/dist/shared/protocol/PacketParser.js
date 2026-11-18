"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketParser = void 0;
const HeadInfo_1 = require("./HeadInfo");
const CommandID_1 = require("./CommandID");
const CommandMeta_1 = require("./CommandMeta");
const utils_1 = require("../utils");
/**
 * 数据包解析器
 */
class PacketParser {
    _buffer = Buffer.alloc(0);
    _version = '1';
    _headLength;
    constructor(version = '1') {
        this._version = version;
        this._headLength = HeadInfo_1.HeadInfo.GetHeadLength(version);
    }
    /**
     * 追加数据
     */
    Append(data) {
        this._buffer = Buffer.concat([this._buffer, data]);
        utils_1.Logger.Debug(`[收包] 接收 ${data.length} 字节, 缓冲区累计 ${this._buffer.length} 字节`);
    }
    /**
     * 尝试解析一个完整的数据包
     */
    TryParse() {
        if (this._buffer.length < 4)
            return null;
        const packetLength = this._buffer.readUInt32BE(0);
        // 检查包长度是否合法
        if (packetLength < this._headLength || packetLength > 8388608) {
            utils_1.Logger.Error(`[收包] 非法包长度: ${packetLength}`);
            this._buffer = Buffer.alloc(0);
            return null;
        }
        // 数据不完整
        if (this._buffer.length < packetLength)
            return null;
        // 解析包头
        const head = HeadInfo_1.HeadInfo.Parse(this._buffer, this._version);
        if (!head)
            return null;
        // 提取包体
        const body = this._buffer.subarray(this._headLength, packetLength);
        // 打印解析日志 - 使用元数据智能解析
        const cmdName = (0, CommandID_1.GetCommandName)(head.CmdID);
        const meta = CommandMeta_1.CmdMeta.Get(head.CmdID);
        const desc = meta?.desc ? ` [${meta.desc}]` : '';
        utils_1.Logger.Info(`[收包] ${cmdName}(${head.CmdID})${desc} | UserID=${head.UserID} | Seq=${head.Result} | BodyLen=${body.length}`);
        // 使用元数据智能解析Body
        const containsCredentials = head.CmdID === CommandID_1.CommandID.REGISTER ||
            head.CmdID === CommandID_1.CommandID.MAIN_LOGIN_IN || head.CmdID === CommandID_1.CommandID.LOGIN_IN;
        if (body.length > 0 && !containsCredentials) {
            const bodyStr = CommandMeta_1.CmdMeta.ParseBody(head.CmdID, body, true);
            utils_1.Logger.Debug(`[收包] Body: ${bodyStr}`);
            // 添加hex dump用于调试
            if (head.CmdID === 2401 || head.CmdID === 2403) { // INVITE_TO_FIGHT, HANDLE_FIGHT_INVITE
                utils_1.Logger.Debug(`[收包] Hex: ${body.toString('hex')}`);
            }
        }
        // 移除已解析的数据
        this._buffer = this._buffer.subarray(packetLength);
        return { head, body };
    }
    /**
     * 清空缓冲区
     */
    Clear() {
        this._buffer = Buffer.alloc(0);
    }
}
exports.PacketParser = PacketParser;
//# sourceMappingURL=PacketParser.js.map