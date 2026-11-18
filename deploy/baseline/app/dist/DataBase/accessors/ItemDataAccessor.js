"use strict";
/**
 * ItemData 访问器
 * 提供 ItemData 的便捷访问接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemDataAccessor = void 0;
const DataLoader_1 = require("../loaders/DataLoader");
const DataSaver_1 = require("../savers/DataSaver");
/**
 * ItemData 访问器
 */
class ItemDataAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!ItemDataAccessor._instance) {
            ItemDataAccessor._instance = new ItemDataAccessor();
        }
        return ItemDataAccessor._instance;
    }
    /**
     * 获取或创建 ItemData
     */
    async GetOrCreate(uid) {
        return DataLoader_1.DataLoader.Instance.GetOrCreate('item', uid);
    }
    /**
     * 获取 ItemData（不创建）
     */
    Get(uid) {
        return DataLoader_1.DataLoader.Instance.Get('item', uid);
    }
    /**
     * 保存 ItemData
     */
    async Save(data, throwOnError = false) {
        return DataSaver_1.DataSaver.Instance.Save('item', data, throwOnError);
    }
}
exports.ItemDataAccessor = ItemDataAccessor;
//# sourceMappingURL=ItemDataAccessor.js.map