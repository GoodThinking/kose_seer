# BOSS特性系统

基于JSON配置驱动的BOSS特性系统，用于实现BOSS的被动能力。

## 架构设计

### 配置驱动
- **配置文件**: `config/data/json/boss_abilities.json` - 定义哪些精灵拥有哪些特性
- **效果配置**: `config/data/json/skill_effects_v2.json` - 定义特性的具体效果和参数

### 核心组件
- **BossAbilityConfig**: 加载和管理BOSS特性配置
- **BossAbilityManager**: 执行BOSS特性的初始化和触发逻辑

## 已实现的特性

### 1902 - 免疫能力下降
- **描述**: 免疫所有能力(battle_lv)下降效果
- **参数**: 无
- **触发时机**: 能力变化前
- **实现**: `BossAbilityManager.CheckStatChange()`

### 1903 - 免疫异常状态
- **描述**: 免疫所有异常状态（麻痹、中毒、烧伤、冻伤、睡眠、害怕等）
- **参数**: 无
- **触发时机**: 施加状态前
- **实现**: `BossAbilityManager.CheckStatus()`

### 1904 - 受伤减免
- **描述**: 受到任何伤害减免 n%
- **参数**: 
  - `a1`: 减免百分比 (0-100)，默认50%
- **触发时机**: 伤害计算后、应用前
- **实现**: `BossAbilityManager.ModifyDamage()`

### 1905 - 同系吸收
- **描述**: 受到与自身相同系属的攻击会恢复自身相应体力
- **参数**: 无
- **触发时机**: 伤害计算后、应用前
- **实现**: `BossAbilityManager.ModifyDamage()`

### 1906 - 属性免疫
- **描述**: 只受到来自普通属性和某类属性的攻击伤害
- **参数**: 
  - `a1-a8`: 允许的属性类型 (mon_type: 1-26)，默认只允许普通属性(8)
- **触发时机**: 伤害计算后、应用前
- **实现**: `BossAbilityManager.ModifyDamage()`

## 使用方法

### 1. 配置BOSS特性

编辑 `config/data/json/boss_abilities.json`:

```json
{
  "bossAbilities": [
    {
      "petId": 2001,
      "petName": "示例BOSS",
      "abilities": [1902, 1904],
      "description": "免疫能力下降 + 受伤减免50%"
    }
  ]
}
```

### 2. 配置特性参数

编辑 `config/data/json/skill_effects_v2.json` 中对应特性的 `args` 字段:

```json
{
  "effectId": 1904,
  "name": "受伤减免",
  "args": [
    {
      "index": 0,
      "name": "reductionPercent",
      "type": "number",
      "description": "伤害减免百分比（0-100）",
      "default": 50
    }
  ]
}
```

### 3. 战斗初始化

在战斗开始时，系统会自动：
1. 从 `boss_abilities.json` 读取BOSS的特性列表
2. 调用 `BossAbilityManager.InitializeBossAbilities()` 初始化特性
3. 在精灵的 `effectCounters` 中设置特性标记

### 4. 特性触发

特性会在相应时机自动触发：
- **能力变化**: `BattleCore.ApplyStatChange()` → `BossAbilityManager.CheckStatChange()`
- **异常状态**: `BattleCore.ApplyStatus()` → `BossAbilityManager.CheckStatus()`
- **伤害修正**: `BattleCore.ApplyPassiveDamageModifiers()` → `BossAbilityManager.ModifyDamage()`

## 添加新特性

### 1. 在 skill_effects_v2.json 中定义特性

```json
{
  "effectId": 1907,
  "name": "新特性名称",
  "argsNum": 1,
  "category": "passive",
  "timing": ["BEFORE_DAMAGE"],
  "description": "特性描述",
  "implemented": true,
  "implementClass": "NewAbilityClass",
  "args": [
    {
      "index": 0,
      "name": "参数名",
      "type": "number",
      "description": "参数描述",
      "default": 默认值
    }
  ],
  "atomicComposition": {
    "type": "composite",
    "atoms": []
  },
  "passiveType": "new_ability_type",
  "notes": "BOSS特性说明"
}
```

**关键字段**:
- `category`: 必须是 `"passive"`
- `passiveType`: 特性类型标识（用于代码中识别特性类型）

### 2. 在 BossAbilityManager 中实现逻辑

在 `InitializeSingleAbility()` 的 switch 中添加新的 case:

```typescript
case 'new_ability_type': // 新特性类型
  {
    // 从配置读取参数
    const param = config.args?.[0]?.default || 默认值;
    
    // 设置标记
    boss.effectCounters['boss_new_ability'] = param;
    
    Logger.Info(`[BossAbilityManager] ${boss.name} - ${config.name} ${param}`);
  }
  break;
```

然后在相应的检查方法中添加触发逻辑：
- 能力变化 → `CheckStatChange()`
- 异常状态 → `CheckStatus()`
- 伤害修正 → `ModifyDamage()`

### 3. 在 boss_abilities.json 中配置

```json
{
  "petId": 精灵ID,
  "petName": "精灵名称",
  "abilities": [1907],
  "description": "特性描述"
}
```

### 示例：添加"反伤"特性

#### 步骤1: 在 skill_effects_v2.json 中定义

```json
{
  "effectId": 1907,
  "name": "反伤",
  "argsNum": 1,
  "category": "passive",
  "timing": ["AFTER_DAMAGE"],
  "description": "受到攻击时反弹n%伤害给对方",
  "implemented": true,
  "implementClass": "ReflectDamageAbility",
  "args": [
    {
      "index": 0,
      "name": "reflectPercent",
      "type": "number",
      "description": "反弹百分比（0-100）",
      "default": 30
    }
  ],
  "atomicComposition": {
    "type": "composite",
    "atoms": []
  },
  "passiveType": "reflect_damage",
  "notes": "BOSS特性 - 受到伤害时反弹给攻击者"
}
```

#### 步骤2: 在 BossAbilityManager 中实现

在 `InitializeSingleAbility()` 中添加:

```typescript
case 'reflect_damage': // 反伤
  {
    const percent = config.args?.[0]?.default || 30;
    boss.effectCounters['boss_reflect_damage'] = percent;
    Logger.Info(`[BossAbilityManager] ${boss.name} - ${config.name} ${percent}%`);
  }
  break;
```

在 `ModifyDamage()` 或创建新方法 `OnDamageReceived()` 中添加:

```typescript
// 反伤处理（在伤害应用后）
if (defender.effectCounters['boss_reflect_damage']) {
  const percent = defender.effectCounters['boss_reflect_damage'];
  const reflectDamage = Math.floor(damage * percent / 100);
  attacker.hp = Math.max(0, attacker.hp - reflectDamage);
  Logger.Debug(
    `[BossAbilityManager] ${defender.name} 反伤: ` +
    `${reflectDamage} → ${attacker.name}`
  );
}
```

#### 步骤3: 配置BOSS

```json
{
  "petId": 3005,
  "petName": "荆棘之王",
  "abilities": [1907],
  "description": "反伤30%"
}
```

## 属性类型对照表

```
1  = 草系
2  = 水系
3  = 火系
4  = 飞行系
5  = 电系
6  = 机械系
7  = 地面系
8  = 普通系
9  = 冰系
10 = 战斗系
11 = 光系
12 = 暗影系
13 = 龙系
14 = 神秘系
15 = 超能系
16 = 圣灵系
17 = 元素系
18 = 次元系
19 = 自然系
20 = 邪灵系
21 = 王者系
22 = 远古系
23 = 魔法系
24 = 混沌系
25 = 时空系
26 = 英雄系
```

## 注意事项

1. **配置优先**: 所有特性配置都应该在JSON文件中，避免硬编码
2. **标记命名**: effectCounters中的标记统一使用 `boss_` 前缀
3. **参数读取**: 从 skill_effects_v2.json 的 args 字段读取参数
4. **日志记录**: 所有特性触发都应该有详细的日志记录
5. **性能考虑**: 特性检查应该尽可能高效，避免复杂计算

## 调试

### 查看BOSS特性配置
```typescript
const abilities = BossAbilityConfig.Instance.GetAbilities(petId);
console.log('BOSS特性:', abilities);
```

### 查看精灵的特性标记
```typescript
console.log('effectCounters:', pet.effectCounters);
```

### 重新加载配置
```typescript
BossAbilityConfig.Instance.Reload();
```
