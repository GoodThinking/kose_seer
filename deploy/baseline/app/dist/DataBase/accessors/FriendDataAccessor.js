"use strict";
/**
 * FriendData 访问器
 * 提供 FriendData 的便捷访问接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendDataAccessor = void 0;
const DataLoader_1 = require("../loaders/DataLoader");
const DataSaver_1 = require("../savers/DataSaver");
/**
 * FriendData 访问器
 */
class FriendDataAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!FriendDataAccessor._instance) {
            FriendDataAccessor._instance = new FriendDataAccessor();
        }
        return FriendDataAccessor._instance;
    }
    /**
     * 获取或创建 FriendData
     */
    async GetOrCreate(uid) {
        return DataLoader_1.DataLoader.Instance.GetOrCreate('friend', uid);
    }
    /**
     * 获取 FriendData（不创建）
     */
    Get(uid) {
        return DataLoader_1.DataLoader.Instance.Get('friend', uid);
    }
    /**
     * 保存 FriendData
     */
    async Save(data) {
        return DataSaver_1.DataSaver.Instance.Save('friend', data);
    }
}
exports.FriendDataAccessor = FriendDataAccessor;
//# sourceMappingURL=FriendDataAccessor.js.map