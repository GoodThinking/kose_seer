'use strict';
const crypto = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const responseContext = new AsyncLocalStorage();
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { DatabaseManager } = require('../../../../../DataBase/DatabaseManager');
const { DatabaseHelper } = require('../../../../../DataBase/DatabaseHelper');
const { GameConfig } = require('../../../../../shared/config/game/GameConfig');
const { ConfigLoader } = require('../../../../../shared/config/ConfigLoader');
const { Logger } = require('../../../../../shared/utils');
const { AdvancePetExperience } = require('../../../../Game/Pet/PetProgression');
const { PetCalculator } = require('../../../../Game/Pet/PetCalculator');
const { ReconcilePetPP } = require('../../../../Game/Pet/PetPP');
const { PlayerRepository } = require('../../../../../DataBase/repositories/Player/PlayerRepository');
const { PacketNoteUpdateSkill } = require('../../Send/Pet/PacketNoteUpdateSkill');
const { ItemSystem } = require('../../../../Game/Item/ItemSystem');
const { GetRewardBoostItem } = require('../../../../Game/Reward/RewardBoost');
const { ItemEventType, ItemGainSource } = require('../../../../Game/Event/EventTypes');

const revision = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
class WorkflowError extends Error {}
class PacketWorkflow extends BaseProto {
  constructor(command, value, player, bag = []) { super(command); this.value = value; this.player = player; this.bag = bag; }
  serialize() {
    const json = Buffer.from(JSON.stringify({ version: 1, ...this.value }), 'utf8');
    const size = Buffer.alloc(4), count = Buffer.alloc(4);
    size.writeUInt32BE(json.length); count.writeUInt32BE(this.bag.length);
    return Buffer.concat([size, json, count, ...this.player.PetManager.GetPetProtoList(this.bag).map(pet => pet.serialize(this.player.ClientProtocol))]);
  }
}
const reply = (player, command, value, bag = []) => player.SendPacket(new PacketWorkflow(command, { requestId: responseContext.getStore()?.requestId || '', ...value }, player, bag));
function request(body) {
  if (!body.length || body.length > 8192) throw new WorkflowError('请求格式错误，请刷新客户端。');
  const value = JSON.parse(body.toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) throw new WorkflowError('功能版本已变化，请刷新客户端。');
  return value;
}
const petName = id => GameConfig.GetPetById(id)?.DefName || '精灵#' + id;
const petBrief = pet => ({ catchTime: pet.catchTime, id: pet.petId, name: petName(pet.petId), level: pet.level, hp: pet.hp, maxHp: pet.maxHp });
const bagRevision = data => revision(data.PetList.map(pet => [pet.catchTime, pet.petId, pet.isInBag, pet.isDefault, pet.bagOrder, pet.course, pet.isRoomShow]));
function storageState(player) {
  const data = player.PetManager.PetData;
  return { ok: true, revision: bagRevision(data), bag: data.GetPetsInBag().map(petBrief) };
}
async function storage(player, input) {
  if (input.operation === 'state') return reply(player, 91020, storageState(player));
  if (input.operation !== 'swap' || !integer(input.catchTime, 1, 0xffffffff) || !integer(input.slot, 0, 5)) throw new WorkflowError('请选择仓库精灵和背包位置。');
  const recovery = player.BattleManager.BeginOutOfBattleRecovery();
  if (!recovery) throw new WorkflowError('战斗或精灵操作尚未结束，请稍后调队。');
  const data = player.PetManager.PetData;
  let release, committed = false;
  try {
    release = await data.AcquireMutation();
    if (!recovery.isCurrent() || data.HasPendingGrant()) throw new WorkflowError('精灵状态正在变化，请刷新仓库。');
    if (input.revision !== bagRevision(data)) throw new WorkflowError('背包已变化，请刷新后重新选择位置。');
    const chosen = data.GetPetByCatchTime(input.catchTime), bag = data.GetPetsInBag();
    if (!chosen || chosen.isInBag || chosen.isReleased || Number(chosen.course) > 0) throw new WorkflowError('该精灵不在可取出的仓库中。');
    if (input.slot > bag.length) throw new WorkflowError('请从第一个空位依次放入精灵。');
    const removed = bag[input.slot];
    if (removed && Number(removed.course) > 0) throw new WorkflowError('目标精灵正在训练，不能替换。');
    bag[input.slot] = chosen;
    const order = new Map(bag.map((pet, index) => [pet.catchTime, index]));
    const planned = data.PetList.map(pet => ({ ...pet,
      isInBag: order.has(pet.catchTime), isDefault: pet.catchTime === bag[0].catchTime,
      bagOrder: order.get(pet.catchTime), isRoomShow: order.has(pet.catchTime) ? false : pet.isRoomShow }));
    await data.CommitPetUpdate(chosen, planned.find(pet => pet.catchTime === chosen.catchTime), staged => {
      staged.PetList = planned;
      return DatabaseHelper.Instance.SavePetData(staged, true);
    }, () => {
      const next = new Map(planned.map(pet => [pet.catchTime, pet]));
      for (const pet of data.PetList) Object.assign(pet, next.get(pet.catchTime));
    });
    committed = true;
    return await reply(player, 91020, { ...storageState(player), changed: true, message: chosen.petId === removed?.petId ? '已替换为选中的另一只同种精灵。' : '背包已更新，体力与PP保持原样。' }, data.GetPetsInBag());
  } catch (error) {
    if (committed) { Logger.Error('[PetWorkflow] Storage committed; do not replay', error); return; }
    throw error;
  } finally { release?.(); recovery.release(); }
}

function planExperience(pet, target) {
  if (!integer(target, pet.level + 1, 100)) throw new WorkflowError(pet.level >= 100 ? '精灵已满级。' : '目标等级必须高于当前等级，且不超过100级。');
  const candidate = JSON.parse(JSON.stringify(pet));
  let cost = 0;
  const skills = new Set(), forms = [];
  while (candidate.level < target) {
    const threshold = PetCalculator.ExpForNextLevel(candidate.level, candidate.petId);
    const increment = threshold - candidate.exp;
    if (!integer(increment, 1, 0x7fffffff)) throw new WorkflowError('当前经验状态需要重新登录同步，暂未分配经验。');
    cost += increment;
    candidate.exp += increment;
    const oldId = candidate.petId, result = AdvancePetExperience(candidate);
    if (candidate.petId !== oldId) forms.push({ level: candidate.level, id: candidate.petId, name: petName(candidate.petId) });
    for (const id of result.newSkills) skills.add(id);
  }
  if (!integer(cost, 1, 0x7fffffff)) throw new WorkflowError('目标经验超出可分配范围。');
  return { candidate, cost, newSkills: [...skills].filter(id => !pet.skillArray.includes(id)), forms };
}
const trainingRevision = (player, pet, target) => revision({ pet, pool: player.Data.allocatableExp, target });
function trainingState(player) {
  return { ok: true, pool: player.Data.allocatableExp, pets: player.PetManager.PetData.GetPetsInBag().map(petBrief) };
}
async function training(player, input) {
  if (input.operation === 'state') return reply(player, 91021, trainingState(player));
  if (!['preview', 'apply'].includes(input.operation) || !integer(input.catchTime, 1, 0xffffffff)) throw new WorkflowError('请选择要培养的精灵。');
  const recovery = player.BattleManager.BeginOutOfBattleRecovery();
  if (!recovery) throw new WorkflowError('战斗或其他精灵操作尚未结束，暂时不能分配经验。');
  const data = player.PetManager.PetData;
  let release, pool, committed = false;
  try {
    release = await data.AcquireMutation();
    if (!recovery.isCurrent() || data.HasPendingGrant()) throw new WorkflowError('精灵状态正在变化，请重新读取。');
    const pet = data.GetPetByCatchTime(input.catchTime);
    if (!pet?.isInBag || Number(pet.course) > 0) throw new WorkflowError('请选择背包中未在训练的精灵。');
    const plan = planExperience(pet, input.target), token = trainingRevision(player, pet, input.target);
    const preview = { ...trainingState(player), preview: { catchTime: pet.catchTime, name: petName(pet.petId), from: pet.level, target: input.target, cost: plan.cost, forms: plan.forms, revision: token, affordable: plan.cost <= player.Data.allocatableExp } };
    if (input.operation === 'preview') return reply(player, 91021, preview);
    if (input.revision !== token) throw new WorkflowError('精灵或经验池已变化，请重新预览。');
    if (plan.cost > player.Data.allocatableExp) throw new WorkflowError('经验池不足，未扣除经验。');
    pool = player.Data.BeginExpAllocation();
    const before = player.Data.allocatableExp, balance = before - plan.cost;
    const activeSkills = plan.newSkills.slice(0, Math.max(0, 4 - plan.candidate.skillArray.length));
    const unactiveSkills = plan.newSkills.slice(activeSkills.length);
    plan.candidate.skillArray.push(...activeSkills);
    plan.candidate.hp = plan.candidate.maxHp;
    plan.candidate.skillPP = ReconcilePetPP(plan.candidate, true);
    await data.CommitPetUpdate(pet, plan.candidate,
      staged => new PlayerRepository().CommitPetExperience(player.Uid, before, balance, staged.ToRow().pet_list), () => pool.publish(balance));
    committed = true;
    pool.release(); pool = null;
    await player.PetManager.sendNoteUpdateProp([pet], 0);
    if (plan.newSkills.length) await player.SendPacket(new PacketNoteUpdateSkill([{ catchTime: pet.catchTime, activeSkills, unactiveSkills }]));
    return await reply(player, 91021, { ...trainingState(player), applied: true, spent: plan.cost, message: '已升至' + pet.level + '级；新技能仍按原生流程处理。' }, data.GetPetsInBag());
  } catch (error) {
    if (committed) { Logger.Error('[PetWorkflow] Training committed; do not replay', error); return; }
    throw error;
  } finally { pool?.release(); release?.(); recovery.release(); }
}

function restockProducts(player) {
  const reserved = new Set(ConfigLoader.Instance.LoadJson('data/json/money-products.json').products.flatMap(product => product.itemIds));
  // Ordinary pet consumables use ITEM_BUY prices, not the clothing MONEY_BUY_PRODUCT catalogue.
  return GameConfig.GetAllItems().filter(item => {
    const id = Number(item.ID);
    return id >= 300000 && id < 400000 && Number(item.Hide || 0) === 0 && !reserved.has(id) &&
      !ItemSystem.IsUniqueItem(id) && !GetRewardBoostItem(id) && integer(ItemSystem.GetPrice(id), 1, 0x7fffffff);
  }).map(item => {
    const itemId = Number(item.ID);
    return { itemId, name: item.Name, price: ItemSystem.GetPrice(itemId),
      stock: player.ItemManager.ItemData.ItemList.find(entry => entry.itemId === itemId)?.count || 0, max: ItemSystem.GetMaxStack(itemId) };
  }).sort((a, b) => a.itemId - b.itemId);
}
async function buyRestock(player, itemId, count, expected) {
  const inventory = player.ItemManager.ItemData;
  let release = await inventory.AcquireReward(), gate;
  try {
    await player.Data.WaitForExpAllocation();
    await player.Data.WaitForCurrencyOperations();
    if (player.Session.Socket.destroyed || player.Session.Player !== player) throw new WorkflowError('连接已结束，请重新登录。');
    const product = restockProducts(player).find(item => item.itemId === itemId);
    if (!product || product.stock !== expected.stock || product.price !== expected.price) throw new WorkflowError('库存或价格已变化，请重新预览。');
    const spentCoins = product.price * count;
    if (!integer(count, 1, 65535) || !integer(spentCoins, 1, 0x7fffffff) || product.stock + count > product.max) throw new WorkflowError('购买数量超过库存上限。');
    gate = player.Data.BeginBalanceReward();
    const staged = inventory.ItemList.map(item => ({ ...item })), previous = staged.find(item => item.itemId === itemId);
    if (previous) previous.count += count;
    else staged.push({ itemId, count, expireTime: 0x057E40 });
    const receipt = await DatabaseManager.Instance.WithConnection(async driver => {
      await driver.beginTransaction();
      let committed = false;
      try {
        const [row] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id=?', [player.Uid]);
        if (!row) throw new Error('Restock buyer missing');
        const dirty = player.Data.GetDirtyFields(), keys = ['coins', 'gold', 'allocatableExp'], stored = [row.coins, row.gold, row.allocatable_exp];
        const balances = keys.map((key, index) => {
          const cached = player.Data[key];
          if (!dirty.includes(key) && cached !== stored[index]) throw new Error('Restock wallet cache stale');
          const balance = dirty.includes(key) ? cached : stored[index];
          if (!integer(balance, 0, 0x7fffffff)) throw new Error('Invalid restock wallet');
          return balance;
        });
        if (balances[0] !== expected.coins) throw new WorkflowError('余额已变化，请重新预览。');
        if (balances[0] < spentCoins) throw new WorkflowError('赛尔豆不足，本次未购买。');
        balances[0] -= spentCoins;
        const items = await driver.execute('UPDATE player_items SET item_list=? WHERE owner_id=?', [JSON.stringify(staged), player.Uid]);
        const money = await driver.execute('UPDATE players SET coins=?, gold=?, allocatable_exp=? WHERE user_id=?', [...balances, player.Uid]);
        if (items.affectedRows !== 1 || money.affectedRows !== 1) throw new Error('Restock purchase was not saved');
        await driver.commit(); committed = true;
        gate.publish(balances[0], balances[1], balances[2]);
        inventory.ItemList = staged;
        return { spentCoins, coins: balances[0] };
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
    gate.release(); gate = null; release(); release = null;
    try { await player.EventBus.Emit({ type: ItemEventType.ITEM_GAINED, timestamp: Date.now(), playerId: player.Uid, itemId, count, source: ItemGainSource.BUY }); }
    catch (error) { Logger.Error('[PetWorkflow] Restock committed; acquisition notification failed', error); }
    return receipt;
  } finally { gate?.release(); release?.(); }
}
function restockState(player) { return { ok: true, coins: player.Data.coins, products: restockProducts(player) }; }
async function restock(player, input) {
  if (input.operation === 'state') return reply(player, 91022, restockState(player));
  if (!['preview', 'apply'].includes(input.operation) || !['count', 'target'].includes(input.mode) || !integer(input.amount, 1, 65535)) throw new WorkflowError('请输入1至65535的购买数量或目标库存。');
  const product = restockProducts(player).find(row => row.itemId === input.itemId);
  if (!product) throw new WorkflowError('该道具当前不能用赛尔豆补货。');
  const count = input.mode === 'target' ? Math.max(0, input.amount - product.stock) : input.amount;
  const total = product.price * count;
  if (count > 65535 || product.stock + count > product.max || !integer(total, 0, 0x7fffffff)) throw new WorkflowError('购买数量超过库存上限。');
  const expected = { stock: product.stock, coins: player.Data.coins, price: product.price };
  const token = revision({ product, expected, mode: input.mode, amount: input.amount });
  const preview = { ...restockState(player), preview: { ...product, mode: input.mode, amount: input.amount, count, total, after: player.Data.coins - total, revision: token } };
  if (input.operation === 'preview') return reply(player, 91022, preview);
  if (input.revision !== token) throw new WorkflowError('库存、余额或价格已变化，请重新预览。');
  if (!count) return reply(player, 91022, { ...restockState(player), message: '库存已经足够，本次未购买、未扣款。' });
  if (total > player.Data.coins) throw new WorkflowError('赛尔豆不足，本次未购买。');
  const receipt = await buyRestock(player, product.itemId, count, expected);
  return reply(player, 91022, { ...restockState(player), purchased: { itemId: product.itemId, count, spent: receipt.spentCoins }, message: '已购买' + count + '个' + product.name + '，扣除' + receipt.spentCoins + '赛尔豆。' });
}

async function hatch(player, input) {
  if (input.operation !== 'state') throw new WorkflowError('孵化状态只允许查询。');
  const now = Math.floor(Date.now() / 1000);
  const rows = await DatabaseManager.Instance.Query('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [player.Uid]);
  const jobs = rows.map(row => ({ key: 'essence:' + row.item_id + ':' + row.ready_at, kind: 'essence', itemId: row.item_id,
    petId: row.pet_id, name: petName(row.pet_id), level: row.pet_level, due: row.ready_at, remaining: Math.max(0, row.ready_at - now), ready: row.ready_at <= now }));
  // Fusion beads use an immediate, explicitly triggered native conversion, not a second timed incubator.
  // The legacy fusion handler creates this table lazily. A status read must not create it.
  const db = DatabaseManager.Instance;
  const tables = db.DatabaseType === 'mysql'
    ? await db.Query('SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?', ['player_soul_beads'])
    : await db.Query('SELECT name FROM sqlite_master WHERE type=? AND name=?', ['table', 'player_soul_beads']);
  const beads = tables.length ? await db.Query('SELECT obtain_time, item_id, buf FROM player_soul_beads WHERE owner_id = ? ORDER BY obtain_time', [player.Uid]) : [];
  for (const row of beads) {
    const ready = row.buf && Buffer.from(row.buf)[0] === 1;
    if (ready) jobs.push({ key: 'fusion:' + row.obtain_time, kind: 'fusion', itemId: row.item_id, obtainTime: row.obtain_time, name: GameConfig.GetItemById(row.item_id)?.Name || '融合元神珠', ready: true, due: 0, remaining: 0 });
  }
  return reply(player, 91023, { ok: true, serverNow: now, hasNono: !!player.Data.hasNono, jobs });
}
const operations = [[91020, storage], [91021, training], [91022, restock], [91023, hatch]];
const exportsNames = ['PetStorageSwapHandler', 'PetTrainingHandler', 'ConsumableRestockHandler', 'HatchStatusHandler'];
operations.forEach(([command, operation], index) => {
  class WorkflowHandler {
    async Handle(session, _head, body) {
      const player = session.Player;
      if (!player) return;
      let input;
      try { input = request(body); }
      catch { return reply(player, command, { ok: false, error: '请求格式错误，请刷新客户端。' }); }
      return responseContext.run({ requestId: input.requestId }, async () => {
        try { return await operation(player, input); }
        catch (error) {
          if (!(error instanceof WorkflowError)) Logger.Error('[PetWorkflow] Failed; writes are never automatically replayed', error);
          return reply(player, command, { ok: false, error: error instanceof WorkflowError ? error.message : error.code === 10016 ? '赛尔豆不足，本次未购买。' : error.code === 5001 ? '库存或余额已变化，请重新预览。' : '操作未确认，请刷新实际状态；不会自动重试。' });
        }
      });
    }
  }
  Object.defineProperty(WorkflowHandler, 'name', { value: exportsNames[index] });
  Opcode(command, InjectType.NONE)(WorkflowHandler);
  exports[exportsNames[index]] = WorkflowHandler;
});
exports.PetWorkflow = { planExperience, trainingRevision, storageState, restockState, PacketWorkflow };
