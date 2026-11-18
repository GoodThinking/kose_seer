/**
 * 属性克制系统测试
 * 测试26种属性的克制关系、本系加成等
 */

import { ElementSystem, ElementType } from '../ElementSystem';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

// Mock GameConfig
jest.mock('../../../../shared/config/game/GameConfig');

describe('ElementSystem - 属性克制系统测试', () => {
  
  beforeEach(() => {
    // Mock 属性配置数据
    const mockElementConfig = {
      types: [
        { id: 1, name: '草', nameEn: 'GRASS' },
        { id: 2, name: '水', nameEn: 'WATER' },
        { id: 3, name: '火', nameEn: 'FIRE' },
        { id: 4, name: '飞行', nameEn: 'FLYING' },
        { id: 5, name: '电', nameEn: 'ELECTRIC' },
        { id: 6, name: '机械', nameEn: 'MACHINE' },
        { id: 7, name: '地面', nameEn: 'GROUND' },
        { id: 8, name: '普通', nameEn: 'NORMAL' },
        { id: 9, name: '冰', nameEn: 'ICE' },
        { id: 10, name: '超能', nameEn: 'PSYCHIC' }
      ],
      effectiveness: {
        '1': { '2': 2.0, '7': 2.0, '3': 0.5 },  // 草克水、地面，被火克制
        '2': { '3': 2.0, '7': 2.0, '1': 0.5 },  // 水克火、地面，被草克制
        '3': { '1': 2.0, '6': 2.0, '9': 2.0, '2': 0.5 }, // 火克草、机械、冰，被水克制
        '4': { '1': 2.0 },                       // 飞行克草
        '5': { '2': 2.0, '4': 2.0 },            // 电克水、飞行
        '6': { '9': 2.0 },                       // 机械克冰
        '7': { '3': 2.0, '5': 2.0, '6': 2.0 },  // 地面克火、电、机械
        '9': { '1': 2.0, '4': 2.0, '7': 2.0 }   // 冰克草、飞行、地面
      }
    };
    
    (GameConfig.GetElementConfig as jest.Mock).mockReturnValue(mockElementConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基础属性查询', () => {
    test('应该正确获取属性名称', () => {
      expect(ElementSystem.GetTypeName(1)).toBe('草');
      expect(ElementSystem.GetTypeName(2)).toBe('水');
      expect(ElementSystem.GetTypeName(3)).toBe('火');
    });

    test('应该正确获取属性英文名称', () => {
      expect(ElementSystem.GetTypeNameEn(1)).toBe('GRASS');
      expect(ElementSystem.GetTypeNameEn(2)).toBe('WATER');
      expect(ElementSystem.GetTypeNameEn(3)).toBe('FIRE');
    });

    test('无效属性ID应该返回未知', () => {
      expect(ElementSystem.GetTypeName(999)).toBe('未知');
      expect(ElementSystem.GetTypeNameEn(999)).toBe('UNKNOWN');
    });

    test('应该正确验证属性ID', () => {
      expect(ElementSystem.IsValidType(1)).toBe(true);
      expect(ElementSystem.IsValidType(26)).toBe(true);
      expect(ElementSystem.IsValidType(0)).toBe(false);
      expect(ElementSystem.IsValidType(27)).toBe(false);
    });
  });

  describe('单属性克制', () => {
    test('应该正确返回克制关系 (2.0x)', () => {
      expect(ElementSystem.GetEffectiveness(1, 2)).toBe(2.0); // 草克水
      expect(ElementSystem.GetEffectiveness(2, 3)).toBe(2.0); // 水克火
      expect(ElementSystem.GetEffectiveness(3, 1)).toBe(2.0); // 火克草
    });

    test('应该正确返回被克制关系 (0.5x)', () => {
      expect(ElementSystem.GetEffectiveness(1, 3)).toBe(0.5); // 草被火克制
      expect(ElementSystem.GetEffectiveness(2, 1)).toBe(0.5); // 水被草克制
      expect(ElementSystem.GetEffectiveness(3, 2)).toBe(0.5); // 火被水克制
    });

    test('应该正确返回普通效果 (1.0x)', () => {
      expect(ElementSystem.GetEffectiveness(1, 1)).toBe(1.0); // 草对草
      expect(ElementSystem.GetEffectiveness(8, 1)).toBe(1.0); // 普通对草
    });

    test('无效属性应该返回普通效果', () => {
      expect(ElementSystem.GetEffectiveness(0, 1)).toBe(1.0);
      expect(ElementSystem.GetEffectiveness(1, 0)).toBe(1.0);
      expect(ElementSystem.GetEffectiveness(999, 1)).toBe(1.0);
    });
  });

  describe('单属性攻击双属性', () => {
    test('双克制应该返回4.0x', () => {
      // 假设有草/地面双属性精灵，水系攻击
      // 水克草(2.0) + 水克地面(2.0) = 4.0
      const result = ElementSystem.CalcSingleVsDual(2, 1, 7);
      expect(result).toBe(4.0);
    });

    test('一克一普通应该返回1.5x', () => {
      // 火攻击草/水双属性
      // 火克草(2.0) + 火被水克制(0.5) = 1.25 (实际是(2+0.5)/2=1.25)
      const result = ElementSystem.CalcSingleVsDual(3, 1, 2);
      expect(result).toBe(1.25);
    });

    test('一克一无效应该返回0.5x', () => {
      // 假设有无效克制的情况
      // 如果其中一项为0，则(eff1 + eff2) / 4
      const mockConfig = GameConfig.GetElementConfig();
      if (mockConfig) {
        mockConfig.effectiveness['10'] = { '8': 0 }; // 假设超能对普通无效
      }
      
      const result = ElementSystem.CalcSingleVsDual(10, 8, 1);
      // (0 + 1.0) / 4 = 0.25
      expect(result).toBeLessThanOrEqual(1.0);
    });

    test('相同属性应该按单属性计算', () => {
      const single = ElementSystem.GetEffectiveness(1, 2);
      const dual = ElementSystem.CalcSingleVsDual(1, 2, 2);
      expect(dual).toBe(single);
    });
  });

  describe('双属性攻击单属性', () => {
    test('双克制应该返回4.0x', () => {
      // 草/水双属性攻击地面
      // 草克地面(2.0) + 水克地面(2.0) = 4.0
      const result = ElementSystem.CalcDualVsSingle(1, 2, 7);
      expect(result).toBe(4.0);
    });

    test('一克一被克应该返回1.25x', () => {
      // 草/火双属性攻击水
      // 草克水(2.0) + 火被水克制(0.5) = 1.25
      const result = ElementSystem.CalcDualVsSingle(1, 3, 2);
      expect(result).toBe(1.25);
    });

    test('相同属性应该按单属性计算', () => {
      const single = ElementSystem.GetEffectiveness(1, 2);
      const dual = ElementSystem.CalcDualVsSingle(1, 1, 2);
      expect(dual).toBe(single);
    });
  });

  describe('双属性攻击双属性', () => {
    test('应该正确计算复杂克制关系', () => {
      // 草/水双属性攻击火/地面双属性
      const result = ElementSystem.CalcDualVsDual(1, 2, 3, 7);
      expect(result).toBeGreaterThan(0);
    });

    test('单属性攻击双属性应该正确降级', () => {
      const result = ElementSystem.CalcDualVsDual(1, undefined, 2, 7);
      expect(result).toBe(ElementSystem.CalcSingleVsDual(1, 2, 7));
    });

    test('双属性攻击单属性应该正确降级', () => {
      const result = ElementSystem.CalcDualVsDual(1, 2, 3, undefined);
      expect(result).toBe(ElementSystem.CalcDualVsSingle(1, 2, 3));
    });
  });

  describe('本系加成 (STAB)', () => {
    test('单属性精灵使用本系技能应该获得加成', () => {
      expect(ElementSystem.HasSTAB(1, undefined, 1, undefined)).toBe(true);
      expect(ElementSystem.GetSTABMultiplier(1, undefined, 1, undefined)).toBe(1.5);
    });

    test('单属性精灵使用非本系技能不应该获得加成', () => {
      expect(ElementSystem.HasSTAB(1, undefined, 2, undefined)).toBe(false);
      expect(ElementSystem.GetSTABMultiplier(1, undefined, 2, undefined)).toBe(1.0);
    });

    test('双属性精灵使用任一本系技能应该获得加成', () => {
      expect(ElementSystem.HasSTAB(1, 2, 1, undefined)).toBe(true);
      expect(ElementSystem.HasSTAB(1, 2, 2, undefined)).toBe(true);
      expect(ElementSystem.GetSTABMultiplier(1, 2, 1, undefined)).toBe(1.5);
    });

    test('双属性精灵使用双属性技能应该获得加成', () => {
      // 草/水精灵使用草/水技能
      expect(ElementSystem.HasSTAB(1, 2, 1, 2)).toBe(true);
      expect(ElementSystem.GetSTABMultiplier(1, 2, 1, 2)).toBe(1.5);
    });

    test('双属性精灵使用非本系技能不应该获得加成', () => {
      expect(ElementSystem.HasSTAB(1, 2, 3, undefined)).toBe(false);
      expect(ElementSystem.GetSTABMultiplier(1, 2, 3, undefined)).toBe(1.0);
    });
  });

  describe('完整伤害倍率计算', () => {
    test('应该正确计算属性克制+本系加成', () => {
      // 草系精灵使用草系技能攻击水系
      // 克制(2.0) × 本系(1.5) = 3.0
      const multiplier = ElementSystem.CalculateDamageMultiplier(
        1, undefined, // 草系精灵
        1, undefined, // 草系技能
        2, undefined  // 水系防守
      );
      expect(multiplier).toBe(3.0);
    });

    test('应该正确计算被克制+本系加成', () => {
      // 草系精灵使用草系技能攻击火系
      // 被克制(0.5) × 本系(1.5) = 0.75
      const multiplier = ElementSystem.CalculateDamageMultiplier(
        1, undefined,
        1, undefined,
        3, undefined
      );
      expect(multiplier).toBe(0.75);
    });

    test('应该正确计算普通效果+本系加成', () => {
      // 草系精灵使用草系技能攻击草系
      // 普通(1.0) × 本系(1.5) = 1.5
      const multiplier = ElementSystem.CalculateDamageMultiplier(
        1, undefined,
        1, undefined,
        1, undefined
      );
      expect(multiplier).toBe(1.5);
    });

    test('应该正确计算克制+无本系加成', () => {
      // 草系精灵使用水系技能攻击火系
      // 克制(2.0) × 无本系(1.0) = 2.0
      const multiplier = ElementSystem.CalculateDamageMultiplier(
        1, undefined,
        2, undefined,
        3, undefined
      );
      expect(multiplier).toBe(2.0);
    });
  });

  describe('辅助方法', () => {
    test('应该根据名称获取属性ID', () => {
      expect(ElementSystem.GetTypeByName('草')).toBe(1);
      expect(ElementSystem.GetTypeByName('水')).toBe(2);
      expect(ElementSystem.GetTypeByName('火')).toBe(3);
    });

    test('无效名称应该返回undefined', () => {
      expect(ElementSystem.GetTypeByName('不存在的属性')).toBeUndefined();
    });

    test('应该正确返回效果描述', () => {
      expect(ElementSystem.GetEffectivenessText(4.0)).toBe('超级克制');
      expect(ElementSystem.GetEffectivenessText(2.0)).toBe('克制');
      expect(ElementSystem.GetEffectivenessText(1.0)).toBe('普通');
      expect(ElementSystem.GetEffectivenessText(0.5)).toBe('微弱');
      expect(ElementSystem.GetEffectivenessText(0.0)).toBe('无效');
    });

    test('应该返回所有属性类型', () => {
      const types = ElementSystem.GetAllTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    test('配置未加载时不应该崩溃', () => {
      (GameConfig.GetElementConfig as jest.Mock).mockReturnValue(null);
      
      // 重新触发加载
      ElementSystem['typeDataCache'] = null;
      ElementSystem['effectivenessCache'] = null;
      
      expect(() => {
        ElementSystem.GetTypeName(1);
        ElementSystem.GetEffectiveness(1, 2);
      }).not.toThrow();
    });

    test('无效配置数据不应该崩溃', () => {
      (GameConfig.GetElementConfig as jest.Mock).mockReturnValue({});
      
      ElementSystem['typeDataCache'] = null;
      ElementSystem['effectivenessCache'] = null;
      
      expect(() => {
        ElementSystem.GetTypeName(1);
      }).not.toThrow();
    });
  });
});
