import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { SkillEffectsConfig } from '../../../../shared/config/game/SkillEffectsConfig';
import { ISkillConfig } from '../../../../shared/models/SkillModel';
import { BattleTurnService } from '../services/BattleTurnService';
import { EffectTrigger } from '../EffectTrigger';
import { EffectTiming } from '../effects/core/EffectContext';
import { AtomicEffectFactory } from '../effects/atomic/core/AtomicEffectFactory';
import { createMockBattlePet } from './BattleTestHelpers';

describe('R15 explicit heal argument units', () => {
  const factory = AtomicEffectFactory.getInstance();
  beforeAll(async () => {
    ConfigRegistry.Instance.Register(ConfigKeys.SKILL_CONFIG, ConfigPaths[ConfigKeys.SKILL_CONFIG], ConfigType.XML);
    ConfigRegistry.Instance.Register(ConfigKeys.SKILL_EFFECTS_V2, ConfigPaths[ConfigKeys.SKILL_EFFECTS_V2], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize(); await SkillEffectsConfig.Instance.Load();
  });
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => jest.restoreAllMocks());
  const configured = (id: number): ISkillConfig => {
    const skills = new Map<number, ISkillConfig>();
    (new BattleTurnService() as any).LoadSkillConfig(id, skills);
    return skills.get(id)!;
  };
  function execute(skill: ISkillConfig, timing = EffectTiming.AFTER_DAMAGE_APPLY) {
    const create = jest.spyOn(factory, 'create');
    const attacker = createMockBattlePet({hp: 100, maxHp: 1000000, speed: 500});
    const defender = createMockBattlePet({hp: 1000000, maxHp: 1000000, speed: 1});
    const results = EffectTrigger.TriggerSkillEffect(skill, attacker, defender, 200, timing);
    EffectTrigger.ApplyEffectResults(results, attacker, defender);
    const atoms = create.mock.calls.map(call => call[0] as any);
    create.mockRestore();
    return {atoms, heals: atoms.filter(a => a.type === 'heal' && a.mode === 'damage_percent'), results,
      gain: attacker.hp - 100};
  }

  test.each([
    [10002, 1, [0.5]], [11711, 101, [0.2]], [11801, 105, [0.125]],
    [12744, 154, [0.5]], [12916, 172, [1 / 3]], [12980, 178, [0.5, 0.25]],
    [13177, 194, [1 / 3, 1 / 6]], [13871, 458, [0.5]], [34707, 687, [1]],
  ] as const)('skill%i/effect%i binds all leaf ratios without changing shared config', (id, effect, ratios) => {
    const config = SkillEffectsConfig.Instance.GetEffectById(effect)!;
    const before = JSON.stringify(config);
    const {heals} = execute(configured(id));
    expect(heals.map(a => a.value)).toEqual(ratios);
    for (const heal of heals) {expect(heal.valueArg).toBeUndefined(); expect(heal.valueUnit).toBeUndefined();}
    expect(JSON.stringify(config)).toBe(before);
    // Constructor evidence covers then/else binding, NOT unsupported condition execution.
  });

  test('all35 locally configured directly reachable skills use their actual units', () => {
    const source = GameConfig.GetSkillConfig()!.MovesTbl!.Moves!.Move!;
    const moves = Array.isArray(source) ? source : [source];
    const refs = moves.filter(m => String(m.SideEffect).split(' ').some(id => [1, 101, 105, 458].includes(Number(id))));
    expect(refs).toHaveLength(35);
    for (const move of refs) {
      const ids = String(move.SideEffect).split(' ').map(Number);
      const id = ids.find(n => [1, 101, 105, 458].includes(n))!;
      const offset = ids.slice(0, ids.indexOf(id)).reduce((n, e) => n + SkillEffectsConfig.Instance.GetEffectById(e)!.argsNum, 0);
      const n = Number(String(move.SideEffectArg).trim().split(/\s+/)[offset]);
      const ratio = id === 1 ? 0.5 : id === 105 ? 1 / n : n / 100;
      expect(execute(configured(move.ID)).gain).toBe(Math.floor(200 * ratio));
    }
  });

  test('fixed XIN15505:458 consumes50 before147 receives100/6', () => {
    // Captured moves.json SHA60902138...; engine parameter fixture, not local learning evidence.
    const skill: ISkillConfig = {id: 15505, name: '千影幻灵枪', category: 1, type: 30, power: 150,
      maxPP: 5, accuracy: 100, mustHit: true, priority: 0, critRate: 1,
      sideEffect: '458 147', sideEffectArg: '50 100 6'};
    const {atoms, heals, gain} = execute(skill);
    expect(heals.map(a => a.value)).toEqual([0.5]); expect(gain).toBe(100);
    expect(atoms.find(a => a.type === 'conditional' && a.condition === 'speed_lower'))
      .toMatchObject({probability: 100, status: 6});
  });

  test.each([undefined, '', -1, NaN, Infinity, '20oops', 'Infinity', '-5'])('invalid percent%s does not fall back', value => {
    expect(execute({...configured(11711), sideEffectArg: value}).heals).toEqual([]);
  });
  test.each([undefined, '', 0, -1, 1.5, NaN, Infinity, '8oops', '1.5'])('invalid divisor%s does not fall back', value => {
    expect(execute({...configured(11801), sideEffectArg: value}).heals).toEqual([]);
  });
  test.each([0, 20, 49, 100])('percent%i converts once', value => {
    const result = execute({...configured(11711), sideEffectArg: String(value)});
    expect(result.heals[0].value).toBe(value / 100); expect(result.gain).toBe(value * 2);
  });
  test('invalid nested branch is removed independently; valid sibling binding is retained', () => {
    const result = execute({...configured(12980), sideEffectArg: '0 2'});
    expect(result.heals.map(a => a.value)).toEqual([0.5]);
    expect(result.atoms[0].else).toEqual([]);
  });
  test('unknown preceding arity cannot supply guessed healing arguments', () => {
    expect(execute({...configured(11711), sideEffect: '999999 101', sideEffectArg: '50 20'}).heals).toEqual([]);
  });
  test('unrelated atoms retain legacy injection and effect43 retains its divisor mode', () => {
    const other = execute(configured(20004), EffectTiming.AFTER_SKILL);
    expect(other.atoms.some(a => a.type === 'stat_modifier')).toBe(true);
    const heal43 = execute(configured(20027)).atoms.find(a => a.type === 'heal');
    expect(heal43).toMatchObject({mode: 'max_hp_divisor', value: 2});
  });
});
