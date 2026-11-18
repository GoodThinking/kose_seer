"use strict";
/**
 * MailData 访问器
 * 提供 MailData 的便捷访问接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailDataAccessor = void 0;
const DataLoader_1 = require("../loaders/DataLoader");
const DataSaver_1 = require("../savers/DataSaver");
/**
 * MailData 访问器
 */
class MailDataAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!MailDataAccessor._instance) {
            MailDataAccessor._instance = new MailDataAccessor();
        }
        return MailDataAccessor._instance;
    }
    /**
     * 获取或创建 MailData
     */
    async GetOrCreate(uid) {
        return DataLoader_1.DataLoader.Instance.GetOrCreate('mail', uid);
    }
    /**
     * 获取 MailData（不创建）
     */
    Get(uid) {
        return DataLoader_1.DataLoader.Instance.Get('mail', uid);
    }
    /**
     * 保存 MailData
     */
    async Save(data) {
        return DataSaver_1.DataSaver.Instance.Save('mail', data);
    }
}
exports.MailDataAccessor = MailDataAccessor;
//# sourceMappingURL=MailDataAccessor.js.map