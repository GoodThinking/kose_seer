"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// 基础类
__exportStar(require("./base/BaseProto"), exports);
// 通用Proto
__exportStar(require("./common/PlayerInfoProto"), exports);
__exportStar(require("./common/ClothInfoProto"), exports);
// 登录相关Proto - 请求
__exportStar(require("./packets/req/login/MainLoginReqProto"), exports);
__exportStar(require("./packets/req/login/LoginReqProto"), exports);
__exportStar(require("./packets/req/login/CreateRoleReqProto"), exports);
__exportStar(require("./packets/req/login/RegisterReqProto"), exports);
__exportStar(require("./packets/req/login/SendEmailCodeReqProto"), exports);
__exportStar(require("./packets/req/login/RequestRegisterReqProto"), exports);
// 登录相关Proto - 响应
__exportStar(require("./packets/rsp/login/MainLoginRspProto"), exports);
__exportStar(require("./packets/rsp/login/LoginRspProto"), exports);
__exportStar(require("./packets/rsp/login/CreateRoleRspProto"), exports);
__exportStar(require("./packets/rsp/login/RegisterRspProto"), exports);
__exportStar(require("./packets/rsp/login/SendEmailCodeRspProto"), exports);
__exportStar(require("./packets/rsp/login/RequestRegisterRspProto"), exports);
// 服务器相关Proto - 响应
__exportStar(require("./packets/rsp/server/CommendOnlineRspProto"), exports);
__exportStar(require("./packets/rsp/server/RangeOnlineRspProto"), exports);
// 系统相关Proto - 响应
__exportStar(require("./packets/rsp/system/GoldOnlineCheckRemainRspProto"), exports);
// 地图相关Proto - 响应
__exportStar(require("./packets/rsp/map/MapOgreListRspProto"), exports);
//# sourceMappingURL=index.js.map