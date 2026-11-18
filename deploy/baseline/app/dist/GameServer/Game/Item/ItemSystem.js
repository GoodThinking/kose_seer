"use strict";
/**
 * 物品系统
 * 负责物品配置的读取和物品相关的逻辑处理
 *
 * 移植自: luvit/luvit_version/game/seer_items.lua
 *
 * 功能：
 * - 物品配置读取
 * - 物品信息查询
 * - 物品分类管理
 * - 物品属性获取
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemSystem = exports.ItemTradability = exports.ItemCategory = void 0;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const utils_1 = require("../../../shared/utils");
/**
 * 物品分类枚举
 */
var ItemCategory;
(function (ItemCategory) {
    ItemCategory[ItemCategory["MEDICINE"] = 1] = "MEDICINE";
    ItemCategory[ItemCategory["CAPTURE"] = 2] = "CAPTURE";
    ItemCategory[ItemCategory["EQUIPMENT"] = 3] = "EQUIPMENT";
    ItemCategory[ItemCategory["CLOTH_HEAD"] = 4] = "CLOTH_HEAD";
    ItemCategory[ItemCategory["CLOTH_BODY"] = 5] = "CLOTH_BODY";
    ItemCategory[ItemCategory["CLOTH_FOOT"] = 6] = "CLOTH_FOOT";
    ItemCategory[ItemCategory["CLOTH_WAIST"] = 7] = "CLOTH_WAIST";
    ItemCategory[ItemCategory["CLOTH_HAND"] = 8] = "CLOTH_HAND";
    ItemCategory[ItemCategory["CLOTH_EYE"] = 9] = "CLOTH_EYE";
    ItemCategory[ItemCategory["CLOTH_BACK"] = 10] = "CLOTH_BACK";
    ItemCategory[ItemCategory["MATERIAL"] = 11] = "MATERIAL";
    ItemCategory[ItemCategory["GIFT"] = 12] = "GIFT";
    ItemCategory[ItemCategory["SPECIAL"] = 13] = "SPECIAL"; // 特殊物品
})(ItemCategory || (exports.ItemCategory = ItemCategory = {}));
/**
 * 物品可交易性枚举
 */
var ItemTradability;
(function (ItemTradability) {
    ItemTradability[ItemTradability["NOT_TRADABLE"] = 0] = "NOT_TRADABLE";
    ItemTradability[ItemTradability["TRADABLE"] = 1] = "TRADABLE";
    ItemTradability[ItemTradability["SELLABLE"] = 2] = "SELLABLE";
    ItemTradability[ItemTradability["FULL"] = 3] = "FULL"; // 完全可交易（可交易+可出售）
})(ItemTradability || (exports.ItemTradability = ItemTradability = {}));
/**
 * 物品系统类
 */
class ItemSystem {
    /**
     * 物品缓存
     * itemId -> IItemInfo
     */
    static itemCache = null;
    /**
     * 分类缓存
     * catId -> itemIds[]
     */
    static categoryCache = null;
    /**
     * 唯一物品ID集合
     */
    static uniqueItemIds = null;
    /**
     * 唯一物品范围列表
     */
    static uniqueRanges = null;
    /**
     * 加载物品数据
     */
    static LoadItemData() {
        if (this.itemCache && this.categoryCache) {
            return;
        }
        try {
            const itemConfig = GameConfig_1.GameConfig.GetItemConfig();
            if (!itemConfig || !itemConfig.Items) {
                utils_1.Logger.Warn('[ItemSystem] 物品配置未加载');
                this.itemCache = new Map();
                this.categoryCache = new Map();
                return;
            }
            this.itemCache = new Map();
            this.categoryCache = new Map();
            const categories = itemConfig.Items.Cat;
            if (!categories) {
                return;
            }
            const catArray = Array.isArray(categories) ? categories : [categories];
            for (const cat of catArray) {
                const catId = cat.ID;
                const items = cat.Item;
                if (!items) {
                    continue;
                }
                const itemArray = Array.isArray(items) ? items : [items];
                const itemIds = [];
                for (const item of itemArray) {
                    const itemId = item.ID;
                    // 构建扩展的物品信息
                    const itemInfo = {
                        ...item,
                        catId: catId,
                        isVipOnly: (item.VipOnly || 0) === 1,
                        tradability: item.Tradability || 3,
                        vipTradability: item.VipTradability || 3
                    };
                    this.itemCache.set(itemId, itemInfo);
                    itemIds.push(itemId);
                }
                this.categoryCache.set(catId, itemIds);
            }
            utils_1.Logger.Info(`[ItemSystem] 加载物品数据完成: ${this.itemCache.size} 个物品, ${this.categoryCache.size} 个分类`);
        }
        catch (error) {
            utils_1.Logger.Error('[ItemSystem] 加载物品数据失败', error);
            this.itemCache = new Map();
            this.categoryCache = new Map();
        }
    }
    /**
     * 加载唯一物品配置
     */
    static LoadUniqueItemsConfig() {
        if (this.uniqueItemIds && this.uniqueRanges) {
            return;
        }
        try {
            const config = GameConfig_1.GameConfig.GetUniqueItemsConfig();
            if (!config) {
                utils_1.Logger.Warn('[ItemSystem] 唯一物品配置未加载，使用默认规则');
                this.uniqueItemIds = new Set();
                this.uniqueRanges = [];
                return;
            }
            // 加载唯一物品ID列表
            this.uniqueItemIds = new Set(config.uniqueItemIds || []);
            // 加载唯一物品范围
            this.uniqueRanges = [];
            if (config.uniqueRanges) {
                for (const range of config.uniqueRanges) {
                    this.uniqueRanges.push({
                        start: range.start,
                        end: range.end
                    });
                }
            }
            utils_1.Logger.Info(`[ItemSystem] 加载唯一物品配置完成: ${this.uniqueItemIds.size} 个唯一物品ID, ${this.uniqueRanges.length} 个范围`);
        }
        catch (error) {
            utils_1.Logger.Error('[ItemSystem] 加载唯一物品配置失败', error);
            this.uniqueItemIds = new Set();
            this.uniqueRanges = [];
        }
    }
    // ==================== 物品查询 ====================
    /**
     * 获取物品信息
     *
     * @param itemId 物品ID
     * @returns 物品信息，不存在返回null
     */
    static GetItem(itemId) {
        this.LoadItemData();
        return this.itemCache?.get(itemId) || null;
    }
    /**
     * 检查物品是否存在
     *
     * @param itemId 物品ID
     * @returns 是否存在
     */
    static Exists(itemId) {
        this.LoadItemData();
        return this.itemCache?.has(itemId) || false;
    }
    /**
     * 获取物品名称
     *
     * @param itemId 物品ID
     * @returns 物品名称
     */
    static GetName(itemId) {
        const item = this.GetItem(itemId);
        return item?.Name || `Item${itemId}`;
    }
    /**
     * 获取物品价格
     *
     * @param itemId 物品ID
     * @returns 价格
     */
    static GetPrice(itemId) {
        const item = this.GetItem(itemId);
        return item?.Price || 0;
    }
    /**
     * 获取物品出售价格
     *
     * @param itemId 物品ID
     * @returns 出售价格
     */
    static GetSellPrice(itemId) {
        const item = this.GetItem(itemId);
        return item?.SellPrice || 0;
    }
    /**
     * 获取物品最大堆叠数量
     *
     * @param itemId 物品ID
     * @returns 最大堆叠数量（0或未设置表示99999）
     */
    static GetMaxStack(itemId) {
        const item = this.GetItem(itemId);
        if (!item) {
            return 99999;
        }
        // 如果 max 为 0 或 undefined，返回默认值 99999
        if (!item.Max || item.Max === 0) {
            return 99999;
        }
        return item.Max;
    }
    /**
     * 获取物品分类ID
     *
     * @param itemId 物品ID
     * @returns 分类ID
     */
    static GetCategoryId(itemId) {
        const item = this.GetItem(itemId);
        return item?.catId || 0;
    }
    // ==================== 分类查询 ====================
    /**
     * 获取指定分类的所有物品ID
     *
     * @param catId 分类ID
     * @returns 物品ID数组
     */
    static GetItemsByCategory(catId) {
        this.LoadItemData();
        return this.categoryCache?.get(catId) || [];
    }
    /**
     * 获取所有物品ID
     *
     * @returns 物品ID数组
     */
    static GetAllItemIds() {
        this.LoadItemData();
        return Array.from(this.itemCache?.keys() || []);
    }
    /**
     * 获取所有分类ID
     *
     * @returns 分类ID数组
     */
    static GetAllCategoryIds() {
        this.LoadItemData();
        return Array.from(this.categoryCache?.keys() || []);
    }
    // ==================== 物品属性判断 ====================
    /**
     * 检查物品是否为VIP专属
     *
     * @param itemId 物品ID
     * @returns 是否VIP专属
     */
    static IsVipOnly(itemId) {
        const item = this.GetItem(itemId);
        return item?.isVipOnly || false;
    }
    /**
     * 检查物品是否可交易
     *
     * @param itemId 物品ID
     * @param isVip 是否VIP（默认false）
     * @returns 是否可交易
     */
    static IsTradable(itemId, isVip = false) {
        const item = this.GetItem(itemId);
        if (!item) {
            return false;
        }
        const tradability = isVip ? item.vipTradability : item.tradability;
        return tradability === ItemTradability.TRADABLE || tradability === ItemTradability.FULL;
    }
    /**
     * 检查物品是否可出售
     *
     * @param itemId 物品ID
     * @param isVip 是否VIP（默认false）
     * @returns 是否可出售
     */
    static IsSellable(itemId, isVip = false) {
        const item = this.GetItem(itemId);
        if (!item) {
            return false;
        }
        const tradability = isVip ? item.vipTradability : item.tradability;
        return tradability === ItemTradability.SELLABLE || tradability === ItemTradability.FULL;
    }
    /**
     * 检查物品是否为服装
     *
     * @param itemId 物品ID
     * @returns 是否为服装
     */
    static IsCloth(itemId) {
        const catId = this.GetCategoryId(itemId);
        return catId >= ItemCategory.CLOTH_HEAD && catId <= ItemCategory.CLOTH_BACK;
    }
    /**
     * 检查物品是否为装备
     *
     * @param itemId 物品ID
     * @returns 是否为装备
     */
    static IsEquipment(itemId) {
        const catId = this.GetCategoryId(itemId);
        return catId === ItemCategory.EQUIPMENT;
    }
    /**
     * 检查物品是否为药品
     *
     * @param itemId 物品ID
     * @returns 是否为药品
     */
    static IsMedicine(itemId) {
        const catId = this.GetCategoryId(itemId);
        return catId === ItemCategory.MEDICINE;
    }
    /**
     * 检查物品是否为捕捉道具
     *
     * @param itemId 物品ID
     * @returns 是否为捕捉道具
     */
    static IsCaptureItem(itemId) {
        const catId = this.GetCategoryId(itemId);
        return catId === ItemCategory.CAPTURE;
    }
    // ==================== 装备属性 ====================
    /**
     * 获取装备的属性加成
     *
     * @param itemId 物品ID
     * @returns 属性加成对象
     */
    static GetEquipmentStats(itemId) {
        const item = this.GetItem(itemId);
        if (!item) {
            return { hp: 0, atk: 0, def: 0 };
        }
        return {
            hp: item.PkHp || 0,
            atk: item.PkAtk || 0,
            def: item.PkDef || 0
        };
    }
    // ==================== 物品使用 ====================
    /**
     * 检查物品是否可使用
     *
     * @param itemId 物品ID
     * @returns 是否可使用
     */
    static IsUsable(itemId) {
        const item = this.GetItem(itemId);
        if (!item) {
            return false;
        }
        // 药品和捕捉道具可使用
        return this.IsMedicine(itemId) || this.IsCaptureItem(itemId);
    }
    /**
     * 获取物品的功能ID
     *
     * @param itemId 物品ID
     * @returns 功能ID
     */
    static GetFunctionId(itemId) {
        const item = this.GetItem(itemId);
        // Fun 字段可能不存在，返回0
        return item?.Fun || 0;
    }
    // ==================== 统计信息 ====================
    /**
     * 获取物品系统统计信息
     *
     * @returns 统计信息
     */
    static GetStats() {
        this.LoadItemData();
        let vipOnlyCount = 0;
        let tradableCount = 0;
        for (const item of this.itemCache?.values() || []) {
            if (item.isVipOnly) {
                vipOnlyCount++;
            }
            if (item.tradability === ItemTradability.TRADABLE || item.tradability === ItemTradability.FULL) {
                tradableCount++;
            }
        }
        return {
            totalItems: this.itemCache?.size || 0,
            totalCategories: this.categoryCache?.size || 0,
            vipOnlyItems: vipOnlyCount,
            tradableItems: tradableCount
        };
    }
    /**
     * 打印物品系统信息（调试用）
     */
    static PrintStats() {
        const stats = this.GetStats();
        utils_1.Logger.Info('========== 物品系统统计 ==========');
        utils_1.Logger.Info(`总物品数: ${stats.totalItems}`);
        utils_1.Logger.Info(`总分类数: ${stats.totalCategories}`);
        utils_1.Logger.Info(`VIP专属物品: ${stats.vipOnlyItems}`);
        utils_1.Logger.Info(`可交易物品: ${stats.tradableItems}`);
        utils_1.Logger.Info('====================================');
    }
    // ==================== 物品ID范围判断 ====================
    /**
     * 根据物品ID判断物品类型（快速判断）
     *
     * 常见ID范围：
     * - 100001-191001: 服装
     * - 300001-399999: 药品
     * - 400001-499999: 捕捉道具
     *
     * @param itemId 物品ID
     * @returns 物品类型描述
     */
    static GetItemTypeByIdRange(itemId) {
        if (itemId >= 100001 && itemId <= 191001) {
            return '服装';
        }
        else if (itemId >= 300001 && itemId <= 399999) {
            return '药品';
        }
        else if (itemId >= 400001 && itemId <= 499999) {
            return '捕捉道具';
        }
        else if (itemId >= 500001 && itemId <= 599999) {
            return '装备';
        }
        else {
            return '其他';
        }
    }
    /**
     * 检查物品是否为唯一物品（不可重复拥有）
     *
     * 从配置文件读取唯一物品列表和范围
     *
     * @param itemId 物品ID
     * @returns 是否唯一
     */
    static IsUniqueItem(itemId) {
        this.LoadUniqueItemsConfig();
        // 检查是否在唯一物品ID列表中
        if (this.uniqueItemIds?.has(itemId)) {
            return true;
        }
        // 检查是否在唯一物品范围内
        if (this.uniqueRanges) {
            for (const range of this.uniqueRanges) {
                if (itemId >= range.start && itemId <= range.end) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 添加唯一物品ID（运行时动态添加）
     *
     * @param itemId 物品ID
     */
    static AddUniqueItem(itemId) {
        this.LoadUniqueItemsConfig();
        this.uniqueItemIds?.add(itemId);
        utils_1.Logger.Info(`[ItemSystem] 添加唯一物品: ${itemId}`);
    }
    /**
     * 移除唯一物品ID（运行时动态移除）
     *
     * @param itemId 物品ID
     */
    static RemoveUniqueItem(itemId) {
        this.LoadUniqueItemsConfig();
        this.uniqueItemIds?.delete(itemId);
        utils_1.Logger.Info(`[ItemSystem] 移除唯一物品: ${itemId}`);
    }
    /**
     * 添加唯一物品范围（运行时动态添加）
     *
     * @param start 起始ID
     * @param end 结束ID
     */
    static AddUniqueRange(start, end) {
        this.LoadUniqueItemsConfig();
        this.uniqueRanges?.push({ start, end });
        utils_1.Logger.Info(`[ItemSystem] 添加唯一物品范围: ${start}-${end}`);
    }
    /**
     * 获取所有唯一物品ID
     *
     * @returns 唯一物品ID数组
     */
    static GetAllUniqueItemIds() {
        this.LoadUniqueItemsConfig();
        return Array.from(this.uniqueItemIds || []);
    }
    /**
     * 获取所有唯一物品范围
     *
     * @returns 唯一物品范围数组
     */
    static GetAllUniqueRanges() {
        this.LoadUniqueItemsConfig();
        return [...(this.uniqueRanges || [])];
    }
}
exports.ItemSystem = ItemSystem;
//# sourceMappingURL=ItemSystem.js.map