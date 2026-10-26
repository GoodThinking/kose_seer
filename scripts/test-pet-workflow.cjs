'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { GameConfig } = load('shared/config/game/GameConfig');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { PetCalculator } = load('GameServer/Game/Pet/PetCalculator');
const { EssenceHatching } = load('GameServer/Game/Pet/EssenceHatching');
const { BuyCoinProduct } = load('GameServer/Game/Item/CoinProductPurchase');
const { ItemSystem } = load('GameServer/Game/Item/ItemSystem');
const workflow = load('GameServer/Server/Packet/Recv/NoNo/PetWorkflowHandlers');
const db = DatabaseManager.Instance;
const database = path.join(os.tmpdir(), 'seer-workflow-' + crypto.randomBytes(10).toString('hex') + '.sqlite');
const players = [], results = [];
let nextCatch = 1820000000, sequence = 0;
async function account(name) {
  const uid = await new AccountRepository().CreateAccount(name + '-' + crypto.randomBytes(5).toString('hex') + '@workflow.invalid', crypto.createHash('md5').update('PrivateWorkflow1026!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } }, packets = [];
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.SendPacket = async packet => packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize(player.ClientProtocol) });
  await player.Initialize(); player.Data.hasNono = true; player.Data.mapID = 5;
  players.push(player); return { player, packets };
}
async function pet(player, id, level = 100, storage = false) {
  const catchTime = nextCatch++;
  await player.PetManager.GivePet(id, level, catchTime, undefined, storage);
  return player.PetManager.PetData.GetPetByCatchTime(catchTime);
}
async function update(player, value, changes) { await player.PetManager.PetData.CommitPetUpdate(value, { ...value, ...changes }); }
const handlers = { 91020: workflow.PetStorageSwapHandler, 91021: workflow.PetTrainingHandler, 91022: workflow.ConsumableRestockHandler, 91023: workflow.HatchStatusHandler };
async function call(context, command, input) {
  const requestId = 'test-' + ++sequence;
  await new handlers[command]().Handle(context.player.Session, {}, Buffer.from(JSON.stringify({ version: 1, requestId, ...input })));
  for (const packet of context.packets.toReversed()) {
    if (packet.command !== command) continue;
    const length = packet.body.readUInt32BE(0), value = JSON.parse(packet.body.subarray(4, length + 4).toString());
    if (value.requestId === requestId) return value;
  }
  throw new Error('Missing correlated workflow response ' + requestId);
}
async function storedPets(player) { return JSON.parse((await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [player.Uid]))[0].pet_list); }
async function storedItems(player) { return JSON.parse((await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [player.Uid]))[0].item_list); }
async function test(name, action) { await action(); results.push(name); }
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  Config.Config.database = { type: 'sqlite', path: database };
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();
  const owner = await account('Workflow'), other = await account('Isolation');
  const p = owner.player;
  p.Data.coins = 1000000; p.Data.allocatableExp = 5000000;
  const youngster = await pet(p, 1, 14);
  await update(p, youngster, { exp: PetCalculator.ExpForNextLevel(14, 1) - 7 });
  await DataSaver.Instance.SaveUser(p.Uid);
  await test('Training preview does not mutate pet or experience pool', async () => {
    const before = JSON.stringify(p.PetManager.PetData.PetList), pool = p.Data.allocatableExp;
    const view = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 20 });
    assert.equal(view.ok, true); assert.equal(view.preview.target, 20); assert.equal(view.preview.from, 14);
    assert.ok(view.preview.forms.some(form => form.id === 2));
    assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); assert.equal(p.Data.allocatableExp, pool);
  });
  await test('Target allocation reaches exact level through evolution and persists exact pool deduction', async () => {
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 20 });
    const before = p.Data.allocatableExp;
    const value = await call(owner, 91021, { operation: 'apply', catchTime: youngster.catchTime, target: 20, revision: preview.preview.revision });
    assert.equal(value.ok, true, value.error); assert.equal(youngster.level, 20); assert.equal(youngster.petId, 2); assert.equal(youngster.exp, 0);
    assert.equal(before - p.Data.allocatableExp, preview.preview.cost);
    const saved = (await storedPets(p)).find(entry => entry.catchTime === youngster.catchTime);
    assert.equal(saved.level, 20); assert.equal(saved.petId, 2);
    assert.equal((await db.Query('SELECT allocatable_exp FROM players WHERE user_id=?', [p.Uid]))[0].allocatable_exp, p.Data.allocatableExp);
  });
  await test('Changed pool rejects old training preview without consuming additional experience', async () => {
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 21 });
    p.Data.allocatableExp += 1; const before = p.Data.allocatableExp;
    const value = await call(owner, 91021, { operation: 'apply', catchTime: youngster.catchTime, target: 21, revision: preview.preview.revision });
    assert.equal(value.ok, false); assert.equal(youngster.level, 20); assert.equal(p.Data.allocatableExp, before);
  });
  await test('Insufficient experience and invalid target cannot change the pet', async () => {
    p.Data.allocatableExp = 0; await DataSaver.Instance.SaveUser(p.Uid); const before = JSON.stringify(youngster);
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 100 });
    assert.equal(preview.preview.affordable, false);
    assert.equal((await call(owner, 91021, { operation: 'apply', catchTime: youngster.catchTime, target: 100, revision: preview.preview.revision })).ok, false);
    assert.equal((await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 101 })).ok, false);
    assert.equal(JSON.stringify(youngster), before); assert.equal(p.Data.allocatableExp, 0); p.Data.allocatableExp = 5000000;
    await DataSaver.Instance.SaveUser(p.Uid);
  });
  await test('Duplicate confirmed target allocation succeeds only once', async () => {
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 21 });
    const before = p.Data.allocatableExp, input = { operation: 'apply', catchTime: youngster.catchTime, target: 21, revision: preview.preview.revision };
    const values = await Promise.all([call(owner, 91021, input), call(owner, 91021, input)]);
    assert.equal(values.filter(value => value.ok).length, 1); assert.equal(youngster.level, 21); assert.equal(before - p.Data.allocatableExp, preview.preview.cost);
  });
  await test('Training save failure rolls back the pool and pet in memory and storage together', async () => {
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 22 });
    const pool = p.Data.allocatableExp, before = JSON.stringify(youngster);
    await db.Execute(`CREATE TRIGGER reject_workflow_exp BEFORE UPDATE ON player_pets WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'forced workflow experience save failure'); END`);
    try {
      const value = await call(owner, 91021, { operation: 'apply', catchTime: youngster.catchTime, target: 22, revision: preview.preview.revision });
      assert.equal(value.ok, false); assert.equal(JSON.stringify(youngster), before); assert.equal(p.Data.allocatableExp, pool);
      assert.equal((await db.Query('SELECT allocatable_exp FROM players WHERE user_id=?', [p.Uid]))[0].allocatable_exp, pool);
      assert.deepEqual((await storedPets(p)).find(entry => entry.catchTime === youngster.catchTime), JSON.parse(before));
    } finally { await db.Execute('DROP TRIGGER reject_workflow_exp'); }
  });
  await test('A valid swap and experience preview cannot be applied after battle entry', async () => {
    const reserve = await pet(p, 303, 100, true), view = await call(owner, 91020, { operation: 'state' });
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: youngster.catchTime, target: 22 });
    const manager = p.BattleManager, combat = (id, identity) => manager._initService.BuildBattlePet(id, GameConfig.GetPetById(id).DefName, 100, 1000, 1000, 200, 200, 200, 200, 100, GameConfig.GetPetById(id).Type, [10001], identity, 0);
    const battle = { userId: p.Uid, turn: 1, player: combat(303, 1900000000), enemy: combat(216, 1900000001), battleType: 'PVE', pendingEntry: {} };
    load('GameServer/Game/Battle/BattleExperience').BattleExperience.Ensure(battle);
    const before = JSON.stringify(p.PetManager.PetData.PetList), pool = p.Data.allocatableExp;
    manager.InitializeBattle(battle);
    try {
      assert.equal((await call(owner, 91020, { operation: 'swap', catchTime: reserve.catchTime, slot: 0, revision: view.revision })).ok, false);
      assert.equal((await call(owner, 91021, { operation: 'apply', catchTime: youngster.catchTime, target: 22, revision: preview.preview.revision })).ok, false);
      assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); assert.equal(p.Data.allocatableExp, pool);
    } finally { manager.CleanupBattle(); }
  });
  const almost = await pet(p, 70, 99);
  await update(p, almost, { exp: PetCalculator.ExpForNextLevel(99, 70) - 3 });
  await test('99 to 100 consumes only remaining experience; full-level pet cannot consume again', async () => {
    const preview = await call(owner, 91021, { operation: 'preview', catchTime: almost.catchTime, target: 100 });
    assert.equal(preview.preview.cost, 3);
    const before = p.Data.allocatableExp;
    assert.equal((await call(owner, 91021, { operation: 'apply', catchTime: almost.catchTime, target: 100, revision: preview.preview.revision })).ok, true);
    assert.equal(almost.level, 100); assert.equal(before - p.Data.allocatableExp, 3);
    assert.equal((await call(owner, 91021, { operation: 'preview', catchTime: almost.catchTime, target: 100 })).ok, false);
  });
  while (p.PetManager.PetData.GetPetsInBag().length < 6) await pet(p, 303);
  const reserve = await pet(p, 216, 100, true);
  await update(p, reserve, { hp: 17, skillPP: Object.fromEntries(reserve.skillArray.map(id => [id, 0])) });
  await test('Full-bag slot exchange preserves HP PP default order and both pets', async () => {
    const beforeBag = p.PetManager.PetData.GetPetsInBag(), removed = beforeBag[0], count = p.PetManager.PetData.PetList.length;
    const view = await call(owner, 91020, { operation: 'state' });
    const value = await call(owner, 91020, { operation: 'swap', catchTime: reserve.catchTime, slot: 0, revision: view.revision });
    assert.equal(value.ok, true, value.error); const bag = p.PetManager.PetData.GetPetsInBag();
    assert.deepEqual(bag.map(entry => entry.catchTime), [reserve.catchTime, ...beforeBag.slice(1).map(entry => entry.catchTime)]);
    assert.equal(reserve.isDefault, true); assert.equal(removed.isInBag, false); assert.equal(removed.isDefault, false);
    assert.equal(reserve.hp, 17); assert.ok(Object.values(reserve.skillPP).every(pp => pp === 0)); assert.equal(p.PetManager.PetData.PetList.length, count);
    assert.equal((await storedPets(p)).find(entry => entry.catchTime === reserve.catchTime).isInBag, true);
  });
  await test('Stale and foreign storage requests cannot change party or access another account', async () => {
    const view = await call(owner, 91020, { operation: 'state' });
    const foreign = await pet(other.player, 3, 100, true);
    const before = JSON.stringify(p.PetManager.PetData.PetList);
    assert.equal((await call(owner, 91020, { operation: 'swap', catchTime: foreign.catchTime, slot: 0, revision: view.revision })).ok, false);
    assert.equal((await call(owner, 91020, { operation: 'swap', catchTime: youngster.catchTime, slot: 0, revision: 'stale' })).ok, false);
    assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); assert.equal(foreign.isInBag, false);
  });
  await test('Storage persistence failure preserves both memory and durable party', async () => {
    const candidate = p.PetManager.PetData.GetPetsInStorage()[0], view = await call(owner, 91020, { operation: 'state' });
    const before = JSON.stringify(p.PetManager.PetData.PetList);
    await db.Execute(`CREATE TRIGGER reject_workflow_pet BEFORE UPDATE ON player_pets WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'forced workflow pet save failure'); END`);
    const result = await call(owner, 91020, { operation: 'swap', catchTime: candidate.catchTime, slot: 2, revision: view.revision });
    assert.equal(result.ok, false); assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); assert.deepEqual(await storedPets(p), JSON.parse(before));
    await db.Execute('DROP TRIGGER reject_workflow_pet');
  });
  await test('Empty slot placement appends one pet without healing or duplicating', async () => {
    const value = await pet(other.player, 9, 100, true), view = await call(other, 91020, { operation: 'state' });
    assert.equal(view.bag.length, 0);
    assert.equal((await call(other, 91020, { operation: 'swap', catchTime: value.catchTime, slot: 2, revision: view.revision })).ok, false);
    const result = await call(other, 91020, { operation: 'swap', catchTime: value.catchTime, slot: 0, revision: view.revision });
    assert.equal(result.ok, true); assert.equal(other.player.PetManager.PetData.GetPetsInBag()[0].catchTime, value.catchTime);
  });
  let product;
  await test('Restock catalogue excludes equipment and previews canonical unit price without spending', async () => {
    const state = await call(owner, 91022, { operation: 'state' });
    assert.equal(state.ok, true); assert.equal(state.products.some(entry => entry.itemId === 100020), false);
    product = state.products.find(entry => entry.itemId === 300024); assert.ok(product); assert.equal(product.price, ItemSystem.GetPrice(product.itemId));
    const before = p.Data.coins, inventory = JSON.stringify(p.ItemManager.ItemData.ItemList);
    const preview = await call(owner, 91022, { operation: 'preview', itemId: product.itemId, mode: 'target', amount: product.stock + 20 });
    assert.equal(preview.preview.count, 20); assert.equal(preview.preview.total, product.price * 20); assert.equal(preview.preview.after, before - product.price * 20);
    assert.equal(p.Data.coins, before); assert.equal(JSON.stringify(p.ItemManager.ItemData.ItemList), inventory);
  });
  await test('Confirmed target-stock restock buys only missing units and persists balance and stock', async () => {
    const state = await call(owner, 91022, { operation: 'state' }), row = state.products.find(entry => entry.itemId === product.itemId);
    const preview = await call(owner, 91022, { operation: 'preview', itemId: row.itemId, mode: 'target', amount: row.stock + 20 });
    const before = p.Data.coins;
    const result = await call(owner, 91022, { operation: 'apply', itemId: row.itemId, mode: 'target', amount: row.stock + 20, revision: preview.preview.revision });
    assert.equal(result.ok, true, result.error); assert.equal(result.purchased.count, 20); assert.equal(before - p.Data.coins, row.price * 20);
    assert.equal((await storedItems(p)).find(entry => entry.itemId === row.itemId).count, row.stock + 20);
    assert.equal((await db.Query('SELECT coins FROM players WHERE user_id=?', [p.Uid]))[0].coins, p.Data.coins);
    const duplicate = await call(owner, 91022, { operation: 'apply', itemId: row.itemId, mode: 'target', amount: row.stock + 20, revision: preview.preview.revision });
    assert.equal(duplicate.ok, false); assert.equal(before - p.Data.coins, row.price * 20);
  });
  await test('Already-filled target performs no purchase and charges nothing', async () => {
    const state = await call(owner, 91022, { operation: 'state' }), row = state.products.find(entry => entry.itemId === product.itemId);
    const preview = await call(owner, 91022, { operation: 'preview', itemId: row.itemId, mode: 'target', amount: row.stock });
    assert.equal(preview.preview.count, 0); const before = p.Data.coins;
    const result = await call(owner, 91022, { operation: 'apply', itemId: row.itemId, mode: 'target', amount: row.stock, revision: preview.preview.revision });
    assert.equal(result.ok, true); assert.equal(result.purchased, undefined); assert.equal(p.Data.coins, before);
  });
  await test('Inventory lock guard rejects a restock made stale by a queued original purchase', async () => {
    const preview = await call(owner, 91022, { operation: 'preview', itemId: product.itemId, mode: 'count', amount: 2 });
    const before = p.Data.coins, oldStock = preview.preview.stock;
    const release = await p.ItemManager.ItemData.AcquireReward();
    const normal = BuyCoinProduct(p, 200051, 1);
    const restock = call(owner, 91022, { operation: 'apply', itemId: product.itemId, mode: 'count', amount: 2, revision: preview.preview.revision });
    await new Promise(resolve => setImmediate(resolve));release();
    const normalReceipt = await normal; const result = await restock;
    assert.equal(result.ok, false); assert.equal(before - p.Data.coins, normalReceipt.spentCoins);
    assert.equal((await storedItems(p)).find(entry => entry.itemId === product.itemId).count, oldStock);
  });
  await test('Original ordinary-item route retains the same consumable price and stock semantics', async () => {
    const before = p.Data.coins, stock = p.ItemManager.ItemData.ItemList.find(entry => entry.itemId === product.itemId).count;
    await p.ItemManager.HandleItemBuy(product.itemId, 1);
    assert.equal(before - p.Data.coins, product.price);
    assert.equal((await storedItems(p)).find(entry => entry.itemId === product.itemId).count, stock + 1);
    await DataSaver.Instance.SaveUser(p.Uid);
  });
  await test('Restock save failure rolls back inventory and coins', async () => {
    const preview = await call(owner, 91022, { operation: 'preview', itemId: product.itemId, mode: 'count', amount: 3 });
    const coins = p.Data.coins, inventory = JSON.stringify(p.ItemManager.ItemData.ItemList);
    await db.Execute(`CREATE TRIGGER reject_workflow_item BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'forced workflow item save failure'); END`);
    const value = await call(owner, 91022, { operation: 'apply', itemId: product.itemId, mode: 'count', amount: 3, revision: preview.preview.revision });
    assert.equal(value.ok, false); assert.equal(p.Data.coins, coins); assert.equal(JSON.stringify(p.ItemManager.ItemData.ItemList), inventory);
    assert.equal((await db.Query('SELECT coins FROM players WHERE user_id=?', [p.Uid]))[0].coins, coins); await db.Execute('DROP TRIGGER reject_workflow_item');
  });
  await test('Insufficient funds and out-of-range quantities cannot spend coins or change stock', async () => {
    const coins = p.Data.coins, inventory = JSON.stringify(p.ItemManager.ItemData.ItemList);
    p.Data.coins = 0; await DataSaver.Instance.SaveUser(p.Uid);
    try {
      const preview = await call(owner, 91022, { operation: 'preview', itemId: product.itemId, mode: 'count', amount: 1 });
      assert.ok(preview.preview.after < 0);
      assert.equal((await call(owner, 91022, { operation: 'apply', itemId: product.itemId, mode: 'count', amount: 1, revision: preview.preview.revision })).ok, false);
      for (const amount of [0, -1, 65536]) assert.equal((await call(owner, 91022, { operation: 'preview', itemId: product.itemId, mode: 'count', amount })).ok, false);
      assert.equal(p.Data.coins, 0); assert.equal(JSON.stringify(p.ItemManager.ItemData.ItemList), inventory);
      assert.equal((await db.Query('SELECT coins FROM players WHERE user_id=?', [p.Uid]))[0].coins, 0);
    } finally { p.Data.coins = coins; await DataSaver.Instance.SaveUser(p.Uid); }
  });
  const medicineOwner = await account('Recovery'), medicinePlayer = medicineOwner.player;
  const medicinePet = await pet(medicinePlayer, 3022);
  const pp = load('GameServer/Game/Pet/PetPP');
  await update(medicinePlayer, medicinePet, { hp: medicinePet.maxHp - 25, skillPP: Object.fromEntries(Object.keys(pp.ReconcilePetPP(medicinePet)).map(id => [id, 0])) });
  for (const id of [300011, 300016]) await medicinePlayer.ItemManager.GiveItem(id, 10);
  const medicineHandler = new (load('GameServer/Server/Packet/Recv/Pet/UsePetItemOutOfFightHandler').UsePetItemOutOfFightHandler)();
  async function useMedicine(itemId, catchTime = medicinePet.catchTime) {
    const body = Buffer.alloc(8); body.writeUInt32BE(catchTime); body.writeUInt32BE(itemId, 4);
    const before = medicineOwner.packets.length;
    await medicineHandler.Handle(medicinePlayer.Session, {}, body);
    return medicineOwner.packets.slice(before).find(packet => packet.command === 2326);
  }
  await test('Native out-of-battle HP medicine heals once and atomically consumes one item', async () => {
    const hp = medicinePet.hp, before = medicinePlayer.ItemManager.GetItemCount(300011);
    assert.equal((await useMedicine(300011)).result, 0);
    assert.equal(medicinePet.hp, Math.min(medicinePet.maxHp, hp + Number(GameConfig.GetItemById(300011).HP)));
    assert.equal(medicinePlayer.ItemManager.GetItemCount(300011), before - 1);
    assert.equal((await storedPets(medicinePlayer)).find(entry => entry.catchTime === medicinePet.catchTime).hp, medicinePet.hp);
    assert.equal((await storedItems(medicinePlayer)).find(entry => entry.itemId === 300011).count, before - 1);
  });
  await test('Native PP medicine restores each equipped skill including the independent fifth without healing HP', async () => {
    const hp = medicinePet.hp, before = medicinePlayer.ItemManager.GetItemCount(300016), old = { ...medicinePet.skillPP };
    assert.equal((await useMedicine(300016)).result, 0);
    assert.equal(medicinePet.hp, hp); assert.equal(medicinePlayer.ItemManager.GetItemCount(300016), before - 1);
    for (const id of Object.keys(old)) assert.equal(medicinePet.skillPP[id], Math.min(pp.GetSkillMaxPP(Number(id)), old[id] + Number(GameConfig.GetItemById(300016).PP)));
    assert.deepEqual((await storedPets(medicinePlayer)).find(entry => entry.catchTime === medicinePet.catchTime).skillPP, medicinePet.skillPP);
  });
  await test('Full HP and PP reject recovery without consuming any item', async () => {
    await update(medicinePlayer, medicinePet, { hp: medicinePet.maxHp, skillPP: pp.ReconcilePetPP(medicinePet, true) });
    const items = JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList);
    assert.equal((await useMedicine(300011)).result, 5001); assert.equal((await useMedicine(300016)).result, 5001);
    assert.equal(JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList), items);
  });
  await test('Recovery persistence failure rolls back both pet and medicine stock', async () => {
    await update(medicinePlayer, medicinePet, { hp: medicinePet.maxHp - 30 });
    const before = JSON.stringify(medicinePet), items = JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList);
    await db.Execute(`CREATE TRIGGER reject_workflow_recovery BEFORE UPDATE ON player_pets WHEN NEW.owner_id=${medicinePlayer.Uid} BEGIN SELECT RAISE(ABORT,'forced recovery save failure'); END`);
    try {
      assert.equal((await useMedicine(300011)).result, 5001);
      assert.equal(JSON.stringify(medicinePet), before); assert.equal(JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList), items);
      assert.deepEqual((await storedPets(medicinePlayer)).find(entry => entry.catchTime === medicinePet.catchTime), JSON.parse(before));
      assert.deepEqual(await storedItems(medicinePlayer), JSON.parse(items));
    } finally { await db.Execute('DROP TRIGGER reject_workflow_recovery'); }
  });
  await test('Out-of-battle medicine cannot bypass an active battle turn', async () => {
    const manager = medicinePlayer.BattleManager;
    const combat = (id, identity) => manager._initService.BuildBattlePet(id, GameConfig.GetPetById(id).DefName, 100, 1000, 1000, 200, 200, 200, 200, 100, GameConfig.GetPetById(id).Type, [10001], identity, 0);
    const battle = { userId: medicinePlayer.Uid, turn: 1, player: combat(303, medicinePet.catchTime), enemy: combat(216, 1900000001), battleType: 'PVE', pendingEntry: {} };
    load('GameServer/Game/Battle/BattleExperience').BattleExperience.Ensure(battle);
    const before = JSON.stringify(medicinePet), items = JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList);
    manager.InitializeBattle(battle);
    try {
      assert.equal((await useMedicine(300011)).result, 5001);
      assert.equal(JSON.stringify(medicinePet), before); assert.equal(JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList), items);
    } finally { manager.CleanupBattle(); }
  });
  await test('Recovery rejects another account pet and a pet moved into storage', async () => {
    const items = JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList);
    assert.equal((await useMedicine(300011, youngster.catchTime)).result, 5001);
    await update(medicinePlayer, medicinePet, { isInBag: false, isDefault: false });
    assert.equal((await useMedicine(300011)).result, 5001);
    assert.equal(JSON.stringify(medicinePlayer.ItemManager.ItemData.ItemList), items);
  });
  await test('Hatch status supports a never-used fusion table without creating it', async () => {
    const before = await db.Query('SELECT name FROM sqlite_master WHERE name=?', ['player_soul_beads']);
    const value = await call(owner, 91023, { operation: 'state' }); assert.equal(value.ok, true, value.error); assert.deepEqual(value.jobs, []);
    assert.deepEqual(await db.Query('SELECT name FROM sqlite_master WHERE name=?', ['player_soul_beads']), before);
  });
  const essence = GameConfig.GetAllItems().find(item => Number(item.BreedMonID) > 0 && item.BreedTime && Number(item.BreedMonLv) > 0 && GameConfig.GetPetById(Number(item.BreedMonID)));
  assert.ok(essence); const essenceId = Number(essence.ID);
  await p.ItemManager.GiveItem(essenceId, 1);
  const settings = ConfigLoader.Instance.LoadJson('data/json/essence-hatching.json');
  await new EssenceHatching(p).Start(essenceId);
  await test('Pending hatch read preserves job, inventory and pets, and is account-isolated', async () => {
    const before = p.PetManager.PetData.PetList.length, stock = JSON.stringify(p.ItemManager.ItemData.ItemList);
    const value = await call(owner, 91023, { operation: 'state' });
    assert.equal(value.ok, true); assert.equal(value.jobs[0].ready, false); assert.ok(value.jobs[0].remaining <= settings.durationSeconds);
    assert.equal(p.PetManager.PetData.PetList.length, before); assert.equal(JSON.stringify(p.ItemManager.ItemData.ItemList), stock);
    assert.deepEqual((await call(other, 91023, { operation: 'state' })).jobs, []);
  });
  await db.Execute('UPDATE player_essence_hatches SET ready_at=? WHERE owner_id=?', [Math.floor(Date.now() / 1000) - 1, p.Uid]);
  await test('Ready reminders never grant or consume; original native hatch claim grants exactly once', async () => {
    const before = p.PetManager.PetData.PetList.length;
    for (let i = 0; i < 2; i++) assert.equal((await call(owner, 91023, { operation: 'state' })).jobs[0].ready, true);
    assert.equal(p.PetManager.PetData.PetList.length, before); assert.equal((await db.Query('SELECT COUNT(*) AS count FROM player_essence_hatches WHERE owner_id=?', [p.Uid]))[0].count, 1);
    const result = await new EssenceHatching(p).Get(); assert.equal(result.remaining, 0); assert.ok(result.catchTime);
    assert.equal(p.PetManager.PetData.PetList.length, before + 1); assert.equal((await new EssenceHatching(p).Get()).active, false);
    assert.deepEqual((await call(owner, 91023, { operation: 'state' })).jobs, []);
  });
  await test('Converted fusion bead reminders are owner-isolated and never consume or grant', async () => {
    await db.Execute('CREATE TABLE player_soul_beads (owner_id INTEGER NOT NULL, obtain_time INTEGER NOT NULL, item_id INTEGER NOT NULL, buf BLOB NOT NULL, result_pet INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(owner_id,obtain_time))');
    const buffer = Buffer.alloc(20); buffer[0] = 1;
    await db.Execute('INSERT INTO player_soul_beads(owner_id,obtain_time,item_id,buf,result_pet) VALUES(?,?,?,?,?)', [p.Uid, 1700000000, 1000001, buffer, 301]);
    const before = JSON.stringify(p.PetManager.PetData.PetList), inventory = JSON.stringify(p.ItemManager.ItemData.ItemList);
    for (let i = 0; i < 2; i++) {
      const view = await call(owner, 91023, { operation: 'state' });
      assert.equal(view.jobs[0].kind, 'fusion'); assert.equal(view.jobs[0].ready, true); assert.equal(view.jobs[0].obtainTime, 1700000000);
    }
    assert.deepEqual((await call(other, 91023, { operation: 'state' })).jobs, []);
    assert.equal(JSON.stringify(p.PetManager.PetData.PetList), before); assert.equal(JSON.stringify(p.ItemManager.ItemData.ItemList), inventory);
    assert.deepEqual(Buffer.from((await db.Query('SELECT buf FROM player_soul_beads WHERE owner_id=?', [p.Uid]))[0].buf), buffer);
  });
  await test('Hatch status endpoint rejects mutation requests', async () => { assert.equal((await call(owner, 91023, { operation: 'claim' })).ok, false); });
  console.log(JSON.stringify({ passed: results.length, results, database: 'isolated temporary SQLite only' }, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  if (players.length) for (const trigger of ['reject_workflow_exp', 'reject_workflow_pet', 'reject_workflow_item']) await db.Execute('DROP TRIGGER IF EXISTS ' + trigger);
  for (const player of players) { player.Data?.cleanup(); await DataSaver.Instance.SaveUser(player.Uid); DatabaseHelper.Instance.RemoveCache(player.Uid); }
  await db.Shutdown(); fs.rmSync(database, { force: true }); process.exit(process.exitCode || 0);
});
