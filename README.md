# KOSE Server - 某童年游戏的怀旧服服务端TS实现版

> 基于 TypeScript 的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构，所有功能集成在 GameServer 中

## 战斗威力与先制修正

`scripts/build-battle-modifiers.cjs`修复技能效果里"威力提升""先制提升"整类不生效的问题。原因有三处：技能效果上下文没有技能副本，`PowerModifier`和`PriorityModifier`直接返回；伤害计算不读取`power_modifier`结果；速度判定只统计被动特性。另外，`ConditionalCheck`只实现了6种条件，"提升100%"在配置里写成了乘100。

- 只在`BEFORE_DAMAGE_CALC`和`BEFORE_SPEED_CHECK`时机给效果上下文一份技能副本，同一技能的多个效果可以连乘，不改共享技能配置；其他时机读取技能的原子保持现状。
- 伤害计算取最后一个成功的`power_modifier`结果作为威力，烧伤减半等原有修正照旧；速度判定只累加技能先制原子的变化量。
- 补齐`hp_percent_below`、`self_has_status`、`target_has_status`、`same_type`、`self_has_stat_debuff`、`target_has_stat_debuff`。血量阈值优先取技能参数1/X；效果2按描述判定对方体力，效果401比较双方属性。
- 修正18个效果的倍率：提升100%改为×2，提升50%改为×1.5，`multiplier`字段改为`value`。新增参数映射`powerMultiplier`、`priority`、`powerBoost`，效果37的Y倍、效果454和482的先制+Y、效果179的威力+X按技能参数生效。

```bash
node scripts/build-battle-modifiers.cjs --context /path/with/typescript --baseline /path/to/captured-live-root --out /path/to/release
node scripts/test-battle-modifiers.cjs /path/to/isolated/runtime
```

构建在实际部署的`app/src`、`app/dist`和配置上按锚点定点插入，同步更新source map；配置按效果块解析后重写，并校验语义差异与预期一致。补丁前后`tsc --noEmit`错误数相同。隔离运行时调用真实`ExecuteAttack`和`OnBeforeSpeedCheck`：条件成立时伤害按倍率变化（×2约1.97倍，效果37 Y=3约2.94倍），先制按参数增加；条件不成立时伤害与不带效果的同技能相同；同一测试在补丁前基线上失败（倍率1.0）。

未覆盖：`target_gender`需要战斗精灵性别字段，效果129仍不生效；`super_effective`、`skill_category_physical`只修正了配置倍率，未实现条件（对应效果暂无技能使用）；其余未实现的条件类型和概率条件的X%参数保持原状。

## 精灵获取扩展

`compat/server-patches/acquisition-expansion`按"原版地点优先、兑换兜底"补齐图鉴来源：

- `wild-additions.json`：19个基础形态按图鉴`Foundin`（图鉴注释写明非野外捕捉为"--"）加入已登记、已有野怪池的地图，例如怀特星小可/粉粉、麦兹星查奥德/小火雀、SUN星酷滑。等级、刷新与胶囊掉落沿用同图第一条野怪，权重取同图普通野怪均值；闪光格林、闪光依依各约5%。进化形态靠升级获得。
- `exchange-groups.json`：实验室"精灵常驻兑换"扩至352只，包含R54的16只和所有仍无来源、但战斗与头像资源齐全的图鉴精灵。客户端先选属性再翻页，每只1000赛尔豆，1级入仓，可重复、无日限。
- 暗黑武斗场、训练师之门等关卡精灵，以及地图未在客户端登记的后期星球精灵，本轮走兑换，未恢复原关卡。

```bash
node scripts/build-acquisition-expansion.cjs --baseline /path/to/captured-live-root --out /path/to/release --java /path/to/java --ffdec /path/to/ffdec.jar
node scripts/test-acquisition-expansion.cjs /path/to/isolated/runtime
python3 -I scripts/audit-pet-acquisition.py --core NieoCore.swf --app /path/to/captured/app --out /path/to/report \
  [--wild compat/server-patches/acquisition-expansion/wild-additions.json] [--exchange-plan resource-tree.json local-resources.txt]
```

构建只替换Core的`MapProcess_5`，校验客户端分组与服务端名单完全一致，并逐块校验`map-ogres.json`格式。隔离运行时验证真实刷怪逻辑能刷出全部19只、352只逐只兑换成功且扣费精确、1级均有技能、野外精灵和离开实验室的请求被拒绝。审计按当前配置与代码静态连通：图鉴1498只中1286只可得；其余212只在资源树中缺少战斗或头像资源，未放入兑换，见审计输出。

`compat/live-captures/20261018`保存其他会话在R54后直接改到线上、未进入main的8个文本文件及二进制hash清单；这些dist改动没有TS源码，后续构建必须以线上实际文件为基线。

## 第四星系入口修复

`compat/client-patches/fourth-galaxy-p1`只修复已上线第四星系的入口阻断，不补充后续地图、精灵或Boss玩法：

- 在当前Core的共享地图表登记朱雀空间（318）、怀特星（484）、怀特矿场（486）、麦兹星（494）和SUN星（497），补齐第四星系归属、悬停说明表及怀特星与矿场的往返连接。星球出生点沿用地图配置；朱雀空间使用地图碰撞数据确认的可行走位置（480，470）。
- 朱雀圆点与原有星球按钮统一通过`DisplayObject`读取名称，避免把`Sprite`强转为`SimpleButton`造成空引用。
- 清除官方星图模块夹带的旧Core脚本注册和未引用字节码，让模块使用当前Core；否则旧`BasePeoleModel`会触发`Illegal override of aimatState`。保留原星图图形标签。
- 从已验证的常驻兑换补丁恢复`MapProcess_5`，保留“原版收集奖励”和16种精灵的常驻兑换；不覆盖当前Core中的其他类。

```bash
node scripts/build-fourth-galaxy-p1.cjs \
  --baseline /path/to/captured-live-root \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
```

构建使用Node.js、Python 3标准库和FFDec。基线目录须包含当前`client/assets/dll/NieoCore.swf`，以及`client/assets`和`client/overlay`中的`module/com/robot/module/app/subMap/Galaxy_4.swf`。两个星图副本不一致或目标地图已登记时停止构建，不能覆盖更新后的基线。

产物`manifest.json`只列出上述三个客户端文件及更新前后SHA-256。发布前核对线上哈希并备份三个旧文件；不要发布`compiler`目录。此补丁不修改服务端、Boss奖励、野怪配置或玩家存档。布莱克、朱雀完整关卡及其他地图支线仍留待后续实现。

验证采用隔离Ruffle实例：实际点击朱雀与三个星球按钮，加载五张现有地图并确认出生点可行走；初始化地图组件、显示星球悬停说明；打开实验室收集菜单、进入常驻兑换并翻页。离线夹具替代登录和换图网络边界，未连接真实玩家账号，未验证整场Boss战斗或线上兑换扣款。实验室发布类与此前R54发布类字节一致，Core其他类及星图图形标签保持不变。

后续缺项、验证边界、发布证据与接手顺序见[第四星系交接文档](FOURTH_GALAXY_HANDOFF.md)。

## 稀有精灵、特殊进化与常驻兑换

`compat/server-patches/acquisition-restoration`补齐早期稀有遭遇、原生机关战斗、特殊进化和受阻融合亲本。保留现有33条融合配方，不修改水系融合、元神珠充能和转化流程。

| 精灵 | 获取入口 |
| --- | --- |
| 尼尔 | 与利牙鱼等配置中的普通野怪开战时，有8%概率变为16级尼尔；地图外观仍是原野怪，可用胶囊捕捉 |
| 巴多 | 火山星山洞（16），稀有刷新 |
| 火晶兽、晶岩兽 | 露希欧泥潭（55），分别为普通与稀有刷新 |
| 小莹蜂 | 云霄星高空（26），沿用寒流枪机关 |
| 达比拉 | 斯诺岩洞（53），沿用搬石堵洞机关；魔狮迪露使用原生独立挑战编号1 |
| 绝版活动亲本 | 实验室（5）“精灵收集奖励”→“绝版活动精灵常驻兑换” |

尼尔8%、巴多5%、晶岩兽池内权重1/20是明确的私服数值，不宣称为官方精确概率。尼尔只恢复变身遭遇，不增加历史版本的逃跑回合规则。位置与玩法依据原生地图脚本、[尼尔官方图鉴](https://seer.61.com/main/spirit/77.html)、[尼尔捕捉记录](https://news.4399.com/seer/xyjl/201009-11-77223.html)及[露希欧泥潭捕捉记录](https://news.7k7k.com/content/20100122/4334.html)。

特殊进化读取当前客户端`CondEvolves`的69组、80个分支及精灵原始等级条件，恢复西塔、派派、奇塔、雷格等机械系链路。悠悠20级后：分支1消耗空气结晶20个变蝠迪，分支2消耗电容球20个变希拉，分支3消耗玄冰20个变柯蓝。材料扣除与进化存档同事务提交；失败保留原宠和材料，正常等级进化不变。

按用户选择，绝版活动采用私服常驻兑换，而非伪称恢复旧活动：格林、布鲁、凯奴、兰妮、卡拉、米奈、奈落、托克、沃特、德普、史克、米娅、莎莉、嘟拉、草莓多多、苹果多多。每次1000赛尔豆，获得1级精灵直接入仓，可重复、无每日次数限制。原收集奖励入口仍保留。扣款与精灵入仓同事务提交，客户端收到成功回包后更新余额与仓库缓存。

本轮连接审计中19条缺少亲本来源的融合链；不等于图录1498只全部可得，也不保证未恢复的其他特殊进化材料已有来源。

```bash
node scripts/build-pet-acquisition.cjs \
  --context /path/to/current/app \
  --baseline /path/to/captured-baseline \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
node scripts/test-pet-acquisition.cjs /path/to/isolated/runtime
```

构建仅替换Core中的`MapProcess_5`标签，保留其余标签字节；后端从实际部署基线定点修改，不覆盖更晚的战斗补丁。类型声明补充已部署JS、旧TS中缺失的API，不新增运行时兼容层。真实临时SQLite与管理器烟测覆盖尼尔开战及捕捉落库、地图刷新、机关战斗、机械进化、悠悠三分支、16种兑换、并发超支与写入失败回滚。不得对真实玩家存档运行该测试。客户端原生编译通过；登录后兑换菜单和完整机关操作仍由用户验收。

## 融合材料与不限次自然资源

`compat/server-patches/material-sources`覆盖早期融合材料目录中的39种材料（400001–400040，不含非材料400013），按原版地点区分野怪掉落、采矿、小游戏和活动，不把全部材料塞进野怪池。保留现网贝尔的水之精华掉落和已有水系融合、元神珠链路。

| 来源 | 材料或入口 |
| --- | --- |
| 原版野怪 | 玄冰、空气结晶、光合能量、水之精华、火焰元素、电容球、纯净能量、海洋能量、熔岩晶体、大地之核、贝壳精华、晶化气泡、水生海草、战斗晶体、异彩能量、元素暗影、龙魂碎片 |
| 原矿点和植物 | 黄晶矿、甲烷燃气、藤结晶、蘑菇结晶、纳格晶体、豆豆果实、电能石、三种露希欧矿石、希欧珊瑚、斯诺豌豆、尼古滴露 |
| 超能采矿装置 | 佩戴100717并带超能NoNo采矿，额外有机会获得能量石 |
| 斯诺星小游戏 | 四个原生小游戏通过5001/5002结算雪球能源 |
| 克洛斯星沼泽 | 连续点击原矿石5秒，结算克洛斯金刚石 |
| 露希欧之洋 | 原生顶球小游戏结算露希之核 |
| 发明室 | 超能NoNo原生小游戏结算超能晶体 |
| 暗黑武斗场 | 恢复第一门50级魔牙鲨，掉落反物质能量及超能晶体；未扩展其余暗黑关卡 |
| 要塞物资采集场 | 按用户选择，由教官室原入口进入原版700001地图，单人采集露希欧坚钢；不伪造战队系统 |

23条采集规则不再读写每日限额。2701返回“已用额度0”，2702原子保存真实产出；珊瑚客户端也不再扣减本地剩余次数。保留工具、飞行、NoNo跟随及超能资格要求；普通/超能NoNo的1份/2份产量不变。每周经验、每周赛尔豆、每月超能分析仪不属于自然资源，额度不变。

来源依据：[2010年材料获取表](https://news.7k7k.com/content/20100414/6742.html)、[后续融合材料掉落表](https://news.4399.com/seer/jingyanxinde/201102-14-86384.html)。资料和客户端能确认获取地点及玩法，不能恢复原服务器精确概率和积分档位。新增概率型掉落沿用当前贝尔的45%，每次1份；小游戏采用配置中的私服档位，零分不发奖，正分按档位发1–3份。这些概率和档位不是“官方精确数值”，均集中在`material-sources.json`。

```bash
node scripts/build-material-sources.cjs \
  --context /path/to/current/app \
  --baseline /path/to/captured-baseline \
  --out /path/to/release
node scripts/build-material-client.cjs \
  --core /path/to/current/NieoCore.swf \
  --fortress /path/to/original/700001.swf \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
```

基线目录按`app/src`、`app/dist`、`app/config`保存实际部署文件（含已有source map）。构建生成逐文件前后hash；安装前必须再次比对现网。战斗结算使用AST定位后插入材料掉落调用，保留现网比TS源码更新的经验、学习力和失败结算修复。Core只替换`MapProcess_13`、`MapProcess_56`、`MapProcess_101`、`PKMap`四个ABC标签，其他标签逐字节保留。补充原要塞地图，来源`http://seer.61.com.tw/resource/map/700001.swf`，SHA256 `8028f8a5ef3faa813a0201167586e1479a227d5d0d85146080fd1b108a1caaa8`。

隔离真实SQLite与PlayerInstance运行覆盖23条规则各12次采集、20次并发采集、写入失败回滚、普通NoNo滴露查询、7个小游戏入口的输赢与防重复结算、5秒边界、物资采集场和错误地图，以及实际魔牙鲨战斗胜利掉落反物质能量。未修改真实玩家存档，不迁移数据库。先合并推送main，再从main构建、按清单发布并只重启游戏服务；客户端需刷新重登，完整游戏操作由用户验收。

## 精灵召唤场

地图502恢复早期原版的单人召唤：点击红、蓝、绿任一圆环，依次响应5001和5052，中央出现40级巨型树妖；一分钟内累计五次喷火命中后才允许2411挑战。进入、离开地图和断线清除本次召唤状态，各玩家状态独立；离开圆环后仍可攻击已召唤的BOSS。

巨型树妖的精元400106在首次胜利时发放，沿用已有`receiver_claims`表，以`boss:502:first-victory`和固定周期0记录终身领取。首胜记录与物品库存同事务提交，失败回滚，不重复发奖；已有精元不叠加超过其Max=1。事件BOSS使用`sptId=0`，不会占用或覆盖先锋队任务编号。奖励监听已有战斗结束事件，不覆盖现网经验、学习力、战斗结算补丁。

```bash
node scripts/build-summoning-field.cjs \
  --server-context /path/to/current/app \
  --out /path/to/release
```

构建器校验22个目标文件的精确现网基线并检查修改模块的TypeScript语义，只发布清单文件。先合并推送main，再从main构建；不改客户端资源、不迁移数据库、不手工修改玩家存档。只重启游戏服务。按本次用户要求不运行游戏验收，玩法由用户上线后测试。

## 战斗资源版本化缓存

战斗加载器逐个加载精灵和技能，原网页服务对所有资源设置`no-store`，导致同一资源每场重复下载。`compat/client-patches/versioned-assets`使用Ruffle原生`urlRewriteRules`给战斗SWF添加版本参数；不修改Flash战斗逻辑、不共享动画实例，也不修改游戏服务或玩家数据。

每次打开页面请求禁缓存的`/battle-assets-version.json`，扫描精灵/技能SWF和`PetFightDLL.swf`的有效文件元数据，按`overlay`优先生成版本。匹配当前快照且未被修改的资源返回`public, max-age=31536000, immutable`；未带版本、旧版本、快照后变更或新增的文件仍返回`no-store`。HTML、配置、Core和其他资源保持原策略。修改任一战斗资源后，刷新页面即可取得新版本；同一版本在跨场和普通刷新后可继续复用浏览器缓存。

```bash
node --test scripts/test-versioned-assets.cjs
node scripts/build-versioned-assets.cjs \
  --client-dir /path/to/current-client \
  --out /path/to/release
```

构建器校验网页服务与首页的现网基线，拒绝覆盖并行修改。先合并推送个人`main`，再从该基线生成三个客户端文件并按清单原子替换；仅重启网页服务，现有WebSocket连接会断开，用户需刷新重登。无需重启游戏服务或创建备份。回归覆盖版本稳定性、资源修改、覆盖层优先级和移除、按需新增、保留mtime的原子替换；真实Ruffle加载验证重复资源零网络传输，以及替换文件后刷新加载新内容。

## 分子转化仪与精元孵化

补齐原生分子转化仪的2315开始孵化、2316查询与领取协议。普通NoNo和超能NoNo统一孵化1800秒，时长由`essence-hatching.json`配置，客户端成功提示读取服务端返回值。面板只展示`items.xml`中配置了有效孵化目标、等级和时间的精元，保留原有图形和布局。

```bash
node scripts/build-essence-hatching.cjs \
  --server-context /path/to/current/server/source \
  --pet-index /path/to/deployed/Pet/index.js \
  --migration-runner /path/to/deployed/MigrationRunner.js \
  --items /path/to/deployed/items.xml \
  --core /path/to/current/NieoCore.swf \
  --panel /path/to/original/MoleculePanel.swf \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
```

迁移24新增`player_essence_hatches`，每个玩家最多保存一个精元及绝对完成时间。开始孵化与扣除一个精元同事务提交；到期查询将精灵保存到仓库并清除孵化记录，原生客户端再用2304协议取入未满的背包。重登、离线和服务重启不重置计时；重复开始不多扣精元，重复领取不多发精灵，写入失败保留原状态。

构建器先确认现网协议索引和迁移注册表可由指定源码逐字节重现，再注册本次模块。Core仅提供编译依赖，不发布Core或改动原始物品配置；只发布孵化模块、注册入口、迁移、时长配置和分子转化仪覆盖资源。先合并并推送个人仓库`main`，再从对应提交构建；不备份、不手工补写账号，重启一次游戏服务，客户端刷新重登。

```bash
node scripts/test-essence-hatching.cjs /path/to/current/app /path/to/release
```

运行验证使用当前部署的真实模型、协议和SQLite驱动及独立临时数据库。17个场景覆盖普通/超能NoNo的30分钟边界、重登与重连、并发防重、物品校验、失败回滚、缓存未保存变更、背包满入仓及原生取入背包流程。临时推进时钟只作用于测试进程，验证脚本不修改现网数据库。

## 帕诺星系星球测绘交付修复

任务37包含10颗星球的测绘和最后一次船长交付。原结算要求11步全部完成，导致已完成全部测绘的玩家提交时因最后一步尚未写入而收到5000。修复只校验前10步，在同一事务中写入第10号进度位、任务完成状态及原有奖励。未完成任意星球仍拒绝，重复提交不重复发奖。

```bash
node scripts/build-task37-repair.cjs \
  --server-context /path/to/current/server/source \
  --source /path/to/deployed/CompleteConfiguredTask.ts \
  --runtime /path/to/deployed/CompleteConfiguredTask.js \
  --tasks /path/to/deployed/tasks.json \
  --out /path/to/release
```

构建器验证当前结算源码能重现现网JS，并检查补丁模块类型。只发布结算JS、source map、对应TS和任务配置，不覆盖其他现网代码。兼容KOSE的20字节进度、旧五整数进度和XIN原始进度。15个临时SQLite场景验证完整测绘领奖、10种缺失测绘、重复/并发防重及失败回滚。先合并并推送个人仓库main，再从main构建；不备份、不迁移或手工补写账号进度，游戏服务需要重启一次。

当前结算JS还包含一个未同步到部署TS的任务19蘑菇怪交付判定。构建器先还原这项已确认的差异，要求编译结果逐字节匹配现网JS，再应用任务37补丁，避免覆盖并行更新。

## 露希欧之洋入场与希欧珊瑚采集

地图56的原生客户端入场时先通过2701查询希欧珊瑚的今日采集次数：普通NoNo使用类型17，超能NoNo使用2054。旧配置缺少2054，且17只对应地图325的矿石，导致入场返回5001并中断地图机关初始化。

历史修复将规则改为按地图与类型共同匹配，补齐希欧珊瑚400026。当前已由上方“融合材料与不限次自然资源”取代旧限额实现及构建器；普通NoNo每次1块、超能NoNo每次2块，不再每日限5次。入场只查询次数，不要求NoNo已跟随；真正采集仍要求对应NoNo跟随，物品入库保持事务保存。

## 帕诺星系横向滚动修复

星际地图的帕诺星系使用固定的 763×260 可视窗口响应鼠标位置，空白星空和最右侧都可以滚动。原实现依赖移动中的星球图形命中，且右边界比窗口窄约 60 像素，导致右移停顿或无响应。修复保留原有 880 像素行程、缓动速度、星球点击和美术资源。

```bash
node scripts/build-star-map-scroll.cjs \
  --core /path/to/current/NieoCore.swf \
  --module /path/to/original/Galaxy_1.swf \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
```

Core 仅提供编译依赖，发布内容只有 `client/overlay/module/com/robot/module/app/subMap/Galaxy_1.swf`。构建器验证非字节码标签逐字节保持不变，输出清单记录输入、输出哈希。先合并并推送个人仓库 `main`，再从该基线构建发布；不备份、不重启服务，不改后端或账号存档。已打开的客户端需要刷新重登。

## 米币商品改用赛尔豆与自制套装移除

原有 84 个米币商品统一按 1 米币兑换 100 赛尔豆计价，保留 VIP 折扣。商城目录、原生购买协议和普通物品购买入口使用同一价格来源。余额不足、重复购买和保存失败均不能发放商品；购买不会消耗米币或修改经验池。

自制极境套装 `199901`–`199905` 已移除，包括商品、提示、喷火、加速与沼泽通行代码，以及工厂页面和 21 个专用资源。原版银翼装备保留。账号清理仅过滤这五个 ID 的背包与穿戴记录，不改余额或其他物品。

购买发放沿用普通购买和掉落的有效期编码 `0x057E40`（360000）。原生背包将有效期 `0` 判为失效，会灰显并禁用穿戴点击；新购装备不能写入该值。修复前已购的四件银翼仅补正有效期，不改变数量或再次扣款。

```bash
node scripts/build-coin-products.cjs \
  --server-context /path/to/current/server-source \
  --core /path/to/R47/NieoCore.swf \
  --elite /path/to/original/ElietCoinBookPanel.swf \
  --guide /path/to/original/ShopingGuidePanel.swf \
  --cloth-book /path/to/original/clothBook.swf \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar \
  --out /path/to/release
```

构建器校验客户端输入哈希，使用 `compat/server-patches/coin-products` 中的完整模块与商品配置，以及 `compat/client-patches/coin-products` 中的九个 Core 类和原生面板补丁，生成 17 个发布文件。服务器上下文提供既有依赖和 TypeScript 编译选项；只对本次模块做语义检查，不覆盖无关模块。先合并并推送个人仓库 `main`，再从该基线运行构建并按清单发布；用户刷新重登验收实际体验。

`node scripts/smoke-coin-products.cjs /path/to/staged/app` 使用临时 SQLite 验证 168 次普通/VIP 目录购买、普通购买入口、余额不足、并发防重、保存失败回滚及已移除套装拒购；购买后重新加载库存并检查真实2605物品列表包，确保有效期非零、客户端仍可使用。该路径必须是带既有依赖的发布副本；脚本不连接游戏账号数据库。


## 精灵按钮无响应修复

百倍经验客户端补丁曾把 `PetBagPanel` 和 `FightPetBagPanel` 的 ABC 标签误替换成普通背包 `BagPanel`，导致精灵按钮触发 `VerifyError #1014`。恢复时只替换这两个标签，不回退整个核心，保留现网百倍卡、商店和其他客户端修改。

```bash
python3 scripts/repair-pet-panels.py \
  --core /path/to/current/NieoCore.swf \
  --reference /path/to/healthy/NieoCore.swf \
  --out /path/to/repaired/NieoCore.swf
```

参考核心必须来自损坏前、标签布局一致且两个精灵面板完整的版本。工具检查完整 ABC 名称、重复标签内容及标签位置，只接受已确认的双面板覆盖故障；输出必须与输入分离，并验证其余标签逐字节不变。

赛尔豆卡的五倍转百倍补丁统一使用 `scripts/patch-coin-core.py --core <输入核心> --out <输出核心>`，替代临时产物目录中的 `patch_core.py`。它只匹配完整类名 `com/robot/app/bag/BagPanel`，要求恰好修改一个类，并拒绝重复 ABC 名称或缺失精灵面板的输入。不得再按 `BagPanel` 后缀或子串匹配。

修复已用独立 QA 账号在真实客户端确认精灵按钮打开列表、属性和技能。按个人项目约定，先合并并推送 `main`，再仅部署修复后的 `dll/NieoCore.swf`；不备份、不重启服务、不修改账号或精灵存档。已打开的客户端需要强制刷新并重新登录。

## 皮皮捕获任务交付修复

任务 90 的原生客户端在提交最后一步时直接发送完成请求，不会预先写入最后一步的进度位。服务端只检查已完成的前置步骤，并在结算事务中确认玩家背包或仓库拥有皮皮（`petId=10`），再同时保存最终进度、任务状态和原有奖励。皮皮不会被消耗或移动；重复提交不能重复领奖，提交失败不能留下部分奖励。

任务说明里的胶囊图片现在也是交付入口：已经抓到皮皮的玩家，打开“克洛斯星的皮皮”的进度说明，点击图片即可正常提交，无需再捕捉。新捕获成功后的原生交付对话保持可用。

```bash
node scripts/build-task90-repair.cjs \
  --server-source /path/to/verified-live-source \
  --tasks /path/to/live/tasks.json \
  --core /path/to/live/NieoCore.swf \
  --panel /path/to/live/TaskPanel_90.swf \
  --out /path/to/release \
  --java /path/to/java \
  --ffdec /path/to/ffdec.jar
```

现网服务端还包含未整体合入本仓库基线的历史补丁，因此构建器校验具体源码及现网配置哈希，并先确认源码能逐字节重建现网任务结算模块，再生成定点修改。TypeScript 使用输入源码工程已安装的编译器和配置，不用本仓库较早的完整后端覆盖现网。面板编译只借用核心作为类库，最终仅取回面板自身的 ABC，保留其全部原生图形与链接，不发布编译用核心。

发布范围为任务结算 JS、对应源码及 source map、任务配置和任务面板 SWF。按约定先合并推送 `main`，从该基线构建后无备份发布；仅重启游戏服务一次，网页服务不重启。不执行数据库迁移或直接改写玩家任务，已捕获的玩家通过交付入口领取原有的 1000 赛尔豆和 1000 积累经验。

## 友情链接
[空影的Go端](https://github.com/qq555565/Seer-golang)

## 🎮 Web 管理后台

本项目提供了功能强大的 Web 管理后台，支持实时管理游戏服务器和玩家数据。

### 主要功能

#### 1. 玩家管理

- 查看在线/离线玩家列表
- 实时搜索和筛选玩家
- 查看玩家详细信息（等级、金币、精灵等）
- 编辑玩家属性（金币、经验、VIP等）
- 踢出在线玩家
- 封禁/解封玩家账号

![玩家管理](image/玩家管理.png)
![玩家管理详情](image/玩家管理1.png)

#### 2. 精灵管理

- 查看玩家的所有精灵
- 添加精灵到玩家背包/仓库
- 编辑精灵属性（等级、DV、EV、性格等）
- 修改精灵技能
- 治疗精灵
- 删除精灵

![添加精灵](image/添加精灵.png)
![编辑精灵](image/编辑精灵.png)

#### 3. 地图配置

- 配置地图怪物刷新
- 设置怪物等级范围
- 调整捕捉率和经验倍率
- 配置 BOSS 刷新
- 实时热重载配置

![地图配置](image/地图配置.png)
![地图配置详情](image/地图配置1.png)
![地图配置编辑](image/地图配置2.png)

#### 4. 服务器管理

- 查看服务器状态
- 重启服务器
- 查看在线人数
- 系统日志查看

![服务器管理](image/服务器管理.png)

### 启动 Web 管理后台

#### 开发模式

```bash
# 启动 GM 服务器（后端 API）
npm run dev:gm

# 启动 Web 前端（另一个终端）
cd web
npm install
npm run dev
```

访问：`http://localhost:5173`

#### 生产模式

```bash
# 构建 Web 前端
cd web
npm run build

# 启动 GM 服务器（会自动提供静态文件）
npm run start:gm
```

访问：`http://localhost:3001`

### 技术栈

**后端（GM Server）**

- Express.js - Web 框架
- TypeScript - 类型安全
- 与 GameServer 共享数据库

**前端（Web UI）**

- Vue 3 - 渐进式框架
- Element Plus - UI 组件库
- TypeScript - 类型安全
- Vite - 构建工具

### API 端点

- `GET /api/players` - 获取玩家列表
- `GET /api/players/:uid` - 获取玩家详情
- `POST /api/players/:uid/kick` - 踢出玩家
- `POST /api/players/:uid/ban` - 封禁玩家
- `GET /api/pets` - 获取精灵列表
- `POST /api/pets/give` - 赠送精灵
- `PUT /api/pets/:uid/:catchTime` - 编辑精灵
- `GET /api/config/:type` - 获取配置
- `POST /api/config/:type` - 保存配置

完整 API 文档请参考：`docs/gm-server-guide.md`

## 🏗️ 架构特点

本项目架构设计：

- ✅ **Data 类直接映射数据库** - ORM 风格
- ✅ **DatabaseHelper 统一管理** - 缓存 + 批量保存
- ✅ **Manager 持有 Data 对象** - 直接操作，无需 await
- ✅ **延迟批量保存** - 性能优化，减少数据库压力
- ✅ **静态方法便捷访问** - `PlayerData.GetPlayerByUid(uid)`
- ✅ **统一服务器架构** - 所有功能集成在 GameServer 中
- ✅ **多响应支持** - 一个请求可返回多个响应（主响应 + 额外推送）

## 📋 目录

- [项目概述](#项目概述)
- [已完成功能](#已完成功能)
- [目录结构](#启动流程)
- [框架优点](#框架优点)

## 项目概述

KOSE Server 是一个基于 TypeScript 开发的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构设计。

**技术栈**:

- TypeScript 5.x
- Node.js 18+
- SQLite / MySQL 8.0
- TCP Socket 通信

**架构特点**:

- 统一服务器架构，所有功能集成在 GameServer
- 统一配置管理
- 自动化协议处理
- 类型安全的代码
- 支持多响应（一个请求返回多个响应包）

## 已完成功能

### 核心系统

#### 1. 统一服务架构

- ✅ GameServer 游戏服务（包含登录、注册、游戏逻辑，监听 9999 端口）
- ✅ ProxyServer 代理服务（调试抓包，监听 9999 端口，**不能与 GameServer 同时运行**）

#### 2. 账号系统

- ✅ 邮箱注册（验证码验证）
- ✅ 账号登录（密码加密）
- ✅ 角色创建
- ✅ 会话管理

#### 3. 玩家系统

- ✅ 玩家数据加载
- ✅ 玩家信息管理
- ✅ 在线状态追踪
- ✅ Player-Manager 架构模式

#### 4. 地图系统

- ✅ 地图进入/离开
- ✅ 地图玩家列表
- ✅ 玩家移动同步
- ✅ 地图怪物配置

#### 5. 精灵系统

- ✅ 精灵背包管理
- ✅ 精灵属性计算
- ✅ 精灵升级系统
- ✅ 精灵技能学习
- ✅ 精灵出战/收回

#### 6. 战斗系统

- ✅ 野外战斗（PVE）
- ✅ 伤害计算（属性克制、等级差、暴击）
- ✅ 技能效果系统（25个效果类型）
- ✅ 战斗结算（经验、捕捉）
- ✅ 战斗逃跑

#### 7. 物品系统

- ✅ 背包管理
- ✅ 物品使用
- ✅ 物品购买
- ✅ 物品配置加载

#### 8. 配置系统

- ✅ 统一配置文件（server.json）
- ✅ 游戏数据配置（XML/JSON）
- ✅ 配置热加载
- ✅ 类型安全的配置接口

#### 9. 数据库系统

- ✅ SQLite 支持
- ✅ MySQL 支持
- ✅ Repository 模式
- ✅ 数据库迁移系统
- ✅ 事务支持

#### 10. 协议系统

- ✅ Proto 结构化协议
- ✅ 自动序列化/反序列化
- ✅ 命令元数据系统
- ✅ 协议调试工具

#### 11. 日志系统

- ✅ 彩色日志输出
- ✅ 日志级别控制
- ✅ 调用栈追踪
- ✅ 协议日志解析

#### 12. 开发工具

- ✅ Proto 生成工具
- ✅ 元数据转换工具
- ✅ 协议验证工具
- ✅ 文档生成工具

### 技术功能

#### 1. 性能优化

- ⏳ Redis 缓存
- ⏳ 连接池优化
- ⏳ 数据库索引优化
- ⏳ 协议压缩

#### 2. 运维功能

- ⏳ 健康检查接口
- ⏳ 性能监控
- ⏳ 日志聚合
- ⏳ 自动重启

## 目录结构

```
seer_server/
├── config/                      # 配置文件
│   ├── server.json             # 统一服务配置
│   ├── server.json.default     # 默认配置模板
│   ├── data/                   # 游戏数据配置（XML）
│   │   └── xml/                # 精灵、技能、物品配置
│   └── game/                   # 游戏逻辑配置（JSON）
│       └── map-ogres.json      # 地图怪物配置
│
├── src/                         # 源代码
│   ├── index.ts                # 主入口（启动所有服务）
│   ├── gateway-entry.ts        # Gateway 独立入口
│   ├── game-entry.ts           # GameServer 独立入口
│   ├── regist-entry.ts         # RegistServer 独立入口
│   ├── email-entry.ts          # EmailServer 独立入口
│   ├── proxy-entry.ts          # ProxyServer 独立入口
│   │
│   ├── Gateway/                # 网关服务
│   │   ├── GatewayServer.ts   # 网关主服务
│   │   ├── Router.ts          # 请求路由器
│   │   ├── ServiceRegistry.ts # 服务注册中心
│   │   └── SessionManager.ts  # 会话管理器
│   │
│   ├── GameServer/             # 游戏服务
│   │   ├── GameServer.ts      # 游戏主服务
│   │   ├── Game/              # 游戏逻辑
│   │   │   ├── Battle/        # 战斗系统
│   │   │   ├── Map/           # 地图系统
│   │   │   ├── Pet/           # 精灵系统
│   │   │   └── Item/          # 物品系统
│   │   └── Server/            # 服务器层
│   │       └── Packet/        # 协议处理
│   │
│   ├── RegistServer/           # 注册服务
│   │   └── RegistServer.ts    # 注册主服务
│   │
│   ├── EmailServer/            # 邮件服务
│   │   └── EmailServer.ts     # 邮件主服务
│   │
│   ├── ProxyServer/            # 代理服务
│   │   └── ProxyServer.ts     # 代理主服务
│   │
│   ├── DataBase/               # 数据库层
│   │   ├── DatabaseManager.ts # 数据库管理器
│   │   ├── drivers/           # 数据库驱动
│   │   ├── repositories/      # 数据仓库
│   │   └── migrations/        # 数据库迁移
│   │
│   └── shared/                 # 共享模块
│       ├── config/            # 配置系统
│       ├── protocol/          # 协议系统
│       ├── proto/             # Proto 定义
│       ├── models/            # 数据模型
│       ├── utils/             # 工具类
│       └── gateway/           # Gateway 客户端
│
├── docs/                       # 文档
│   ├── architecture.md        # 架构文档
│   ├── implementation-plan.md # 实施计划
│   └── skill-effect-development-guide.md  # 开发指南
│
├── tools/                      # 开发工具
│   ├── proto-to-meta.ts       # Proto 转元数据
│   ├── meta-to-proto.ts       # 元数据转 Proto
│   └── generate-proto-docs.ts # 生成协议文档
│
├── scripts/                    # 构建脚本
│   └── build-services.js      # 独立服务打包
│
├── data/                       # 运行时数据
│   └── seer.db                # SQLite 数据库
│
├── logs/                       # 日志文件
│
├── package.json               # 项目配置
└── tsconfig.json              # TypeScript 配置
```

---

## 启动流程

### 开发环境

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置数据库

```bash
# 复制默认配置
cp config/server.json.default config/server.json

# 编辑配置文件，设置数据库类型和路径
# 默认使用 SQLite，无需额外配置
```

#### 3. 初始化数据库

```bash
npm run db:migrate
```

#### 4. 启动服务

**方式一：启动游戏服务**

```bash
npm start
# 或
npm run start:game
```

**方式二：启动调试代理（不能与游戏服务同时运行）**

```bash
npm run start:proxy
```

**方式三：开发模式（自动重启）**

```bash
npm run dev          # 启动 GameServer
npm run dev:game     # 启动 GameServer
npm run dev:proxy    # 启动 ProxyServer（调试用）
```

### 生产环境

#### 1. 编译项目

```bash
npm run build
```

#### 2. 打包独立服务

```bash
npm run build:services
```

#### 3. 部署服务

```bash
cd release/services

# 启动游戏服务
./game-server.exe

# 或使用启动脚本
start-game.bat        # Windows
./start-game.sh       # Linux/Mac
```

### 服务架构

```
GameServer (端口 9999)
  ├─ 登录系统
  ├─ 注册系统
  ├─ 游戏逻辑
  └─ 数据库管理

ProxyServer (端口 9999，调试用)
  ├─ 协议抓包
  ├─ 数据包分析
  ├─ Web GUI (端口 9000)
  └─ 不能与 GameServer 同时运行
```

### 客户端连接流程

```
客户端
  ↓ 连接 9999 端口
GameServer
  ├─ 处理登录请求
  ├─ 处理注册请求
  └─ 处理游戏逻辑
```

### 调试模式

```
客户端
  ↓ 连接 9999 端口
ProxyServer
  ├─ 抓包分析
  ├─ Web GUI 查看 (localhost:9000)
  └─ 转发到内部 GameServer
  ↓ 处理注册/登录
↓ 返回响应
Gateway
↓ 转发响应
客户端
↓ 登录成功，连接 Gateway:27777（游戏）
Gateway
↓ 路由到 GameServer
GameServer
↓ 处理游戏逻辑
↓ 返回响应
Gateway
↓ 转发响应
客户端
```

## 框架优点

### 1. 微服务架构

**服务解耦**

- 每个服务职责单一，代码清晰
- 服务间通过 Gateway 通信，降低耦合
- 便于团队并行开发

**独立部署**

- 服务可以独立启动、停止、重启
- 不影响其他服务运行
- 支持灰度发布

**弹性扩展**

- 可以根据负载独立扩展某个服务
- 支持水平扩展（启动多个实例）
- 资源利用更高效

**故障隔离**

- 某个服务崩溃不会导致整个系统瘫痪
- 易于定位和修复问题
- 提高系统可用性

### 2. 统一配置管理

**集中配置**

- 所有服务使用同一个配置文件
- 配置修改一处生效
- 易于版本控制

**类型安全**

- TypeScript 接口定义配置结构
- 编译时检查配置错误
- IDE 自动补全

**环境隔离**

- 支持多环境配置（开发/测试/生产）
- 配置文件不提交到版本控制
- 敏感信息保护

### 3. 现代化开发体验

**TypeScript**

- 类型安全，减少运行时错误
- 强大的 IDE 支持
- 易于重构和维护

**装饰器模式**

- 自动注册 Handler 和 Effect
- 减少样板代码
- 代码更简洁

**Proto 系统**

- 结构化协议定义
- 自动序列化/反序列化
- 类型安全的数据传输

**开发工具**

- 自动化代码生成
- 协议验证工具
- 文档自动生成

### 4. 高可维护性

**清晰的代码组织**

- 按功能模块划分目录
- 统一的命名规范
- 完善的注释文档

**Player-Manager 模式**

- 数据自动隔离
- 跨模块协作简单
- 生命周期管理清晰

**Repository 模式**

- 数据访问层抽象
- 易于切换数据库
- 便于单元测试

### 5. 易于调试

**ProxyServer**

- 拦截和分析协议
- Web 界面查看数据包
- 协议调试利器

**日志系统**

- 彩色日志输出
- 调用栈追踪
- 协议自动解析

**元数据系统**

- 协议字段自动解析
- 日志可读性强
- 便于问题定位

### 6. 灵活部署

**多种部署方式**

- 单机部署（所有服务一起）
- 分布式部署（服务分散到不同机器）
- 容器化部署（Docker/Kubernetes）

**独立打包**

- 每个服务独立可执行文件
- 无需安装 Node.js 环境
- 部署简单快捷

**配置灵活**

- 支持不同的数据库（SQLite/MySQL）
- 支持不同的端口配置
- 支持不同的日志级别

## 许可证

GNU AGPLv3MIT License


## 贡献

欢迎提交 Issue 和 Pull Request！

**最后更新**: 2026-01-31
