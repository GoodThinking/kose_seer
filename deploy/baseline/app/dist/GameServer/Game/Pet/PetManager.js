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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetManager = void 0;
const PetPP_1 = require("./PetPP");
const { AdvancePetExperience } = require("./PetProgression");
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const Pet_1 = require("../../Server/Packet/Send/Pet");
const PacketEmpty_1 = require("../../Server/Packet/Send/PacketEmpty");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const PetModel_1 = require("../../../shared/models/PetModel");
const PetInfoProto_1 = require("../../../shared/proto/common/PetInfoProto");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const PlayerRepository_1 = require("../../../DataBase/repositories/Player/PlayerRepository");
const PacketPetSetExp_1 = require("../../Server/Packet/Send/Pet/PacketPetSetExp");
const PacketPetGetExp_1 = require("../../Server/Packet/Send/Pet/PacketPetGetExp");

const PacketNoteUpdateProp_1 = require("../../Server/Packet/Send/Pet/PacketNoteUpdateProp");
const PacketNoteUpdateSkill_1 = require("../../Server/Packet/Send/Pet/PacketNoteUpdateSkill");
const SptSystem_1 = require("./SptSystem");
const PetCalculator_1 = require("./PetCalculator");
const PetExperienceProjection_1 = require("./PetExperienceProjection");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const PacketPetOneCure_1 = require("../../Server/Packet/Send/Pet/PacketPetOneCure");
const PacketGetPetSkill_1 = require("../../Server/Packet/Send/Pet/PacketGetPetSkill");
const PacketPetRoomList_1 = require("../../Server/Packet/Send/Pet/PacketPetRoomList");
const PacketSkillSort_1 = require("../../Server/Packet/Send/Pet/PacketSkillSort");
const EventTypes_1 = require("../Event/EventTypes");
/**
 * 精灵管理器
 * 处理精灵相关的所有逻辑：获取精灵信息、精灵列表、治疗、展示等
 *
 * 架构说明：
 * - 持有 PetData 对象，直接操作数据
 * - 使用 DatabaseHelper 实时保存数据
 */
/** 学习力训练室定向加点：单项不超过 255、总和不超过 510，截断部分不转移。 */
function ApplyTrainingRoomEV(pet, fixedEv) {
    const fields = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];
    if (!fields.includes(fixedEv.field) || !Number.isSafeInteger(fixedEv.amount) || fixedEv.amount < 1)
        throw new Error('Invalid training room EV');
    const total = fields.reduce((sum, field) => sum + pet[field], 0);
    if (fields.some(field => !Number.isInteger(pet[field]) || pet[field] < 0 || pet[field] > 255) || total > 510)
        throw new Error('Invalid pet EV state');
    const gain = Math.min(fixedEv.amount, 255 - pet[fixedEv.field], 510 - total);
    pet[fixedEv.field] += gain;
    return gain > 0;
}
class PetManager extends BaseManager_1.BaseManager {
    /** 精灵数据*/
    PetData;
    constructor(player) {
        super(player);
    }
    /**
     * 初始化（加载数据�?
     */
    async Initialize() {
        this.PetData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(this.UserID);
    // Legacy saves may contain enough level-local experience for several levels.
    // Keep login packets quiet and publish each pet only after strict persistence.
    const release = await this.PetData.AcquireMutation();
    try {
      if (this.PetData.PetList.length > 0 && !this.PetData.PetList.some(p => p.isInBag)) {
        const candidate = JSON.parse(JSON.stringify(this.PetData.PetList[0]));
        candidate.isInBag = true;
        candidate.isDefault = true;
        await this.PetData.CommitPetUpdate(this.PetData.PetList[0], candidate);
      } else if (this.PetData.PetList.some(p => p.isInBag) && !this.PetData.PetList.some(p => p.isInBag && p.isDefault)) {
        const firstBag = this.PetData.PetList.find(p => p.isInBag);
        const candidate = JSON.parse(JSON.stringify(firstBag));
        candidate.isDefault = true;
        await this.PetData.CommitPetUpdate(firstBag, candidate);
      }
      for (const pet of this.PetData.PetList) {
        if (pet.level >= 100) continue;
        const requiredExp = PetCalculator_1.PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId) - PetCalculator_1.PetCalculator.CalculateExpForLevel(pet.level, pet.petId);
        if (requiredExp <= 0 || pet.exp < requiredExp) continue;
        const candidate = JSON.parse(JSON.stringify(pet));
        const result = AdvancePetExperience(candidate);
        const newSkills = [...new Set(result.newSkills)].filter(id => !candidate.skillArray.includes(id));
        candidate.skillArray.push(...newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length)));
        candidate.hp = candidate.maxHp;
        candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate, true);
        await this.PetData.CommitPetUpdate(pet, candidate);
      }
    } finally {
      release();
    }

        utils_1.Logger.Debug(`[PetManager] 初始化完�? UserID=${this.UserID}, Pets=${this.PetData.PetList.length}`);
    }
    /**
     * 获取精灵缺失的技能（应该学会但还没学会的）
     * @param pet 精灵信息
     * @returns 缺失的技能ID列表
     */
    GetMissingSkills(pet) {
        // 获取当前等级应该学会的所有技能
        const shouldHaveSkills = SptSystem_1.SptSystem.GetLearnableMovesByLevel(pet.petId, pet.level);
        // 过滤出还没学会的技能
        const missingSkills = [];
        for (const skill of shouldHaveSkills) {
            if (!pet.skillArray.includes(skill.id)) {
                missingSkills.push(skill.id);
            }
        }
        return missingSkills;
    }
    /**
     * 处理获取精灵列表（返回所有精灵的简化信息，用于填充 _storageMap）
     * 客户端期望的格式：PetListInfo (id, catchTime, skinID)
     * 排序规则：首发精灵第一个，其他按 catchTime 升序排列
     */
    async HandleGetPetList() {
        // 获取所有精灵（背包+仓库）
        const allPets = this.PetData.PetList;
        // 排序：首发精灵第一个，其他按 catchTime 升序
        const sortedPets = [...allPets].sort((a, b) => {
            // 首发精灵排在最前面
            if (a.isDefault && !b.isDefault)
                return -1;
            if (!a.isDefault && b.isDefault)
                return 1;
            // 其他精灵按 catchTime 升序排列（越早获得越靠前）
            return a.catchTime - b.catchTime;
        });
        if (this.Player.ClientProtocol === 'xin-20261013') {
            await this.Player.SendPacket(new Pet_1.PacketGetPetList(this.GetPetProtoList(sortedPets), this.Player.ClientProtocol));
            return;
        }
        // 转换为 PetListInfo 格式（简化版：id, catchTime, skinID）
        const petListInfos = sortedPets.map(pet => ({
            id: pet.petId,
            catchTime: pet.catchTime,
            skinID: pet.skinId || 0
        }));
        await this.Player.SendPacket(new PacketPetRoomList_1.PacketPetRoomList(petListInfos, CommandID_1.CommandID.GET_PET_LIST));
        utils_1.Logger.Info(`[PetManager] 获取精灵列表（所有精灵）: UserID=${this.UserID}, Count=${petListInfos.length}`);
    }
    /**
     * 处理获取精灵仓库列表
     * 排序规则：按 catchTime 升序排列（越早获得越靠前）
     */
    async HandleGetPetRoomList(roomType) {
        if (this.Player.ClientProtocol === 'kose') {
            // Fixed Nieo 2324 requests the room owner's UID, not a storage type.
            let pets = this.PetData.PetList;
            if (roomType !== this.UserID) {
                const rows = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [roomType]);
                pets = rows[0]?.pet_list ? JSON.parse(rows[0].pet_list) : [];
            }
            const shown = pets.filter(pet => pet.isRoomShow === true && !pet.isInBag)
                .sort((a, b) => a.catchTime - b.catchTime).slice(0, 5);
            await this.Player.SendPacket(new PacketPetRoomList_1.PacketPetRoomList(shown.map(pet => ({
                id: pet.petId, catchTime: pet.catchTime, skinID: pet.skinId || 0,
            }))));
            return;
        }
        const storagePets = this.PetData.GetPetsInStorage();
        // 排序：按 catchTime 升序
        const sortedPets = [...storagePets].sort((a, b) => a.catchTime - b.catchTime);
        // 转换为 PetListInfo 格式（简化版）
        const petList = sortedPets.map(pet => ({
            id: pet.petId,
            catchTime: pet.catchTime,
            skinID: pet.skinId || 0
        }));
        await this.Player.SendPacket(new PacketPetRoomList_1.PacketPetRoomList(petList));
        utils_1.Logger.Info(`[PetManager] 获取精灵仓库列表: UserID=${this.UserID}, RoomType=${roomType}, Count=${petList.length}`);
    }
    async HandlePetRoomShow(body) {
        const command = CommandID_1.CommandID.PET_ROOM_SHOW;
        if (this.Player.ClientProtocol !== 'kose' || body.length < 4) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(command).setResult(5001));
            return;
        }
        const count = body.readUInt32BE(0);
        if (count > 5 || body.length !== 4 + count * 8) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(command).setResult(5001));
            return;
        }
        const release = await this.PetData.AcquireMutation();
        try {
            const selected = new Set();
            for (let i = 0; i < count; i++) {
                const catchTime = body.readUInt32BE(4 + i * 8);
                const pet = this.PetData.GetPetByCatchTime(catchTime);
                if (!pet || pet.isInBag || pet.petId !== body.readUInt32BE(8 + i * 8) || selected.has(catchTime)) {
                    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(command).setResult(5001));
                    return;
                }
                selected.add(catchTime);
            }
            await this.PetData.CommitRoomDisplay(selected);
            const shown = this.PetData.GetPetsInStorage().filter(pet => pet.isRoomShow);
            await this.Player.SendPacket(new PacketPetRoomList_1.PacketPetRoomList(shown.map(pet => ({
                id: pet.petId, catchTime: pet.catchTime, skinID: pet.skinId || 0,
            })), command));
        }
        catch (error) {
            utils_1.Logger.Error('[PetManager] 基地展示名单保存失败', error);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(command).setResult(5000));
        }
        finally {
            release();
        }
    }
    /**
     * 主动推送精灵列表更新（用于GM发送精灵、捕捉精灵等场景）
     * @param includeStorage 是否包含仓库精灵（默认false，只推送背包）
     * @deprecated 不推荐使用，客户端没有持续监听GET_PET_LIST，请使用SendNoteUpdatePropForNewPet
     */
    async SendPetListUpdate(includeStorage = false) {
        const pets = includeStorage ? this.PetData.GetPetsInStorage() : this.PetData.GetPetsInBag();
        const petProtos = pets.map(pet => this.petInfoToProto(pet));
        await this.Player.SendPacket(new Pet_1.PacketGetPetList(petProtos, this.Player.ClientProtocol));
        utils_1.Logger.Info(`[PetManager] 主动推送精灵列表更新: UserID=${this.UserID}, Type=${includeStorage ? '仓库' : '背包'}, Count=${pets.length}`);
    }
    /**
     * 推送 NOTE_UPDATE_PROP 触发客户端刷新精灵列表（用于GM发送精灵等场景）
     * 客户端收到此消息后会自动调用 PetManager.upDate() 刷新精灵列表
     * @param pet 新获得的精灵信息
     */
    async SendNoteUpdatePropForNewPet(pet) {
        await this.sendNoteUpdateProp([pet], 0);
        utils_1.Logger.Info(`[PetManager] 推送 NOTE_UPDATE_PROP 触发客户端刷新: UserID=${this.UserID}, PetId=${pet.petId}`);
    }
    /**
     * 处理获取精灵信息
     */
    async HandleGetPetInfo(catchTime) {
        utils_1.Logger.Debug(`[PetManager] HandleGetPetInfo: UserID=${this.UserID}, CatchTime=${catchTime}`);
        // 忽略无效的 catchTime（客户端缓存的旧数据）
        if (catchTime < 1000000000) {
            utils_1.Logger.Warn(`[PetManager] 忽略无效的 catchTime: UserID=${this.UserID}, CatchTime=${catchTime} (客户端缓存数据)`);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GET_PET_INFO).setResult(5001));
            return;
        }
        const pet = this.PetData.GetPetByCatchTime(catchTime);
        if (pet) {
            utils_1.Logger.Info(`[PetManager] 找到精灵: PetID=${pet.petId}, Level=${pet.level}, CatchTime=${pet.catchTime}`);
            const petProto = this.petInfoToProto(pet);
            await this.Player.SendPacket(new Pet_1.PacketGetPetInfo(petProto, 0, this.Player.ClientProtocol));
        }
        else {
            utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
            utils_1.Logger.Debug(`[PetManager] 当前精灵列表: ${JSON.stringify(this.PetData.PetList.map(p => ({ petId: p.petId, catchTime: p.catchTime })))}`);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GET_PET_INFO).setResult(5001));
        }
    }
    /**
     * 处理将精灵放到仓库（flag=0）
     */
    async HandlePetRelease(catchTime) {
        const release = await this.PetData.AcquireMutation();
        let committed = false;
        try {
            if (this.PetData.HasPendingGrant()) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5000));
                return;
            }
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet || !pet.isInBag) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5001));
                return;
            }
            await this.commitPetBagUpdate(pet, pets => {
                const candidate = pets.find(p => p.catchTime === catchTime);
                candidate.isInBag = false;
                if (candidate.isDefault) {
                    candidate.isDefault = false;
                    const next = pets.filter(p => p.isInBag).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.catchTime - b.catchTime)[0];
                    if (next)
                        next.isDefault = true;
                }
            });
            committed = true;
            const firstPetTime = this.GetDefaultPet()?.catchTime ?? 0;
            await this.Player.SendPacket(new Pet_1.PacketPetRelease(0, firstPetTime, 0, undefined, this.Player.ClientProtocol));
            utils_1.Logger.Info(`[PetManager] 将精灵放到仓库: UserID=${this.UserID}, CatchTime=${catchTime}, NewDefaultCatchTime=${firstPetTime}`);
        }
        catch (error) {
            utils_1.Logger.Error('[PetManager] HandlePetRelease failed', error);
            if (!committed)
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5000));
        }
        finally {
            release();
        }
    }
    /**
     * 处理将精灵放入背包（从仓库取出，或确认获得新精灵）
     */
    async HandlePetTakeOut(catchTime) {
        const release = await this.PetData.AcquireMutation();
        let committed = false;
        try {
            if (this.PetData.HasPendingGrant()) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5000));
                return;
            }
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            const bagCount = this.PetData.GetPetsInBag().length;
            if (!pet || (!pet.isInBag && bagCount >= 6)) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5001));
                return;
            }
            await this.commitPetBagUpdate(pet, pets => {
                const candidate = pets.find(p => p.catchTime === catchTime);
                if (!candidate.isInBag) {
                    candidate.isInBag = true;
                    candidate.isRoomShow = false;
                    if (bagCount === 0)
                        candidate.isDefault = true;
                }
            });
            committed = true;
            const firstPetTime = this.GetDefaultPet()?.catchTime ?? 0;
            const petProto = this.petInfoToProto(pet);
            await this.Player.SendPacket(new Pet_1.PacketPetRelease(0, firstPetTime, 1, petProto, this.Player.ClientProtocol));
            utils_1.Logger.Info(`[PetManager] 取回精灵响应: UserID=${this.UserID}, PetCatchTime=${catchTime}, FirstPetTime=${firstPetTime}`);
        }
        catch (error) {
            utils_1.Logger.Error('[PetManager] HandlePetTakeOut failed', error);
            if (!committed)
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_RELEASE).setResult(5000));
        }
        finally {
            release();
        }
    }
    /** These bag operations publish membership/default/order only after strict persistence. */
    async commitPetBagUpdate(pet, update) {
        const planned = JSON.parse(JSON.stringify(this.PetData.PetList));
        update(planned);
        const candidate = planned.find(p => p.catchTime === pet.catchTime);
        await this.PetData.CommitPetUpdate(pet, candidate, staged => {
            staged.PetList = planned;
            return DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(staged, true);
        }, () => {
            const current = new Map(this.PetData.PetList.map(p => [p.catchTime, p]));
            planned.forEach((next, index) => {
                const live = current.get(next.catchTime);
                if (live.isInBag !== next.isInBag)
                    live.isInBag = next.isInBag;
                if (live.isDefault !== next.isDefault)
                    live.isDefault = next.isDefault;
                if (live.isRoomShow !== next.isRoomShow)
                    live.isRoomShow = next.isRoomShow;
                if (this.PetData.PetList[index] !== live)
                    this.PetData.PetList[index] = live;
            });
        });
    }
    /**
     * 处理展示精灵
     */
    async HandlePetShow(catchTime) {
        const pet = this.PetData.GetPetByCatchTime(catchTime);
        if (pet) {
            const packet = new Pet_1.PacketPetShow(this.UserID, pet.catchTime, pet.petId, 1, pet.dvHp, 0);
            await this.Player.SendPacket(packet);
            require('../Universe/movement').petShown(this.Player, pet);
            const mapId = this.Player.Data.mapID;
            if (mapId > 0) {
                await this.Player.EventBus.Emit({
                    type: EventTypes_1.MapEventType.PET_SHOW,
                    timestamp: Date.now(),
                    playerId: this.UserID,
                    mapId,
                    packet,
                });
            }
        }
        else {
            utils_1.Logger.Warn(`[PetManager] 展示精灵失败，精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SHOW).setResult(5001));
        }
    }
    /**
     * 处理治疗精灵
     */
    async HandlePetCure(catchTime) {
        const recovery = this.Player.BattleManager.BeginOutOfBattleRecovery();
        if (!recovery) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_CURE).setResult(5001));
            return;
        }
        let releaseInventory, release;
        let committed = false;
        try {
            releaseInventory = await this.Player.ItemManager.ItemData.AcquireReward();
            release = await this.PetData.AcquireMutation();
            if (!recovery.isCurrent())
                return;
            const pet = catchTime ? this.PetData.GetPetByCatchTime(catchTime) : undefined;
            const pets = catchTime ? pet ? [pet] : [] : this.PetData.GetPetsInBag();
            if (!pets.length) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_CURE).setResult(5001));
                return;
            }
            await this.commitPetRecovery(pets, 0);
            committed = true;
            if (!recovery.isCurrent())
                return;
            await this.Player.SendPacket(new Pet_1.PacketPetCure());
        }
        catch (error) {
            utils_1.Logger.Error(committed ? '[PetManager] Recovery committed; response delivery failed' : '[PetManager] Pet recovery was not persisted', error);
            if (!committed && recovery.isCurrent())
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_CURE).setResult(5000));
        }
        finally {
            release?.();
            releaseInventory?.();
            recovery.release();
        }
    }
    async commitPetRecovery(pets, cost) {
        const candidates = new Map(pets.map(pet => {
            const candidate = JSON.parse(JSON.stringify(pet));
            candidate.hp = candidate.maxHp;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate, true);
            return [pet.catchTime, candidate];
        }));
        let gate;
        try {
            if (cost) {
                gate = this.Player.Data.BeginBalanceReward();
            }
            await this.PetData.CommitPetUpdate(pets[0], candidates.get(pets[0].catchTime), async (staged) => {
                staged.PetList = staged.PetList.map(pet => candidates.get(pet.catchTime) || pet);
                if (!cost) {
                    await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(staged, true);
                    return;
                }
                await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                    let committed = false;
                    await driver.beginTransaction();
                    try {
                        const [row] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [this.UserID]);
                        if (!row)
                            throw new Error('Recovery wallet missing');
                        const stored = [row.coins, row.gold, row.allocatable_exp];
                        const keys = ['coins', 'gold', 'allocatableExp'];
                        const dirty = this.Player.Data.GetDirtyFields();
                        const balances = keys.map((key, i) => {
                            const cached = this.Player.Data[key];
                            if (!dirty.includes(key) && cached !== stored[i])
                                throw new Error('Recovery wallet cache stale');
                            const value = dirty.includes(key) ? cached : stored[i];
                            if (!Number.isSafeInteger(value) || value < 0)
                                throw new Error('Invalid recovery balance');
                            return value;
                        });
                        if (balances[0] < cost)
                            throw new Error('Recovery coins insufficient');
                        balances[0] -= cost;
                        const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [staged.ToRow().pet_list, this.UserID]);
                        const walletWrite = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balances, this.UserID]);
                        if (petWrite.affectedRows !== 1 || walletWrite.affectedRows !== 1)
                            throw new Error('Recovery storage row missing');
                        const [savedPet] = await driver.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [this.UserID]);
                        const [savedWallet] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [this.UserID]);
                        if (savedPet?.pet_list !== staged.ToRow().pet_list || !savedWallet ||
                            [savedWallet.coins, savedWallet.gold, savedWallet.allocatable_exp].some((value, i) => value !== balances[i])) {
                            throw new Error('Recovery readback mismatch');
                        }
                        await driver.commit();
                        committed = true;
                        gate.publish(balances[0], balances[1], balances[2]);
                    }
                    catch (error) {
                        if (!committed)
                            await driver.rollback();
                        throw error;
                    }
                });
            }, () => {
                for (const pet of pets.slice(1))
                    Object.assign(pet, candidates.get(pet.catchTime));
            });
        }
        finally {
            gate?.release();
        }
    }
    /**
     * 处理设置首发精灵
     *
     * 优化：设置首发时直接调整数组顺序，确保首发精灵在第一位
     * 这样登录和其他地方就不需要额外排序了
     */
    async HandlePetDefault(catchTime) {
        const release = await this.PetData.AcquireMutation();
        let committed = false;
        try {
            if (this.PetData.HasPendingGrant()) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_DEFAULT).setResult(5000));
                return;
            }
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet || !pet.isInBag) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_DEFAULT).setResult(5001));
                return;
            }
            await this.commitPetBagUpdate(pet, pets => {
                pets.forEach(p => p.isDefault = p.catchTime === catchTime);
                const selectedIndex = pets.findIndex(p => p.catchTime === catchTime);
                const firstBagIndex = pets.findIndex(p => p.isInBag);
                if (selectedIndex !== firstBagIndex) {
                    const [selected] = pets.splice(selectedIndex, 1);
                    pets.splice(firstBagIndex, 0, selected);
                }
            });
            committed = true;
            await this.Player.SendPacket(new Pet_1.PacketPetDefault());
            utils_1.Logger.Info(`[PetManager] 设置首发精灵: UserID=${this.UserID}, PetId=${pet.petId}, CatchTime=${catchTime}`);
        }
        catch (error) {
            utils_1.Logger.Error('[PetManager] HandlePetDefault failed', error);
            if (!committed)
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_DEFAULT).setResult(5000));
        }
        finally {
            release();
        }
    }
    /**
     * 处理获取精灵仓库列表
     */
    async HandlePetBargeList() {
        const pets = this.PetData.GetPetsInStorage();
        const petProtos = pets.map(pet => this.petInfoToProto(pet));
        await this.Player.SendPacket(new Pet_1.PacketGetPetList(petProtos, this.Player.ClientProtocol));
        utils_1.Logger.Info(`[PetManager] 获取仓库精灵列表: UserID=${this.UserID}, Count=${pets.length}`);
    }
    /**
     * 处理移动精灵到仓�?
     */
    async HandleMovePetToStorage(petId) {
        if (this.PetData.HasPendingGrant()) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST).setResult(5000));
            return;
        }
        const pet = this.PetData.GetPet(petId);
        if (pet && pet.isInBag) {
            pet.isInBag = false;
            await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(this.PetData);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST));
            utils_1.Logger.Info(`[PetManager] 移动精灵到仓�? UserID=${this.UserID}, PetId=${petId}`);
        }
        else {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST).setResult(5001));
        }
    }
    /**
     * 处理移动精灵到背�?
     */
    async HandleMovePetToBag(petId) {
        if (this.PetData.HasPendingGrant()) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST).setResult(5000));
            return;
        }
        const pet = this.PetData.GetPet(petId);
        const { inBag } = this.PetData.GetPetCount();
        if (pet && !pet.isInBag && inBag < 6) {
            pet.isInBag = true;
            await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(this.PetData);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST));
            utils_1.Logger.Info(`[PetManager] 移动精灵到背�? UserID=${this.UserID}, PetId=${petId}`);
        }
        else {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_BARGE_LIST).setResult(5001));
        }
    }
    /**
     * 处理增加精灵经验（按petId查找）
     * @deprecated 使用HandleAddPetExpByCatchTime代替
     */
    async HandleAddPetExp(petId, expAmount) {
        const pet = this.PetData.GetPet(petId);
        if (!pet)
            return false;
        return this.HandleAddPetExpByCatchTime(pet.catchTime, expAmount);
    }
    /**
     * 处理增加精灵经验（按catchTime查找）
     */
    async HandleAddPetExpByCatchTime(catchTime, expAmount, defeatedPetId, boost) {
        const release = await this.PetData.AcquireMutation();
        let releasePool;
        try {
            if (boost && (defeatedPetId === undefined || !Number.isSafeInteger(boost.storedExperience) || boost.storedExperience < 0)) {
                throw new Error('Invalid battle experience boost');
            }
            if (boost?.learningUse && (!Number.isSafeInteger(boost.learningUse.expected) || boost.learningUse.expected < 1 ||
                boost.learningUse.remaining !== boost.learningUse.expected - 1)) {
                throw new Error('Invalid learning multiplier use');
            }
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵未找到: CatchTime=${catchTime}`);
                return false;
            }
            const candidate = JSON.parse(JSON.stringify(pet));
            // 仅胜利结算传入被击败精灵 ID；直接加经验和经验分配不附赠学习力。
            // 与经验共用一个候选快照、变更锁和严格持久化边界。
            // 学习力训练室只加本室单项；经验特训不加学习力。其余战斗按被击败精灵产出。
            const evChanged = defeatedPetId !== undefined && (boost?.fixedEv ? ApplyTrainingRoomEV(candidate, boost.fixedEv) : !boost?.noEvGain && PetCalculator_1.PetCalculator.ApplyBattleEV(candidate, defeatedPetId, boost?.learningMultiplier ?? 1));
            candidate.exp += expAmount;
            const result = AdvancePetExperience(candidate);
            const levelUp = candidate.level > pet.level;
            // 升级路径已经按新的 EV 重算；未升级时也须更新能力值。
            if (evChanged && !levelUp)
                this.recalculateStats(candidate);
            const newSkills = [...new Set(result.newSkills)].filter(id => !candidate.skillArray.includes(id));
            const activeSkills = newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length));
            const unactiveSkills = newSkills.slice(activeSkills.length);
            candidate.skillArray.push(...activeSkills);
            if (levelUp)
                candidate.hp = candidate.maxHp;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate, levelUp);
            // Validate the actual protocol fields before committing an otherwise unreadable reward.
            const experience = (0, PetExperienceProjection_1.GetPetExperienceFields)(candidate, this.Player.ClientProtocol);
            if (!Object.values(experience).every(value => Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff)) {
                throw new Error('Pet experience projection exceeds uint32');
            }
            // Persist legacy use counters with the rewarded pet so neither side can commit alone.
            let poolChange;
            let publishPool;
            if (boost && boost.storedExperience > 0) {
                await this.Player.Data.WaitForExpAllocation();
                const pool = this.Player.Data.BeginExpAllocation();
                releasePool = pool.release;
                const expectedBalance = this.Player.Data.allocatableExp;
                if (!Number.isSafeInteger(expectedBalance) || expectedBalance < 0 || expectedBalance > 0x7fffffff) {
                    throw new Error('Invalid experience pool balance');
                }
                const balance = Math.min(0x7fffffff, expectedBalance + boost.storedExperience);
                if (balance > expectedBalance) {
                    poolChange = { expected: expectedBalance, balance };
                    publishPool = () => pool.publish(balance);
                }
            }
            if (poolChange || boost?.learningUse) {
                await this.PetData.CommitPetUpdate(pet, candidate, staged => new PlayerRepository_1.PlayerRepository().CommitBattlePetReward(this.UserID, staged.ToRow().pet_list, poolChange, boost?.learningUse), () => {
                    publishPool?.();
                    if (boost?.learningUse)
                        this.Player.Data.PublishLearnTimes(boost.learningUse.remaining);
                });
            }
            else {
                await this.PetData.CommitPetUpdate(pet, candidate);
            }
            releasePool?.();
            releasePool = undefined;
            await this.sendNoteUpdateProp([pet], 0);
            if (newSkills.length > 0) {
                await this.Player.SendPacket(new PacketNoteUpdateSkill_1.PacketNoteUpdateSkill([{ catchTime, activeSkills, unactiveSkills }]));
            }
            utils_1.Logger.Info(`[PetManager] 精灵获得经验: CatchTime=${catchTime}, PetId=${pet.petId}, Exp=${expAmount}, LevelUp=${levelUp}, NewLevel=${pet.level}`);
            return levelUp;
        }
        finally {
            releasePool?.();
            release();
        }
    }
    /**
     * 重新计算属性
     * 使用 PetCalculator 的正确计算方法，包含种族值和性格修正
     */
    recalculateStats(pet) {
        PetCalculator_1.PetCalculator.UpdatePetStats(pet);
    }
    // ==================== 公开 API（外部 Manager/Handler 必须通过这些方法访问） ====================
    /**
     * 获取背包中的精灵列表（按首发优先、catchTime升序排列）
     */
    GetPetsInBag() {
        return this.PetData.GetPetsInBag();
    }
    /**
     * 获取首发精灵
     */
    GetDefaultPet() {
        return this.PetData.PetList.find(p => p.isDefault) || null;
    }
    /**
     * 按 catchTime 获取精灵
     */
    GetPetByCatchTime(catchTime) {
        return this.PetData.GetPetByCatchTime(catchTime);
    }
    /**
     * 获取精灵数量信息
     */
    async GetPetCount() {
        return this.PetData.GetPetCount();
    }
    /**
     * 获取背包剩余空间
     */
    async GetBagSpace() {
        const { inBag } = this.PetData.GetPetCount();
        return Math.max(0, 6 - inBag);
    }
    /**
     * Give pet to player (for mail attachments, task rewards, etc.)
     */
    async GivePet(petId, level = 1, catchTime, source = EventTypes_1.PetObtainSource.GIVE, toStorage = false) {
        const release = await this.PetData.AcquireMutation();
        try {
            utils_1.Logger.Info(`[PetManager] GivePet 开始: UserId=${this.UserID}, PetId=${petId}, Level=${level}, CatchTime=${catchTime}`);
            if (!Number.isInteger(petId) || !GameConfig_1.GameConfig.GetPetById(petId)) {
                utils_1.Logger.Warn(`[PetManager] 未知精灵，拒绝发放: PetId=${petId}`);
                return false;
            }
            // 与当前 checkLevelUp / PetCalculator 的 1..100 等级域一致。
            if (!Number.isInteger(level) || level < 1 || level > 100) {
                utils_1.Logger.Warn(`[PetManager] 无效等级，拒绝发放: Level=${level}`);
                return false;
            }
            const identity = catchTime ?? Math.floor(Date.now() / 1000);
            if (!Number.isInteger(identity) || identity <= 0 || identity > 0xFFFFFFFF) {
                utils_1.Logger.Warn(`[PetManager] 无效捕获时间，拒绝发放: CatchTime=${identity}`);
                return false;
            }
            // Create new pet using createDefaultPetInfo
            const newPet = (0, PetModel_1.createDefaultPetInfo)(this.UserID, petId);
            utils_1.Logger.Debug(`[PetManager] 创建精灵对象: PetId=${newPet.petId}, CatchTime=${newPet.catchTime}`);
            // Set level and catch time
            newPet.level = level;
            newPet.obtainLevel = level;
            newPet.catchTime = identity;
            utils_1.Logger.Debug(`[PetManager] 设置等级和捕获时间: Level=${newPet.level}, CatchTime=0x${newPet.catchTime.toString(16)}`);
            // Use PetCalculator to calculate correct stats
            const { PetCalculator } = await Promise.resolve().then(() => __importStar(require('./PetCalculator')));
            PetCalculator.UpdatePetStats(newPet);
            utils_1.Logger.Debug(`[PetManager] 计算属性: HP=${newPet.hp}/${newPet.maxHp}, ATK=${newPet.atk}`);
            // Use SptSystem to get default skills
            const { SptSystem } = await Promise.resolve().then(() => __importStar(require('./SptSystem')));
            const defaultSkills = SptSystem.GetDefaultSkills(petId, level);
            newPet.skillArray = defaultSkills.slice(0, 4).map(skill => skill.id);
            newPet.skillPP = (0, PetPP_1.ReconcilePetPP)(newPet);
            utils_1.Logger.Debug(`[PetManager] 设置技能: ${newPet.skillArray.join(',')}`);
            // 前面的异步准备可能与其他发放交错。检查与 AddPet 的同步插入之间不再 await。
            // catchTime 是客户端身份键；拒绝冲突，不能悄悄改写调用方已经用于响应的值。
            if (this.PetData.GetPetByCatchTime(identity)) {
                utils_1.Logger.Warn(`[PetManager] 捕获时间重复，拒绝发放: CatchTime=${identity}`);
                return false;
            }
            const bagSpace = 6 - this.PetData.GetPetsInBag().length;
            newPet.isDefault = !toStorage && bagSpace === 6;
            // 背包满时自动放入仓库
            if (toStorage || bagSpace <= 0) {
                newPet.isInBag = false;
                utils_1.Logger.Info(`[PetManager] 将精灵放入仓库: UserId=${this.UserID}, PetId=${petId}`);
            }
            await this.PetData.AddPet(newPet);
            utils_1.Logger.Info(`[PetManager] 准备保存精灵数据到数据库...`);
            await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(this.PetData);
            utils_1.Logger.Info(`[PetManager] Give pet success UserId=${this.UserID}, PetId=${petId}, Level=${level}, Skills=${newPet.skillArray.join(',')}`);
            // 派发精灵获得事件
            await this.Player.EventBus.Emit({
                type: EventTypes_1.PetEventType.PET_OBTAINED,
                timestamp: Date.now(),
                playerId: this.UserID,
                petId,
                level,
                catchTime: newPet.catchTime,
                source,
            });
            return true;
        }
        catch (error) {
            utils_1.Logger.Error(`[PetManager] Give pet error`, error);
            return false;
        }
        finally {
            release();
        }
    }
    /**
     * 获取精灵Proto列表（用于登录响应等）
     */
    GetPetProtoList(pets) {
        return pets.map(pet => this.petInfoToProto(pet));
    }
    /**
     * �?IPetInfo 转换�?PetInfoProto
     */
    petInfoToProto(pet) {
        const proto = new PetInfoProto_1.PetInfoProto();
        proto.id = pet.petId;
        proto.name = pet.nick || '';
        proto.dv = pet.dvHp;
        proto.nature = pet.nature;
        proto.level = pet.level;
        const experience = (0, PetExperienceProjection_1.GetPetExperienceFields)(pet, this.Player.ClientProtocol);
        proto.exp = experience.exp;
        proto.lvExp = experience.currentLvExp;
        proto.nextLvExp = experience.nextLvExp;
        proto.hp = pet.hp;
        proto.maxHp = pet.maxHp;
        proto.attack = pet.atk;
        proto.defence = pet.def;
        proto.s_a = pet.spAtk;
        proto.s_d = pet.spDef;
        proto.speed = pet.speed;
        proto.ev_hp = pet.evHp;
        proto.ev_attack = pet.evAtk;
        proto.ev_defence = pet.evDef;
        proto.ev_sa = pet.evSpAtk;
        proto.ev_sd = pet.evSpDef;
        proto.ev_sp = pet.evSpeed;
        proto.skills = pet.skillArray.map(skillId => {
            const skillConfig = GameConfig_1.GameConfig.GetSkillById(skillId);
            const maxPP = skillConfig?.MaxPP || 20;
            return {
                id: skillId,
                pp: (0, PetPP_1.GetPetSkillPP)(pet, skillId), // Persisted current PP, including zero
                maxPp: maxPP // 最大PP
            };
        });
        proto.catchTime = pet.catchTime;
        proto.catchMap = 0;
        proto.catchRect = 0;
        proto.catchLevel = pet.obtainLevel;
        // 特性列表
        proto.effects = (pet.effectList || []).map(e => {
            const args = (e.args || '').split(' ').map(Number);
            const effect = {
                itemId: e.itemId || 0,
                status: e.status || 2,
                leftCount: e.leftCount === -1 ? 255 : (e.leftCount || 0),
                effectID: e.effectID || 0,
                arg1: args[0] || 0,
                arg2: args[1] || 0,
                args
            };
            utils_1.Logger.Debug(`[PetManager] 构建特性: effectID=${effect.effectID}, itemId=${effect.itemId}, status=${effect.status}, leftCount=${effect.leftCount}, arg1=${effect.arg1}, arg2=${effect.arg2}`);
            return effect;
        });
        if (this.Player.ClientProtocol === 'xin-20261013') {
            proto.skinID = pet.skinId ?? 0;
            proto.shiny = pet.shiny ?? 0;
        }
        utils_1.Logger.Debug(`[PetManager] 精灵 ${pet.petId} 特性数量: ${proto.effects.length}`);
        return proto;
    }
    /**
     * 发送 NOTE_UPDATE_PROP 推送（触发经验获得弹窗）
     * @param pets 更新的精灵列表
     * @param addition 加成百分比 * 100（例如 150 表示 1.5 倍）
     */
    async sendNoteUpdateProp(pets, addition = 0) {
        const updateInfos = pets.map(pet => ({
            catchTime: pet.catchTime,
            id: pet.petId,
            level: pet.level,
            ...(0, PetExperienceProjection_1.GetPetExperienceFields)(pet, this.Player.ClientProtocol),
            maxHp: pet.maxHp,
            attack: pet.atk,
            defence: pet.def,
            sa: pet.spAtk,
            sd: pet.spDef,
            sp: pet.speed,
            ev_hp: pet.evHp,
            ev_a: pet.evAtk,
            ev_d: pet.evDef,
            ev_sa: pet.evSpAtk,
            ev_sd: pet.evSpDef,
            ev_sp: pet.evSpeed
        }));
        await this.Player.SendPacket(new PacketNoteUpdateProp_1.PacketNoteUpdateProp(addition, updateInfos));
    }
    /**
     * 发送 NOTE_UPDATE_SKILL 推送（触发技能学习界面）
     * @param pet 精灵信息
     * @param newSkills 新学会的技能ID列表
     */
    async sendNoteUpdateSkill(pet, newSkills, activeSkills, unactiveSkills) {
        if (newSkills.length) {
            await this.Player.SendPacket(new PacketNoteUpdateSkill_1.PacketNoteUpdateSkill([{ catchTime: pet.catchTime, activeSkills, unactiveSkills }]));
        }
    }
    /**
     * 处理获取可分配经验（精灵分配仪）
     */
    async HandlePetGetExp() {
        const allocatableExp = this.Player.Data.allocatableExp;
        await this.Player.SendPacket(new PacketPetGetExp_1.PacketPetGetExp(allocatableExp));
        utils_1.Logger.Info(`[PetManager] 查询可分配经验: UserID=${this.UserID}, AllocExp=${allocatableExp}`);
    }
    /**
     * 处理设置精灵经验（精灵分配仪）
     */
    async HandlePetSetExp(catchTime, expAmount) {
        const release = await this.PetData.AcquireMutation();
        let releasePool;
        let committed = false;
        try {
            // 1. 验证精灵存在
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SET_EXP).setResult(5001));
                return;
            }
            utils_1.Logger.Info(`[PetManager] 分配经验前: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, Exp=${pet.exp}, AllocExp=${this.Player.Data.allocatableExp}`);
            // 2. 验证经验值有效
            if (!Number.isSafeInteger(expAmount) || expAmount <= 0) {
                utils_1.Logger.Warn(`[PetManager] 经验值无效: UserID=${this.UserID}, ExpAmount=${expAmount}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SET_EXP).setResult(5001));
                return;
            }
            // 3. 验证可分配经验足够
            if (this.Player.Data.allocatableExp < expAmount) {
                utils_1.Logger.Warn(`[PetManager] 可分配经验不足: UserID=${this.UserID}, Need=${expAmount}, Have=${this.Player.Data.allocatableExp}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SET_EXP).setResult(10016));
                return;
            }
            // 4. 验证精灵未满级
            if (pet.level >= 100) {
                utils_1.Logger.Warn(`[PetManager] 精灵已满级: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SET_EXP).setResult(5001));
                return;
            }
            const pool = this.Player.Data.BeginExpAllocation();
            releasePool = pool.release;
            const expectedBalance = this.Player.Data.allocatableExp;
            const candidate = JSON.parse(JSON.stringify(pet));
            candidate.exp += expAmount;
            const result = AdvancePetExperience(candidate);
            const levelUp = candidate.level > pet.level;
            // 7. 计算实际消耗的经验（如果满级，剩余经验会留在 pet.exp 中）
            let actualUsedExp = expAmount;
            if (candidate.level >= 100) {
                // 精灵满级，计算实际使用的经验
                // 满级后 pet.exp 应该为 0，多余的经验需要返还
                const excessExp = candidate.exp;
                actualUsedExp = expAmount - excessExp;
                candidate.exp = 0; // 满级精灵经验归零
                utils_1.Logger.Info(`[PetManager] 精灵满级，返还剩余经验: ExcessExp=${excessExp}, ActualUsed=${actualUsedExp}`);
            }
            if (!Number.isSafeInteger(expectedBalance) || !Number.isSafeInteger(actualUsedExp) ||
                actualUsedExp <= 0 || actualUsedExp > expAmount)
                throw new Error('Invalid experience allocation state');
            const balance = expectedBalance - actualUsedExp;
            const newSkills = [...new Set(result.newSkills)].filter(id => !candidate.skillArray.includes(id));
            const activeSkills = newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length));
            const unactiveSkills = newSkills.slice(activeSkills.length);
            candidate.skillArray.push(...activeSkills);
            if (levelUp)
                candidate.hp = candidate.maxHp;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate, levelUp);
            await this.PetData.CommitPetUpdate(pet, candidate, staged => new PlayerRepository_1.PlayerRepository().CommitPetExperience(this.UserID, expectedBalance, balance, staged.ToRow().pet_list), () => pool.publish(balance));
            committed = true;
            releasePool();
            releasePool = undefined;
            // Persistence gates end at commit; slow notifications must not block saves.
            await this.sendNoteUpdateProp([pet], 0);
            // 10. 如果学会了新技能，推送 NOTE_UPDATE_SKILL (2507)
            if (newSkills.length > 0) {
                await this.Player.SendPacket(new PacketNoteUpdateSkill_1.PacketNoteUpdateSkill([{ catchTime, activeSkills, unactiveSkills }]));
            }
            // 11. 发送成功响应（只返回经验池剩余经验，4字节）
            // 注意：根据抓包分析，响应必须在推送之后发送
            await this.Player.SendPacket(new PacketPetSetExp_1.PacketPetSetExp(balance));
            utils_1.Logger.Info(`[PetManager] 发送 PET_SET_EXP 响应: RemainingAllocExp=${balance}`);
        }
        catch (error) {
            if (committed) {
                // The allocation cannot be undone or reported as a retryable business failure.
                utils_1.Logger.Error(`[PetManager] PET_SET_EXP committed but notification failed`, error);
                return;
            }
            utils_1.Logger.Error(`[PetManager] HandlePetSetExp failed`, error);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SET_EXP).setResult(5000));
        }
        finally {
            releasePool?.();
            release();
        }
    }
    /**
     * 处理精灵进化
     * @param catchTime 精灵捕获时间
     * @param evolveIndex 进化索引（通常为1）
     */
    async HandlePetEvolution(catchTime, evolveIndex) {
    return require("./SpecialEvolution").HandleEvolution(this, catchTime, evolveIndex);
  }
    /**
     * 处理精灵学习技能（替换技能）
     * @param catchTime 精灵捕获时间
     * @param skillId 要学习的技能ID
     * @param dropSkillId 要替换的旧技能ID
     */
    async HandleStudySkill(catchTime, skillId, dropSkillId) {
        const release = await this.PetData.AcquireMutation();
        try {
            // 1. 验证精灵存在
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
                return;
            }
            // 2. 查找要替换的技能槽位置
            const slotIndex = pet.skillArray.indexOf(dropSkillId);
            if (slotIndex === -1) {
                utils_1.Logger.Warn(`[PetManager] 旧技能不存在: UserID=${this.UserID}, DropSkillId=${dropSkillId}, SkillArray=[${pet.skillArray.join(',')}]`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
                return;
            }
            // 3. 验证技能ID有效
            if (skillId <= 0) {
                utils_1.Logger.Warn(`[PetManager] 技能ID无效: UserID=${this.UserID}, SkillId=${skillId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
                return;
            }
            // 4. 检查精灵是否已经拥有该技能
            if (pet.skillArray.includes(skillId)) {
                utils_1.Logger.Warn(`[PetManager] 精灵已拥有该技能: UserID=${this.UserID}, PetId=${pet.petId}, SkillId=${skillId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5002));
                return;
            }
            // 与 2312 相同，以该物种 PET_CONFIG 的学习等级为准，不信任客户端提示。
            const petConfig = GameConfig_1.GameConfig.GetPetById(pet.petId);
            const configuredMoves = petConfig?.LearnableMoves?.Move;
            const moves = configuredMoves
                ? (Array.isArray(configuredMoves) ? configuredMoves : [configuredMoves]) : [];
            const learnable = moves.find(move => move.ID === skillId);
            if (!learnable || pet.level < learnable.LearningLv) {
                utils_1.Logger.Warn(`[PetManager] 技能不可学习或等级不足: PetId=${pet.petId}, Level=${pet.level}, SkillId=${skillId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5001));
                return;
            }
            // 5. 记录旧技能
            const oldSkillId = pet.skillArray[slotIndex] || 0;
            const candidate = JSON.parse(JSON.stringify(pet));
            candidate.skillArray[slotIndex] = skillId;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate);
            await this.PetData.CommitPetUpdate(pet, candidate);
            utils_1.Logger.Info(`[PetManager] 精灵学习技能成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
                `SlotIndex=${slotIndex}, OldSkill=${oldSkillId}, NewSkill=${skillId}`);
            // 8. 发送成功响应
            await this.Player.SendPacket(new Pet_1.PacketStudySkill());
        }
        catch (error) {
            utils_1.Logger.Error(`[PetManager] HandleStudySkill failed`, error);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_STUDY_SKILL).setResult(5000));
        }
        finally {
            release();
        }
    }
    /**
     * 处理精灵技能切换（用新技能替换旧技能）
     * @param catchTime 精灵捕获时间
     * @param slot1 未使用
     * @param slot2 未使用
     * @param oldSkillId 旧技能ID - 要被替换的技能
     * @param newSkillId 新技能ID - 要学习的新技能
     */
    async HandleSkillSwitch(catchTime, slot1, slot2, oldSkillId, newSkillId) {
        let releaseInventory, release;
        let gate;
        let committed = false;
        try {
            // Keep the same inventory → pet → wallet lock order as paid recovery/rewards.
            releaseInventory = await this.Player.ItemManager.ItemData.AcquireReward();
            release = await this.PetData.AcquireMutation();
            // 1. 验证精灵存在
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            // 2. 查找旧技能在技能数组中的索引
            const oldSkillIndex = pet.skillArray.indexOf(oldSkillId);
            if (oldSkillIndex === -1) {
                utils_1.Logger.Warn(`[PetManager] 旧技能不存在: UserID=${this.UserID}, ` +
                    `OldSkillId=${oldSkillId}, SkillArray=[${pet.skillArray.join(',')}]`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            // 3. 验证新技能不能是已装备的技能
            if (pet.skillArray.includes(newSkillId)) {
                utils_1.Logger.Warn(`[PetManager] 新技能已装备: UserID=${this.UserID}, SkillId=${newSkillId}, ` +
                    `SkillArray=[${pet.skillArray.join(',')}]`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            // 4. 验证新技能是否可学习
            const petConfig = GameConfig_1.GameConfig.GetPetById(pet.petId);
            if (!petConfig) {
                utils_1.Logger.Warn(`[PetManager] 精灵配置不存在: PetId=${pet.petId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            // 构建技能ID到学习等级的映射
            const skillLevelMap = new Map();
            if (petConfig.LearnableMoves?.Move) {
                const moves = Array.isArray(petConfig.LearnableMoves.Move)
                    ? petConfig.LearnableMoves.Move
                    : [petConfig.LearnableMoves.Move];
                for (const move of moves) {
                    skillLevelMap.set(move.ID, move.LearningLv);
                }
            }
            const learnLevel = skillLevelMap.get(newSkillId);
            if (learnLevel === undefined) {
                utils_1.Logger.Warn(`[PetManager] 新技能不在可学习列表中: SkillId=${newSkillId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            if (pet.level < learnLevel) {
                utils_1.Logger.Warn(`[PetManager] 精灵等级不足: Level=${pet.level}, Required=${learnLevel}, SkillId=${newSkillId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5001));
                return;
            }
            // Fixed Nieo SkillReplacePanel.showDes charges 100 coins only with four skills.
            let equippedSkillCount = 0;
            for (const id of pet.skillArray) {
                if (id > 0)
                    equippedSkillCount++;
            }
            const cost = equippedSkillCount >= 4 ? 100 : 0;
            const candidate = JSON.parse(JSON.stringify(pet));
            candidate.skillArray[oldSkillIndex] = newSkillId;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate);
            if (!cost) {
                await this.PetData.CommitPetUpdate(pet, candidate);
            }
            else {
                await this.Player.Data.WaitForExpAllocation();
                await this.Player.Data.WaitForCurrencyOperations();
                gate = this.Player.Data.BeginBalanceReward();
                if (this.Player.Data.coins < cost) {
                    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(10016));
                    return;
                }
                const wallet = gate;
                await this.PetData.CommitPetUpdate(pet, candidate, staged => DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                    await driver.beginTransaction();
                    let saved = false;
                    try {
                        const [row] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [this.UserID]);
                        if (!row)
                            throw new Error('Skill awakening wallet missing');
                        const stored = [row.coins, row.gold, row.allocatable_exp];
                        const keys = ['coins', 'gold', 'allocatableExp'];
                        const dirty = this.Player.Data.GetDirtyFields();
                        const balances = keys.map((key, i) => {
                            const cached = this.Player.Data[key];
                            if (!dirty.includes(key) && cached !== stored[i])
                                throw new Error('Skill awakening wallet cache stale');
                            const value = dirty.includes(key) ? cached : stored[i];
                            if (!Number.isSafeInteger(value) || value < 0)
                                throw new Error('Invalid skill awakening balance');
                            return value;
                        });
                        if (balances[0] < cost)
                            throw new Error('Skill awakening coins insufficient');
                        balances[0] -= cost;
                        const petList = staged.ToRow().pet_list;
                        const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [petList, this.UserID]);
                        const walletWrite = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balances, this.UserID]);
                        if (petWrite.affectedRows !== 1 || walletWrite.affectedRows !== 1)
                            throw new Error('Skill awakening storage row missing');
                        await driver.commit();
                        saved = true;
                        wallet.publish(balances[0], balances[1], balances[2]);
                    }
                    catch (error) {
                        if (!saved)
                            await driver.rollback();
                        throw error;
                    }
                }));
            }
            committed = true;
            utils_1.Logger.Info(`[PetManager] 精灵技能替换成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
                `Index=${oldSkillIndex}, OldSkill=${oldSkillId}, NewSkill=${newSkillId}, Cost=${cost}`);
            // 7. 发送成功响应
            await this.Player.SendPacket(new Pet_1.PacketSkillSwitch(pet.petId));
        }
        catch (error) {
            utils_1.Logger.Error(committed ? '[PetManager] Skill awakening committed; response delivery failed' : '[PetManager] HandleSkillSwitch failed', error);
            if (!committed)
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_SKILL_SWICTH).setResult(5000));
        }
        finally {
            gate?.release();
            release?.();
            releaseInventory?.();
        }
    }
    /**
     * 处理恢复单个精灵HP
     * CMD 2310: PET_ONE_CURE
     *
     * 功能：
     * - 恢复精灵HP到满值
     * - 非VIP用户扣除20赛尔豆
     * - VIP用户免费
     *
     * HP and current skill PP are committed together before the client confirmation.
     */
    async HandlePetOneCure(catchTime, clientCoins = 0) {
        const recovery = this.Player.BattleManager.BeginOutOfBattleRecovery();
        if (!recovery) {
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_ONE_CURE).setResult(5001));
            return;
        }
        let releaseInventory, release;
        let committed = false;
        try {
            releaseInventory = await this.Player.ItemManager.ItemData.AcquireReward();
            release = await this.PetData.AcquireMutation();
            if (!recovery.isCurrent())
                return;
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_ONE_CURE).setResult(5001));
                return;
            }
            const pp = (0, PetPP_1.ReconcilePetPP)(pet);
            if (pet.hp >= pet.maxHp && Object.entries(pp).every(([id, value]) => value === (0, PetPP_1.GetSkillMaxPP)(Number(id)))) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_ONE_CURE).setResult(5002));
                return;
            }
            const cost = this.Player.Data.vip > 0 ? 0 : 20;
            if (this.Player.Data.coins < cost) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_ONE_CURE).setResult(10016));
                return;
            }
            if (cost) {
                await this.Player.Data.WaitForCurrencyOperations();
                await this.Player.Data.WaitForExpAllocation();
            }
            if (!recovery.isCurrent())
                return;
            await this.commitPetRecovery([pet], cost);
            committed = true;
            if (!recovery.isCurrent())
                return;
            await this.Player.SendPacket(new PacketPetOneCure_1.PacketPetOneCure(catchTime));
        }
        catch (error) {
            utils_1.Logger.Error(committed ? '[PetManager] Recovery committed; response delivery failed' : '[PetManager] Pet recovery was not persisted', error);
            if (!committed && recovery.isCurrent())
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_ONE_CURE).setResult(5000));
        }
        finally {
            release?.();
            releaseInventory?.();
            recovery.release();
        }
    }
    /**
     * 处理技能排序
     * CMD: 2328 Skill_Sort
     *
     * 功能：调整精灵技能槽的顺序
     * @param catchTime 精灵捕获时间
     * @param skill1 第1个技能ID
     * @param skill2 第2个技能ID
     * @param skill3 第3个技能ID
     * @param skill4 第4个技能ID
     */
    async HandleSkillSort(catchTime, skill1, skill2, skill3, skill4) {
        const release = await this.PetData.AcquireMutation();
        try {
            // 1. 验证精灵存在
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.Skill_Sort).setResult(5001));
                return;
            }
            // 2. 构建新的技能数组
            const newSkills = [skill1, skill2, skill3, skill4].filter(id => id > 0);
            // 旧 Reseer 的排序模块只发送实际装备技能；必须是完整重排，不能增删。
            // 尚无固定 XIN 排序模块证据，保留其原有四技能限制。
            const expectedCount = this.Player.ClientProtocol === 'kose' ? pet.skillArray.length : 4;
            if (expectedCount < 1 || expectedCount > 4 || newSkills.length !== expectedCount) {
                utils_1.Logger.Warn(`[PetManager] 技能数量无效: UserID=${this.UserID}, Count=${newSkills.length}, ` +
                    `Skills=[${newSkills.join(',')}]`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.Skill_Sort).setResult(5001));
                return;
            }
            // 4. 验证所有技能都在精灵的技能列表中
            const currentSkills = new Set(pet.skillArray);
            for (const skillId of newSkills) {
                if (!currentSkills.has(skillId)) {
                    utils_1.Logger.Warn(`[PetManager] 技能不属于该精灵: UserID=${this.UserID}, SkillId=${skillId}, ` +
                        `CurrentSkills=[${pet.skillArray.join(',')}]`);
                    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.Skill_Sort).setResult(5001));
                    return;
                }
            }
            // 5. 验证没有重复的技能
            const uniqueSkills = new Set(newSkills);
            if (uniqueSkills.size !== newSkills.length) {
                utils_1.Logger.Warn(`[PetManager] 技能列表包含重复: UserID=${this.UserID}, Skills=[${newSkills.join(',')}]`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.Skill_Sort).setResult(5001));
                return;
            }
            // 6. 更新技能顺序
            const oldSkills = [...pet.skillArray];
            const candidate = JSON.parse(JSON.stringify(pet));
            candidate.skillArray = newSkills;
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate);
            await this.PetData.CommitPetUpdate(pet, candidate);
            utils_1.Logger.Info(`[PetManager] 技能排序成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
                `OldSkills=[${oldSkills.join(',')}], NewSkills=[${newSkills.join(',')}]`);
            // 7. 发送成功响应（空包）
            await this.Player.SendPacket(new PacketSkillSort_1.PacketSkillSort());
        }
        catch (error) {
            utils_1.Logger.Error(`[PetManager] HandleSkillSort failed`, error);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.Skill_Sort).setResult(5000));
        }
        finally {
            release();
        }
    }
    /**
     * 获取精灵技能
     * CMD: 2336
     * 只返回当前等级已学会的技能
     */
    async HandleGetPetSkill(catchTime) {
        try {
            const pet = this.PetData.GetPetByCatchTime(catchTime);
            if (!pet) {
                utils_1.Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GET_PET_SKILL).setResult(5001));
                return;
            }
            // 获取精灵配置
            const petConfig = GameConfig_1.GameConfig.GetPetById(pet.petId);
            if (!petConfig) {
                utils_1.Logger.Warn(`[PetManager] 精灵配置不存在: PetId=${pet.petId}`);
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GET_PET_SKILL).setResult(5001));
                return;
            }
            // 构建技能ID到学习等级的映射
            const skillLevelMap = new Map();
            if (petConfig.LearnableMoves?.Move) {
                const moves = Array.isArray(petConfig.LearnableMoves.Move)
                    ? petConfig.LearnableMoves.Move
                    : [petConfig.LearnableMoves.Move];
                for (const move of moves) {
                    skillLevelMap.set(move.ID, move.LearningLv);
                }
            }
            // 获取已装备的技能集合
            const equippedSkills = new Set(pet.skillArray.filter(id => id > 0));
            // 获取所有可学习但未装备的技能（使用Set去重）
            const skillSet = new Set();
            for (const [skillId, learnLevel] of skillLevelMap) {
                // 跳过已装备的技能
                if (equippedSkills.has(skillId)) {
                    utils_1.Logger.Debug(`[PetManager] 跳过已装备技能: SkillId=${skillId}`);
                    continue;
                }
                // 检查等级是否满足
                if (pet.level >= learnLevel) {
                    skillSet.add(skillId);
                }
                else {
                    utils_1.Logger.Debug(`[PetManager] 等级不足: SkillId=${skillId}, Required=${learnLevel}, Current=${pet.level}`);
                }
            }
            // 转换为数组
            const skills = Array.from(skillSet);
            await this.Player.SendPacket(new PacketGetPetSkill_1.PacketGetPetSkill(skills));
            utils_1.Logger.Info(`[PetManager] 获取精灵技能: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, ` +
                `SkillCount=${skills.length}, Skills=[${skills.join(',')}], ` +
                `Equipped=[${Array.from(equippedSkills).join(',')}]`);
        }
        catch (error) {
            utils_1.Logger.Error(`[PetManager] HandleGetPetSkill failed`, error);
            await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GET_PET_SKILL).setResult(5000));
        }
    }
}
exports.PetManager = PetManager;
//# sourceMappingURL=PetManager.js.map