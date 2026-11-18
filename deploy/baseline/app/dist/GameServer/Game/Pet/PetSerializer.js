"use strict";
/**
 * 精灵序列化系统
 * 负责将精灵数据序列化为客户端期望的二进制格式
 *
 * 移植自: luvit/luvit_version/game/seer_pet_serializer.lua
 *
 * 序列化格式：
 * - 使用大端序（Big-Endian）
 * - 固定长度字段
 * - 支持完整信息和简化信息两种模式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSerializer = void 0;
const PetCalculator_1 = require("./PetCalculator");
const SptSystem_1 = require("./SptSystem");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const utils_1 = require("../../../shared/utils");
/**
 * 精灵序列化器
 */
class PetSerializer {
    /**
     * 写入32位无符号整数（大端序 Big-Endian）
     *
     * @param value 数值
     * @returns Buffer
     */
    static WriteUInt32BE(value) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32BE(value >>> 0, 0);
        return buffer;
    }
    /**
     * 写入16位无符号整数（大端序 Big-Endian）
     *
     * @param value 数值
     * @returns Buffer
     */
    static WriteUInt16BE(value) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUInt16BE(value & 0xFFFF, 0);
        return buffer;
    }
    /**
     * 写入字符串（固定长度，不足补0）
     *
     * @param str 字符串
     * @param length 固定长度
     * @returns Buffer
     */
    static WriteString(str, length) {
        const buffer = Buffer.alloc(length); // 自动填充0
        const strBuffer = Buffer.from(str, 'utf8');
        const copyLength = Math.min(strBuffer.length, length);
        strBuffer.copy(buffer, 0, 0, copyLength);
        return buffer;
    }
    /**
     * 获取精灵的默认技能
     *
     * 根据精灵种类和等级，获取最后学会的4个技能
     *
     * @param petId 精灵种类ID
     * @param level 等级
     * @returns 技能列表
     */
    static GetDefaultSkills(petId, level) {
        // 从 SPT 配置获取精灵的可学习技能
        const learnableMoves = SptSystem_1.SptSystem.GetDefaultSkills(petId, level);
        if (learnableMoves.length === 0) {
            utils_1.Logger.Warn(`[PetSerializer] 精灵 ${petId} 没有可学习技能`);
            return [];
        }
        const skills = [];
        for (const move of learnableMoves) {
            const skillConfig = GameConfig_1.GameConfig.GetSkillById(move.id);
            const maxPP = skillConfig?.MaxPP || 20;
            skills.push({
                id: move.id,
                pp: maxPP,
                maxPP: maxPP
            });
        }
        return skills;
    }
    /**
     * 从技能ID数组构建技能信息
     *
     * @param skillIds 技能ID数组
     * @returns 技能信息列表
     */
    static BuildSkillsFromIds(skillIds) {
        const skills = [];
        for (const skillId of skillIds) {
            if (skillId === 0) {
                continue; // 跳过空技能槽
            }
            const skillConfig = GameConfig_1.GameConfig.GetSkillById(skillId);
            const maxPP = skillConfig?.MaxPP || 20;
            skills.push({
                id: skillId,
                pp: maxPP,
                maxPP: maxPP
            });
        }
        return skills;
    }
    /**
     * 序列化单个精灵的完整信息
     *
     * @param pet 精灵数据
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePetInfo(pet, fullInfo = true) {
        const parts = [];
        const petId = pet.petId;
        let name = pet.nick || '';
        // 如果昵称为空，使用精灵的默认名字
        if (name === '') {
            const petConfig = GameConfig_1.GameConfig.GetPetById(petId);
            if (petConfig && petConfig.DefName) {
                name = petConfig.DefName;
            }
        }
        const level = pet.level;
        const exp = pet.exp;
        const catchTime = pet.catchTime;
        const catchMap = 0; // TODO: 从配置获取
        const catchLevel = pet.obtainLevel || level;
        const skinID = 0; // TODO: 皮肤系统
        // 计算属性
        const stats = PetCalculator_1.PetCalculator.CalculateStatsFromPet(pet);
        // 技能数据 - 如果没有技能，自动添加默认技能
        let skills = [];
        if (pet.skillArray && pet.skillArray.length > 0) {
            skills = this.BuildSkillsFromIds(pet.skillArray);
        }
        if (skills.length === 0) {
            skills = this.GetDefaultSkills(petId, level);
            if (skills.length > 0) {
                utils_1.Logger.Info(`[PetSerializer] 精灵 ${petId} 没有技能，自动添加 ${skills.length} 个默认技能`);
            }
        }
        const skillNum = Math.min(skills.length, 4);
        // ==================== 序列化开始 ====================
        // id (4 bytes)
        parts.push(this.WriteUInt32BE(petId));
        if (fullInfo) {
            // name (16 bytes)
            parts.push(this.WriteString(name, 16));
            // dv (4 bytes) - 使用平均个体值
            const avgDV = Math.floor((pet.dvHp + pet.dvAtk + pet.dvDef + pet.dvSpAtk + pet.dvSpDef + pet.dvSpeed) / 6);
            parts.push(this.WriteUInt32BE(avgDV));
            // nature (4 bytes)
            parts.push(this.WriteUInt32BE(pet.nature));
            // level (4 bytes)
            parts.push(this.WriteUInt32BE(level));
            // exp (4 bytes)
            parts.push(this.WriteUInt32BE(exp));
            // lvExp (4 bytes)
            parts.push(this.WriteUInt32BE(stats.lvExp));
            // nextLvExp (4 bytes)
            parts.push(this.WriteUInt32BE(stats.nextLvExp));
            // hp (4 bytes)
            parts.push(this.WriteUInt32BE(stats.hp));
            // maxHp (4 bytes)
            parts.push(this.WriteUInt32BE(stats.maxHp));
            // attack (4 bytes)
            parts.push(this.WriteUInt32BE(stats.atk));
            // defence (4 bytes)
            parts.push(this.WriteUInt32BE(stats.def));
            // s_a (4 bytes)
            parts.push(this.WriteUInt32BE(stats.spAtk));
            // s_d (4 bytes)
            parts.push(this.WriteUInt32BE(stats.spDef));
            // speed (4 bytes)
            parts.push(this.WriteUInt32BE(stats.speed));
            // ev_hp (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evHp));
            // ev_attack (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evAtk));
            // ev_defence (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evDef));
            // ev_sa (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evSpAtk));
            // ev_sd (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evSpDef));
            // ev_sp (4 bytes)
            parts.push(this.WriteUInt32BE(pet.evSpeed));
        }
        else {
            // 简化模式：只发送 level, hp, maxHp
            parts.push(this.WriteUInt32BE(level));
            parts.push(this.WriteUInt32BE(stats.hp));
            parts.push(this.WriteUInt32BE(stats.maxHp));
        }
        // skillNum (4 bytes)
        parts.push(this.WriteUInt32BE(skillNum));
        // 4个技能槽（即使 skillNum < 4）
        // 注意：客户端 PetSkillInfo 只读取 id 和 pp
        for (let i = 0; i < 4; i++) {
            const skill = skills[i];
            if (skill) {
                parts.push(this.WriteUInt32BE(skill.id));
                parts.push(this.WriteUInt32BE(skill.pp));
            }
            else {
                // 空技能槽
                parts.push(this.WriteUInt32BE(0));
                parts.push(this.WriteUInt32BE(0));
            }
        }
        // catchTime (4 bytes)
        parts.push(this.WriteUInt32BE(catchTime));
        // catchMap (4 bytes)
        parts.push(this.WriteUInt32BE(catchMap));
        // catchRect (4 bytes)
        parts.push(this.WriteUInt32BE(0)); // 默认为0
        // catchLevel (4 bytes)
        parts.push(this.WriteUInt32BE(catchLevel));
        if (fullInfo) {
            // effectCount (2 bytes)
            parts.push(this.WriteUInt16BE(pet.effectCount));
        }
        // skinID (4 bytes)
        parts.push(this.WriteUInt32BE(skinID));
        return Buffer.concat(parts);
    }
    /**
     * 序列化多个精灵
     *
     * @param pets 精灵数据数组
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePets(pets, fullInfo = true) {
        const parts = [];
        for (const pet of pets) {
            parts.push(this.SerializePetInfo(pet, fullInfo));
        }
        return Buffer.concat(parts);
    }
    /**
     * 计算序列化后的单个精灵数据大小
     *
     * @param fullInfo 是否包含完整信息
     * @returns 字节数
     */
    static GetSerializedSize(fullInfo = true) {
        if (fullInfo) {
            // id(4) + name(16) + dv(4) + nature(4) + level(4) + exp(4) + lvExp(4) + nextLvExp(4)
            // + hp(4) + maxHp(4) + atk(4) + def(4) + spAtk(4) + spDef(4) + speed(4)
            // + evHp(4) + evAtk(4) + evDef(4) + evSpAtk(4) + evSpDef(4) + evSpeed(4)
            // + skillNum(4) + skills(4*2*4=32) + catchTime(4) + catchMap(4) + catchRect(4) + catchLevel(4)
            // + effectCount(2) + skinID(4)
            // = 4 + 16 + 4*21 + 32 + 4*4 + 2 + 4 = 4 + 16 + 84 + 32 + 16 + 2 + 4 = 158
            return 158;
        }
        else {
            // id(4) + level(4) + hp(4) + maxHp(4) + skillNum(4) + skills(32) + catchTime(4) + catchMap(4) + catchRect(4) + catchLevel(4) + skinID(4)
            // = 4 + 4*3 + 4 + 32 + 4*4 + 4 = 4 + 12 + 4 + 32 + 16 + 4 = 72
            return 72;
        }
    }
    /**
     * 序列化精灵列表（带数量前缀）
     *
     * 格式：petCount(4 bytes) + pets data
     *
     * @param pets 精灵数据数组
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePetList(pets, fullInfo = true) {
        const parts = [];
        // petCount (4 bytes)
        parts.push(this.WriteUInt32BE(pets.length));
        // pets data
        if (pets.length > 0) {
            parts.push(this.SerializePets(pets, fullInfo));
        }
        return Buffer.concat(parts);
    }
    /**
     * 序列化精灵背包信息
     *
     * 格式：bagCount(4 bytes) + pets data
     *
     * @param pets 背包中的精灵数据数组
     * @returns Buffer
     */
    static SerializePetBag(pets) {
        return this.SerializePetList(pets, true);
    }
    /**
     * 序列化精灵仓库信息
     *
     * 格式：storageCount(4 bytes) + pets data
     *
     * @param pets 仓库中的精灵数据数组
     * @returns Buffer
     */
    static SerializePetStorage(pets) {
        return this.SerializePetList(pets, false); // 仓库使用简化信息
    }
    /**
     * 序列化战斗精灵信息
     *
     * 用于战斗中的精灵数据传输
     *
     * @param pet 精灵数据
     * @returns Buffer
     */
    static SerializeBattlePet(pet) {
        return this.SerializePetInfo(pet, true);
    }
    /**
     * 调试：打印序列化后的数据（十六进制）
     *
     * @param buffer Buffer数据
     * @param label 标签
     */
    static DebugPrintBuffer(buffer, label = 'Buffer') {
        const hex = buffer.toString('hex').match(/.{1,2}/g)?.join(' ') || '';
        utils_1.Logger.Debug(`[PetSerializer] ${label} (${buffer.length} bytes): ${hex}`);
    }
}
exports.PetSerializer = PetSerializer;
//# sourceMappingURL=PetSerializer.js.map