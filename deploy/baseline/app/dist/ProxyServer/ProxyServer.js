"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyServer = void 0;
const net_1 = require("net");
const net_2 = require("net");
const utils_1 = require("../shared/utils");
const protocol_1 = require("../shared/protocol");
const WebServer_1 = require("./WebServer");
const PacketLogger_1 = require("./PacketLogger");
const ServerConfig_1 = require("../shared/config/ServerConfig");
/**
 * 代理服务器
 * 用于监测客户端与远程服务器之间的通信
 */
class ProxyServer {
    _server;
    _webServer;
    _packetLogger;
    _running = false;
    _packetID = 0;
    _capturedPackets = [];
    _version = '1';
    _headLength = 17;
    constructor() {
        this._server = (0, net_1.createServer)();
        this._webServer = new WebServer_1.WebServer(this, ServerConfig_1.Config.Proxy.webPort);
        this._packetLogger = new PacketLogger_1.PacketLogger();
        this.SetupConnectionHandler();
        utils_1.Logger.Info('[ProxyServer] 使用 CommandMetaRegistry 进行协议解析');
    }
    /**
     * 设置连接处理
     */
    SetupConnectionHandler() {
        this._server.on('connection', (clientSocket) => {
            const clientAddr = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
            utils_1.Logger.Info(`[Proxy] 客户端连接: ${clientAddr}`);
            let clientBuffer = Buffer.alloc(0);
            let serverBuffer = Buffer.alloc(0);
            let remoteSocket = null;
            let remoteConnected = false;
            let pendingData = [];
            let isGameServer = false; // 是否连接到游戏服务器
            /**
             * 根据第一个数据包决定连接到哪个服务器
             */
            const connectToRemote = (firstPacket) => {
                // 检查是否是策略文件请求
                const dataStr = firstPacket.toString('utf8');
                if (dataStr.startsWith('<policy-file-request/>')) {
                    // 策略文件请求，默认连接登录服务器
                    isGameServer = false;
                }
                else if (firstPacket.length >= 9) {
                    // 解析命令ID
                    const cmdID = firstPacket.readUInt32BE(5);
                    // LOGIN_IN (1001) 是游戏登录，连接游戏服务器
                    if (cmdID === protocol_1.CommandID.LOGIN_IN) {
                        isGameServer = true;
                        utils_1.Logger.Info(`[Proxy] 检测到 LOGIN_IN 请求，连接游戏服务器`);
                    }
                }
                const host = isGameServer ? ServerConfig_1.Config.Proxy.gameServer.host : ServerConfig_1.Config.Proxy.loginServer.host;
                const port = isGameServer ? ServerConfig_1.Config.Proxy.gameServer.port : ServerConfig_1.Config.Proxy.loginServer.port;
                utils_1.Logger.Info(`[Proxy] 连接到${isGameServer ? '游戏' : '登录'}服务器: ${host}:${port}`);
                remoteSocket = (0, net_2.createConnection)({ host, port });
                remoteSocket.on('connect', () => {
                    utils_1.Logger.Info(`[Proxy] 已连接远程服务器: ${host}:${port}`);
                    remoteConnected = true;
                    this._packetLogger.LogSessionStart(clientAddr, `${host}:${port}`);
                    // 发送缓存的数据
                    for (const data of pendingData) {
                        utils_1.Logger.Info(`[Proxy] 发送缓存数据 ${data.length} 字节`);
                        remoteSocket.write(data);
                    }
                    pendingData = [];
                });
                // 服务器 -> 客户端
                remoteSocket.on('data', (data) => {
                    utils_1.Logger.Info(`[Proxy] S2C 收到 ${data.length} 字节: ${data.toString('hex').substring(0, 100)}`);
                    // 只在登录服务器连接时修改服务器列表
                    const modifiedData = isGameServer ? data : this.ModifyServerListResponse(data);
                    serverBuffer = this.ParseAndCapture(serverBuffer, modifiedData, 'S2C');
                    clientSocket.write(modifiedData);
                });
                remoteSocket.on('error', (err) => {
                    utils_1.Logger.Error(`[Proxy] 远程服务器错误`, err);
                    clientSocket.destroy();
                });
                remoteSocket.on('close', (hadError) => {
                    utils_1.Logger.Info(`[Proxy] 远程服务器断开 (hadError=${hadError})`);
                    clientSocket.destroy();
                });
                remoteSocket.on('end', () => {
                    utils_1.Logger.Info(`[Proxy] 远程服务器发送 FIN (正常关闭)`);
                });
            };
            // 客户端 -> 服务器
            clientSocket.on('data', (data) => {
                utils_1.Logger.Info(`[Proxy] C2S 收到 ${data.length} 字节: ${data.toString('hex').substring(0, 100)}`);
                // 第一次收到数据时，根据数据包类型决定连接哪个服务器
                if (!remoteSocket) {
                    pendingData.push(data);
                    connectToRemote(data);
                    return;
                }
                // 如果远程连接还没建立，缓存数据
                if (!remoteConnected) {
                    utils_1.Logger.Info(`[Proxy] 远程连接未建立，缓存数据`);
                    pendingData.push(data);
                    return;
                }
                // 解析并记录数据包
                clientBuffer = this.ParseAndCapture(clientBuffer, data, 'C2S');
                // 转发到远程服务器
                remoteSocket.write(data);
            });
            // 错误处理
            clientSocket.on('error', (err) => {
                utils_1.Logger.Error(`[Proxy] 客户端错误: ${clientAddr}`, err);
                remoteSocket?.destroy();
            });
            // 关闭处理
            clientSocket.on('close', (hadError) => {
                utils_1.Logger.Info(`[Proxy] 客户端断开: ${clientAddr} (hadError=${hadError})`);
                this._packetLogger.LogSessionEnd(clientAddr);
                remoteSocket?.destroy();
            });
        });
    }
    /**
     * 修改服务器列表响应中的IP/端口
     * 将远程服务器IP替换为代理服务器IP
     */
    ModifyServerListResponse(data) {
        // 检查数据长度是否足够解析包头
        if (data.length < this._headLength) {
            return data;
        }
        const packetLength = data.readUInt32BE(0);
        if (packetLength < this._headLength || packetLength > data.length) {
            return data;
        }
        // 解析命令ID (包头结构: Length(4) + Version(1) + CmdID(4) + UserID(4) + Result(4) = 17字节)
        const cmdID = data.readUInt32BE(5);
        // 只处理 COMMEND_ONLINE (105) 和 RANGE_ONLINE (106)
        if (cmdID !== protocol_1.CommandID.COMMEND_ONLINE && cmdID !== protocol_1.CommandID.RANGE_ONLINE) {
            return data;
        }
        utils_1.Logger.Info(`[Proxy] 检测到服务器列表响应 CMD=${cmdID}，准备修改IP/端口`);
        // 复制数据以便修改
        const modified = Buffer.from(data);
        // 服务器信息结构: onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4) = 30字节
        // COMMEND_ONLINE 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
        // RANGE_ONLINE 响应: onlineCnt(4) + servers...
        let offset = this._headLength; // 跳过包头
        if (cmdID === protocol_1.CommandID.COMMEND_ONLINE) {
            // 跳过 maxOnlineID(4) + isVIP(4) + onlineCnt(4)
            offset += 12;
        }
        else {
            // RANGE_ONLINE: 跳过 onlineCnt(4)
            offset += 4;
        }
        // 获取服务器数量
        const serverCountOffset = cmdID === protocol_1.CommandID.COMMEND_ONLINE
            ? this._headLength + 8 // maxOnlineID(4) + isVIP(4) 之后
            : this._headLength; // 包头之后
        if (serverCountOffset + 4 > data.length) {
            return data;
        }
        const serverCount = data.readUInt32BE(serverCountOffset);
        utils_1.Logger.Info(`[Proxy] 服务器数量: ${serverCount}`);
        // 代理服务器IP (填充到16字节)
        const proxyIP = ServerConfig_1.Config.Proxy.listenHost;
        const proxyIPBuffer = Buffer.alloc(16, 0);
        proxyIPBuffer.write(proxyIP, 'utf8');
        // 代理服务器端口
        const proxyPort = ServerConfig_1.Config.Proxy.listenPort;
        // 遍历每个服务器信息并替换IP/端口
        for (let i = 0; i < serverCount && offset + 30 <= modified.length; i++) {
            // 服务器信息: onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4)
            const ipOffset = offset + 8; // 跳过 onlineID + userCnt
            const portOffset = offset + 24; // 跳过 onlineID + userCnt + ip
            // 读取原始IP和端口用于日志
            const originalIP = data.subarray(ipOffset, ipOffset + 16).toString('utf8').replace(/\0/g, '');
            const originalPort = data.readUInt16BE(portOffset);
            utils_1.Logger.Info(`[Proxy] 服务器[${i}] 原始: ${originalIP}:${originalPort} -> 替换为: ${proxyIP}:${proxyPort}`);
            // 替换IP
            proxyIPBuffer.copy(modified, ipOffset);
            // 替换端口
            modified.writeUInt16BE(proxyPort, portOffset);
            offset += 30; // 移动到下一个服务器信息
        }
        return modified;
    }
    /**
     * 解析并捕获数据包
     */
    ParseAndCapture(buffer, data, direction) {
        buffer = Buffer.concat([buffer, data]);
        while (buffer.length >= 4) {
            const packetLength = buffer.readUInt32BE(0);
            // 检查包长度是否合法
            if (packetLength < this._headLength || packetLength > 8388608) {
                // 可能是策略文件请求
                if (buffer.toString('utf8', 0, Math.min(23, buffer.length)).startsWith('<policy-file-request/>')) {
                    const endIndex = buffer.indexOf(0);
                    if (endIndex > 0) {
                        buffer = buffer.subarray(endIndex + 1);
                        continue;
                    }
                }
                // 跳过无效数据
                buffer = Buffer.alloc(0);
                break;
            }
            // 数据不完整
            if (buffer.length < packetLength)
                break;
            // 提取完整数据包
            const packet = buffer.subarray(0, packetLength);
            buffer = buffer.subarray(packetLength);
            // 解析数据包
            this.CapturePacket(packet, direction);
        }
        return buffer;
    }
    /**
     * 捕获单个数据包
     */
    CapturePacket(packet, direction) {
        const head = protocol_1.HeadInfo.Parse(packet, this._version);
        if (!head)
            return;
        const body = packet.subarray(this._headLength);
        const cmdName = (0, protocol_1.GetCommandName)(head.CmdID);
        const meta = protocol_1.CmdMeta.Get(head.CmdID);
        // 使用 CommandMetaRegistry 解析字段
        const isRequest = direction === 'C2S';
        const bodyStr = protocol_1.CmdMeta.ParseBody(head.CmdID, body, isRequest);
        const formatString = protocol_1.CmdMeta.GetFormatString(head.CmdID, isRequest);
        // 将解析后的字符串转换为字段数组（用于兼容现有接口）
        const fields = this.ParseBodyStringToFields(bodyStr);
        const captured = {
            id: ++this._packetID,
            timestamp: Date.now(),
            direction,
            cmdID: head.CmdID,
            cmdName,
            cmdDesc: meta?.desc || '',
            userID: head.UserID,
            result: head.Result,
            bodyLength: body.length,
            bodyHex: body.toString('hex'),
            fields,
            rawHex: packet.toString('hex'),
            formatString
        };
        this._capturedPackets.push(captured);
        // 限制存储数量
        if (this._capturedPackets.length > 10000) {
            this._capturedPackets.shift();
        }
        // 写入日志文件
        this._packetLogger.LogPacket(captured);
        // 通知 WebServer 推送更新
        this._webServer.BroadcastPacket(captured);
        // 日志输出
        const arrow = direction === 'C2S' ? '>>>' : '<<<';
        utils_1.Logger.Info(`[Proxy] ${arrow} ${cmdName}(${head.CmdID}) ${meta?.desc || ''} | UserID=${head.UserID} | BodyLen=${body.length}`);
        // 输出解析后的字段
        if (bodyStr && bodyStr !== '(空)') {
            utils_1.Logger.Info(`[Proxy]     字段: ${bodyStr}`);
            // 如果是PEOPLE_WALK，额外输出原始body hex用于调试
            if (head.CmdID === 2101) {
                utils_1.Logger.Info(`[Proxy]     原始Body Hex: ${body.toString('hex')}`);
            }
        }
        // 输出格式字符串
        if (formatString && formatString !== '(未定义)' && formatString !== '(空)') {
            utils_1.Logger.Info(`[Proxy]     格式: ${formatString}`);
        }
    }
    /**
     * 将解析后的字符串转换为字段数组
     * 例如: "field1=123, field2="abc"" => [{name: "field1", value: "123", desc: ""}, ...]
     */
    ParseBodyStringToFields(bodyStr) {
        if (!bodyStr || bodyStr === '(空)' || bodyStr === '(未定义)') {
            return [];
        }
        const fields = [];
        // 改进的字段解析：处理包含逗号的值（如数组、对象等）
        let bracketDepth = 0;
        let inQuotes = false;
        let fieldStart = 0;
        for (let i = 0; i < bodyStr.length; i++) {
            const char = bodyStr[i];
            // 跟踪引号状态
            if (char === '"' && (i === 0 || bodyStr[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
            }
            // 跟踪括号深度（用于数组和对象）
            if (!inQuotes) {
                if (char === '[' || char === '{') {
                    bracketDepth++;
                }
                else if (char === ']' || char === '}') {
                    bracketDepth--;
                }
            }
            // 只在不在引号内、括号深度为0时，逗号才是分隔符
            if (char === ',' && !inQuotes && bracketDepth === 0) {
                const part = bodyStr.substring(fieldStart, i).trim();
                if (part) {
                    const eqIndex = part.indexOf('=');
                    if (eqIndex > 0) {
                        const name = part.substring(0, eqIndex);
                        const value = part.substring(eqIndex + 1);
                        fields.push({ name, value, desc: '' });
                    }
                }
                fieldStart = i + 1;
            }
        }
        // 处理最后一个字段
        const lastPart = bodyStr.substring(fieldStart).trim();
        if (lastPart) {
            const eqIndex = lastPart.indexOf('=');
            if (eqIndex > 0) {
                const name = lastPart.substring(0, eqIndex);
                const value = lastPart.substring(eqIndex + 1);
                fields.push({ name, value, desc: '' });
            }
        }
        return fields;
    }
    /**
     * 获取所有捕获的数据包
     */
    GetCapturedPackets() {
        return this._capturedPackets;
    }
    /**
     * 清空捕获的数据包
     */
    ClearPackets() {
        this._capturedPackets = [];
        this._packetID = 0;
    }
    /**
     * 启动服务器
     */
    Start() {
        if (this._running)
            return;
        this._server.listen(ServerConfig_1.Config.Proxy.listenPort, ServerConfig_1.Config.Proxy.listenHost, () => {
            this._running = true;
            utils_1.Logger.Info(`[ProxyServer] 代理启动 ${ServerConfig_1.Config.Proxy.listenHost}:${ServerConfig_1.Config.Proxy.listenPort}`);
            utils_1.Logger.Info(`[ProxyServer] 登录服务器: ${ServerConfig_1.Config.Proxy.loginServer.host}:${ServerConfig_1.Config.Proxy.loginServer.port}`);
            utils_1.Logger.Info(`[ProxyServer] 游戏服务器: ${ServerConfig_1.Config.Proxy.gameServer.host}:${ServerConfig_1.Config.Proxy.gameServer.port}`);
            utils_1.Logger.Info(`[ProxyServer] 日志文件: ${this._packetLogger.CurrentLogFile}`);
        });
        this._webServer.Start();
    }
    /**
     * 停止服务器
     */
    async Stop() {
        if (!this._running)
            return;
        utils_1.Logger.Info('[ProxyServer] 正在停止服务器...');
        // 先停止 WebServer
        await this._webServer.Stop();
        // 关闭网络服务（使用Promise等待）
        await new Promise((resolve) => {
            this._server.close(() => {
                this._running = false;
                utils_1.Logger.Info('[ProxyServer] 网络服务已关闭');
                resolve();
            });
            // 设置超时，防止卡住
            setTimeout(() => {
                utils_1.Logger.Warn('[ProxyServer] 关闭网络服务超时，强制继续');
                this._running = false;
                resolve();
            }, 5000);
        });
        utils_1.Logger.Info('[ProxyServer] 已停止');
    }
    /**
     * 是否正在运行
     */
    get IsRunning() {
        return this._running;
    }
}
exports.ProxyServer = ProxyServer;
//# sourceMappingURL=ProxyServer.js.map