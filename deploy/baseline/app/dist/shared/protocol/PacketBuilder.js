"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketBuilder = void 0;
const HeadInfo_1 = require("./HeadInfo");
const CommandID_1 = require("./CommandID");
const CommandMeta_1 = require("./CommandMeta");
const utils_1 = require("../utils");
// 数据包构建器
class PacketBuilder {
    _version;
    _headLength;
    constructor(version = '1') {
        this._version = version;
        this._headLength = HeadInfo_1.HeadInfo.GetHeadLength(version);
    }
    // 构建响应包
    Build(cmdID, userID, result, data) {
        const bodyLength = data ? data.length : 0;
        const packetLength = this._headLength + bodyLength;
        const buffer = Buffer.alloc(packetLength);
        let offset = 0;
        // 写入包长度
        buffer.writeUInt32BE(packetLength, offset);
        offset += 4;
        // 写入版本号
        buffer.write(this._version, offset, 1, 'utf8');
        offset += 1;
        // 写入命令ID
        buffer.writeUInt32BE(cmdID, offset);
        offset += 4;
        // 写入用户ID
        buffer.writeUInt32BE(userID, offset);
        offset += 4;
        // 写入结果码
        buffer.writeInt32BE(result, offset);
        offset += 4;
        // 版本2需要写入错误码
        if (this._version === '2') {
            buffer.writeUInt32BE(0, offset);
            offset += 4;
        }
        // 写入数据体
        if (data && data.length > 0) {
            data.copy(buffer, offset);
        }
        // 打印构建日志 - 使用元数据智能解析
        const cmdName = (0, CommandID_1.GetCommandName)(cmdID);
        const meta = CommandMeta_1.CmdMeta.Get(cmdID);
        const desc = meta?.desc ? ` [${meta.desc}]` : '';
        utils_1.Logger.Info(`[发包] ${cmdName}(${cmdID})${desc} | UserID=${userID} | Result=${result} | BodyLen=${bodyLength}`);
        // 暂时禁用 Body 解析，避免性能问题和潜在的死循环
        // TODO: 修复 CmdMeta.ParseBody 的性能问题后再启用
        /*
        if (bodyLength > 0 && data) {
          try {
            const bodyStr = CmdMeta.ParseBody(cmdID, data, false);
            Logger.Debug(`[发包] Body: ${bodyStr}`);
          } catch (err) {
            Logger.Debug(`[发包] Body 解析失败: ${(err as Error).message}`);
          }
        }
        */
        return buffer;
    }
}
exports.PacketBuilder = PacketBuilder;
//# sourceMappingURL=PacketBuilder.js.map