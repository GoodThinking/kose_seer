import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { SkillEffectsConfig } from '../../../../shared/config/game/SkillEffectsConfig';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { BattleTurnService } from '../services/BattleTurnService';
import { BattleConverter } from '../BattleConverter';
import { PacketNoteUseSkill } from '../../../Server/Packet/Send/Battle/PacketNoteUseSkill';
import { EffectApplicator } from '../EffectApplicator';
import { HealEffect } from '../effects/atomic/heal/HealEffects';
import { createMockBattlePet } from './BattleTestHelpers';

describe('R13: configured healing is applied exactly once by the real turn pipeline', () => {
  beforeAll(async () => {
    ConfigRegistry.Instance.Register(ConfigKeys.SKILL_CONFIG, ConfigPaths[ConfigKeys.SKILL_CONFIG], ConfigType.XML);
    ConfigRegistry.Instance.Register(ConfigKeys.SKILL_EFFECTS_V2, ConfigPaths[ConfigKeys.SKILL_EFFECTS_V2], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
    await SkillEffectsConfig.Instance.Load();
  });
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => jest.restoreAllMocks());

  // Actual skills/effect definitions, never replacements registered for the test.
  // 14293 is a real configured skill but has no local learning owner: this suite
  // exercises engine settlement, not a lawful acquisition/learning workflow.
  const samples = [
    {id: 10002, effect: 1, mode: 'damage_percent', value: 0.5},
    {id: 14293, effect: 466, mode: 'fixed', value: 50},
  ];
  const states = [{hp: 100, label: 'normal deficit'}, {hp: 999999, label: 'missing one HP'},
    {hp: 1000000, label: 'full HP'}];

  for (const sample of samples) {
    test.each(states)(sample.mode + ': $label reports the actual recovery in 2505', ({hp}) => {
      const skill = GameConfig.GetSkillById(sample.id)!;
      expect(Number(skill.SideEffect)).toBe(sample.effect);
      const config = SkillEffectsConfig.Instance.GetEffectById(sample.effect)!;
      expect(config.atomicComposition.atoms).toEqual([
        {type: 'heal', target: 'self', mode: sample.mode, value: sample.value},
      ]);
      const battle: IBattleInfo = {
        userId: 191301, turn: 0, isOver: false, startTime: Date.now(),
        player: createMockBattlePet({id: 1, petId: 1, level: 9, hp, maxHp: 1000000,
          attack: 1, spAtk: 1, speed: 500, skills: [sample.id], skillPP: [skill.MaxPP]}),
        enemy: createMockBattlePet({id: 47, petId: 47, level: 24, hp: 1000000, maxHp: 1000000,
          defence: 100000, spDef: 100000, speed: 1, skills: [20027], skillPP: [10]}),
      };
      const apply = jest.spyOn(EffectApplicator, 'Apply'); // Records; calls the real implementation.
      const result = new BattleTurnService().ExecuteTurn(battle, sample.id);
      expect(result.isOver).toBe(false); expect(battle.turn).toBe(1);
      expect(result.firstAttack!.userId).toBe(battle.userId);
      const attack = result.firstAttack!;
      expect(attack.skillId).toBe(sample.id); expect(attack.missed).toBe(false);
      expect(attack.damage).toBeGreaterThan(0);
      // Effect1's fixed half-damage ratio; units are normalized before HealEffect.
      const requested = sample.mode === 'fixed' ? sample.value : Math.floor(attack.damage * sample.value);
      const expected = Math.min(requested, battle.player.maxHp - hp);
      const toProto = (value: typeof result.firstAttack, pet: typeof battle.player, uid: number) =>
        BattleConverter.ToAttackValue(value, uid, pet.hp, pet.maxHp, pet.status, pet.battleLv, pet.type, pet);
      const packet = new PacketNoteUseSkill(
        toProto(result.firstAttack, battle.player, battle.userId),
        toProto(result.secondAttack, battle.enemy, 0), 'xin-20261013');
      const bytes = packet.serialize();
      const wire = {gain: bytes.readInt32BE(16), remain: bytes.readInt32BE(20), max: bytes.readUInt32BE(24)};
      expect(packet.getCmdId()).toBe(2505);
      expect(wire).toEqual({gain: expected, remain: hp + expected, max: battle.player.maxHp});
      expect(battle.player.hp).toBe(hp + expected);
      expect(attack.gainHp).toBe(battle.player.hp - hp);
      expect(attack.attackerRemainHp).toBe(battle.player.hp);
      expect(apply.mock.calls.filter(call => call[1] === battle.player).flatMap(call => call[0])
        .filter(r => r.type === 'heal' && r.value === expected).length)
        .toBe(expected ? 1 : 0);
    });
  }

  test.each(samples)('$mode atom returns a result without directly mutating HP', sample => {
    const config = SkillEffectsConfig.Instance.GetEffectById(sample.effect)!;
    const attacker = createMockBattlePet({hp: 100, maxHp: 1000});
    const defender = createMockBattlePet();
    const {createEffectContext, EffectTiming} = require('../effects/core/EffectContext');
    const atom = new HealEffect(config.atomicComposition.atoms[0]);
    const result = atom.execute(createEffectContext(attacker, defender, sample.id, 100, EffectTiming.AFTER_DAMAGE_APPLY));
    expect(result).toHaveLength(1); expect(result[0].value).toBe(50);
    expect(attacker.hp).toBe(100);
    EffectApplicator.Apply(result, attacker, defender);
    expect(attacker.hp).toBe(150);
  });

  test('no configured heal atom uses percent mode; do not invent a production skill to claim coverage', () => {
    const found: unknown[] = [];
    function visit(value: any): void {
      if (!value || typeof value !== 'object') return;
      if (value.type === 'heal' && value.mode === 'percent') found.push(value);
      Object.values(value).forEach(visit);
    }
    SkillEffectsConfig.Instance.GetAllEffects().forEach(e => visit(e.atomicComposition));
    expect(found).toEqual([]);
  });
});
