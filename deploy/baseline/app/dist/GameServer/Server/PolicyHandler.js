"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyHandler = void 0;
const utils_1 = require("../../shared/utils");
// Flash Socket Policy 响应
const POLICY_RESPONSE = '<?xml version="1.0"?><!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd"><cross-domain-policy><allow-access-from domain="*" to-ports="*"/></cross-domain-policy>\0';
/**
 * Flash Socket Policy 处理器
 */
class PolicyHandler {
    /**
     * 检查并处理策略文件请求
     * @returns true 如果是策略请求并已处理，false 否则
     */
    static Handle(socket, data, address) {
        const dataStr = data.toString('utf8');
        if (dataStr.startsWith('<policy-file-request/>')) {
            utils_1.Logger.Info(`发送策略文件响应: ${address}`);
            socket.write(POLICY_RESPONSE);
            return true;
        }
        return false;
    }
}
exports.PolicyHandler = PolicyHandler;
//# sourceMappingURL=PolicyHandler.js.map