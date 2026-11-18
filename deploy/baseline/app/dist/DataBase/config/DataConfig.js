"use strict";
/**
 * 数据配置
 * 定义每种数据类型的数据库映射配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataConfigRegistry = void 0;
const FriendData_1 = require("../models/FriendData");
const ItemData_1 = require("../models/ItemData");
const PetData_1 = require("../models/PetData");
const MailData_1 = require("../models/MailData");
const TaskData_1 = require("../models/TaskData");
/**
 * 数据配置注册表
 */
class DataConfigRegistry {
    static _instance;
    _configs = new Map();
    constructor() {
        this._initConfigs();
    }
    static get Instance() {
        if (!DataConfigRegistry._instance) {
            DataConfigRegistry._instance = new DataConfigRegistry();
        }
        return DataConfigRegistry._instance;
    }
    /**
     * 初始化所有数据配置
     */
    _initConfigs() {
        // FriendData 配置
        this._configs.set('friend', {
            tableName: 'player_friends',
            dataClass: FriendData_1.FriendData,
            toRow: (data) => data.ToRow(),
            getUid: (data) => data.Uid,
            saveFields: ['friend_list', 'black_list', 'send_apply_list', 'receive_apply_list', 'chat_history']
        });
        // ItemData 配置
        this._configs.set('item', {
            tableName: 'player_items',
            dataClass: ItemData_1.ItemData,
            toRow: (data) => data.ToRow(),
            getUid: (data) => data.Uid,
            saveFields: ['item_list']
        });
        // PetData 配置
        this._configs.set('pet', {
            tableName: 'player_pets',
            dataClass: PetData_1.PetData,
            toRow: (data) => data.ToRow(),
            getUid: (data) => data.Uid,
            saveFields: ['pet_list']
        });
        // MailData 配置
        this._configs.set('mail', {
            tableName: 'player_mails',
            dataClass: MailData_1.MailData,
            toRow: (data) => data.ToRow(),
            getUid: (data) => data.Uid,
            saveFields: ['mail_list']
        });
        // TaskData 配置
        this._configs.set('task', {
            tableName: 'player_tasks',
            dataClass: TaskData_1.TaskData,
            toRow: (data) => data.ToRow(),
            getUid: (data) => data.Uid,
            saveFields: ['task_list', 'task_buffers']
        });
    }
    /**
     * 获取数据配置
     */
    GetConfig(type) {
        const config = this._configs.get(type);
        if (!config) {
            throw new Error(`No config found for type: ${type}`);
        }
        return config;
    }
    /**
     * 注册新的数据配置
     */
    Register(type, config) {
        this._configs.set(type, config);
    }
    /**
     * 获取所有数据类型
     */
    GetAllTypes() {
        return Array.from(this._configs.keys());
    }
}
exports.DataConfigRegistry = DataConfigRegistry;
//# sourceMappingURL=DataConfig.js.map