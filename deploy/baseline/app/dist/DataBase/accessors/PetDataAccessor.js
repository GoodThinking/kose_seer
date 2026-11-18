"use strict";
/**
 * PetData 访问器
 * 提供 PetData 的便捷访问接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetDataAccessor = void 0;
const DataLoader_1 = require("../loaders/DataLoader");
const DataSaver_1 = require("../savers/DataSaver");
/**
 * PetData 访问器
 */
class PetDataAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!PetDataAccessor._instance) {
            PetDataAccessor._instance = new PetDataAccessor();
        }
        return PetDataAccessor._instance;
    }
    /**
     * 获取或创建 PetData
     */
    async GetOrCreate(uid) {
        return DataLoader_1.DataLoader.Instance.GetOrCreate('pet', uid);
    }
    /**
     * 获取 PetData（不创建）
     */
    Get(uid) {
        return DataLoader_1.DataLoader.Instance.Get('pet', uid);
    }
    /**
     * 保存 PetData
     */
    async Save(data, throwOnError = false) {
        return DataSaver_1.DataSaver.Instance.Save('pet', data, throwOnError);
    }
}
exports.PetDataAccessor = PetDataAccessor;
//# sourceMappingURL=PetDataAccessor.js.map