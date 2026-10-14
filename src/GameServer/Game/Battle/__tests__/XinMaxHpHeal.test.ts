import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { SkillEffectsConfig } from '../../../../shared/config/game/SkillEffectsConfig';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { BaseProto } from '../../../../shared/proto/base/BaseProto';
import { HeadInfo } from '../../../../shared/protocol/HeadInfo';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { GameEventBus } from '../../Event/GameEventBus';
import { IClientSession } from '../../../Server/Packet/IHandler';
import { UseSkillHandler } from '../../../Server/Packet/Recv/Battle/UseSkillHandler';
import { BattleManager } from '../BattleManager';
import { createMockBattlePet } from './BattleTestHelpers';
import { EffectTrigger } from '../EffectTrigger';
import { EffectTiming } from '../effects/core/EffectContext';
import { ISkillConfig } from '../../../../shared/models/SkillModel';

describe('XIN skill SideEffect43: maximum HP / n through real battle turns', () => {
  const uid = 191201;
  let player: PlayerInstance, battle: IBattleInfo;
  const packets: Array<{cmd: number; body: Buffer}> = [];
  beforeAll(async () => {
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.SKILL_EFFECTS_V2, ConfigPaths[ConfigKeys.SKILL_EFFECTS_V2], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await SkillEffectsConfig.Instance.Load();
  });
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    packets.length = 0;
    // Transport and initial state only are fixtures. Handler, manager, PP, skill loading,
    // AI, executor, effect mapping/application, converter and 2505 serializer are real.
    player = {
      Uid: uid, ClientProtocol: 'xin-20261013', Data: {mapID: 12}, EventBus: new GameEventBus(),
      SendPacket: async (p: BaseProto) => {packets.push({cmd: p.getCmdId(), body: p.serialize()});},
    } as unknown as PlayerInstance;
    player.BattleManager = new BattleManager(player);
  });
  afterEach(() => jest.restoreAllMocks());

  function seed(skillId = 20027, hp = 100, maxHp = 501) {
    const configured = GameConfig.GetPetConfig()!.Monsters.Monster;
    const monsters = Array.isArray(configured) ? configured : [configured];
    const owner = skillId === 20027 ? GameConfig.GetPetById(47)! : monsters.find(p => {
      const moves = p?.LearnableMoves?.Move;
      return (Array.isArray(moves) ? moves : [moves]).some(m => m?.ID === skillId);
    })!;
    expect(owner).toBeDefined();
    const learned = owner.LearnableMoves!.Move;
    const move = (Array.isArray(learned) ? learned : [learned]).find(m => m?.ID === skillId)!;
    const skill = GameConfig.GetSkillById(skillId)!;
    battle = {userId: uid, turn: 0, isOver: false, startTime: Date.now(),
      player: createMockBattlePet({id: owner.ID, petId: owner.ID, name: owner.DefName,
        level: Math.max(24, move.LearningLv), type: owner.Type, hp, maxHp, speed: 500,
        skills: [skillId], skillPP: [skill.MaxPP], catchTime: 1700001201}),
      // A lawful Lv24 mushroom using only its learned no-damage recovery move.
      enemy: createMockBattlePet({id: 47, petId: 47, name: '蘑菇怪', level: 24,
        hp: 100000, maxHp: 100000, speed: 1, skills: [20027], skillPP: [10],
        catchTime: 1700001202}),
    };
    (player.BattleManager as any)._currentBattle = battle;
    return skill;
  }
  async function use(id = 20027) {
    const body = Buffer.alloc(4); body.writeUInt32BE(id);
    await new UseSkillHandler().Handle({Player: player} as IClientSession, new HeadInfo(), body);
    const bytes = packets.filter(p => p.cmd === 2505).slice(-1)[0].body;
    // Fixed currentcore AttackValue order (body, not packet-header offsets).
    return {uid: bytes.readUInt32BE(0), skill: bytes.readUInt32BE(4), damage: bytes.readUInt32BE(12),
      gain: bytes.readInt32BE(16), hp: bytes.readInt32BE(20), maxHp: bytes.readUInt32BE(24),
      count: bytes.readUInt32BE(32), skillListId: bytes.readUInt32BE(36), pp: bytes.readUInt32BE(40)};
  }

  test('legal mushroom Lv24 recovery is applied once, reported in 2505, and continues next round', async () => {
    const skill = seed();
    expect(GameConfig.GetPetById(47)!.LearnableMoves!.Move).toContainEqual({ID: 20027, LearningLv: 24});
    expect(skill).toMatchObject({ID: 20027, SideEffect: 43, SideEffectArg: 2, MaxPP: 10, MustHit: 1});
    expect(await use()).toEqual({uid, skill: 20027, damage: 0, gain: 250, hp: 350, maxHp: 501,
      count: 1, skillListId: 20027, pp: 9});
    expect(battle.player.hp).toBe(350); expect(battle.turn).toBe(1);
    expect(await use()).toMatchObject({gain: 151, hp: 501, pp: 8});
    expect(battle.player.hp).toBe(501); expect(battle.turn).toBe(2);
    expect(battle.isOver).toBe(false);
  });
  test.each([[501, 0], [500, 1]])('HP=%i caps recovery at missing HP, still spends PP', async (hp, gain) => {
    seed(20027, hp);
    expect(await use()).toMatchObject({gain, hp: 501, pp: 9});
    expect(battle.player.hp).toBe(501);
  });
  test.each([[20337, 1], [20027, 2], [20078, 3], [20034, 4], [12691, 5], [12840, 8], [11378, 10]])(
    'configured skill %i uses divisor %i, not hardcoded half HP', async (id, n) => {
      const skill = seed(id, 1);
      expect(skill.SideEffect).toBe(43); expect(Number(skill.SideEffectArg)).toBe(n);
      const gain = Math.min(Math.floor(501 / n), 500);
      expect(await use(id)).toMatchObject({skill: id, gain, hp: 1 + gain, pp: skill.MaxPP - 1});
      expect(battle.player.hp).toBe(1 + gain);
    });
  test('43 inside a real compound skill consumes exactly one argument before effect4', async () => {
    seed(12065, 1);
    expect(await use(12065)).toMatchObject({gain: 50, hp: 51});
    expect(battle.player.hp).toBe(51);
  });
  test('43 after zero-argument effect3 gets its own n', async () => {
    seed(20400, 1);
    expect(await use(20400)).toMatchObject({gain: 167, hp: 168});
  });
  test('a missed damaging recovery skill spends PP but does not apply an unreported heal', async () => {
    const skill = seed(11378, 100);
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(await use(11378)).toMatchObject({gain: 0, hp: 100, damage: 0, pp: skill.MaxPP - 1});
    expect(battle.player.hp).toBe(100);
  });
  test('skill mapping is absent at other phases; unrelated skill and pet alone do not heal', async () => {
    seed(10001, 100);
    expect(await use(10001)).toMatchObject({gain: 0, hp: 100});
    const s = {id: 20027, sideEffect: 43, sideEffectArg: 2} as ISkillConfig;
    expect(EffectTrigger.TriggerSkillEffect(s, battle.player, battle.enemy, 0, EffectTiming.AFTER_SKILL)).toEqual([]);
    expect(battle.player.hp).toBe(100);
  });
  test.each([undefined, 0, -1, NaN, Infinity])('invalid divisor %s cannot silently heal', value => {
    seed();
    const s = {id: 20027, sideEffect: 43, sideEffectArg: value} as ISkillConfig;
    expect(EffectTrigger.TriggerSkillEffect(s, battle.player, battle.enemy, 0, EffectTiming.AFTER_DAMAGE_APPLY)).toEqual([]);
    expect(battle.player.hp).toBe(100);
  });
});
