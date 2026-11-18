# KOSE 赛尔号多 AI 交接记录 (HANDOFF.md)

> 更新时间：2026-11-18（经典怀旧版第二阶段深度精修 `classic-polish-v2-20261118`；已生产发布）
> 当前阶段：已完成全服 Boss 四阶战术体系大整改（彻底摒弃死板的“一锁一钥”非指定属性 0 伤害与战前剧透弹窗）、果冻鸭与闪光皮皮恢复可捕捉稀有精灵、三大星系擂台升级原版竞技场美术与原生 HUD（三只冠军精灵调整为 625 种族值与经典平衡特质）、训练师之门完整补齐（含战斗系威里特、双属性普兰特/帕里斯、普通/勇者双模式）、移除北斗七星殿与克洛斯星湿地代码入口，并将 NoNo 随身面板升级为原生金属高光皮肤。

---

## 当前任务：全服 Boss 战术大整改、星系擂台与训练师之门完整精修（已发布 `classic-polish-v2-20261118`）

- **用户决策与落地内容**：
  1. **实验室《精灵手册》与《融合手册》**：恢复淘米官方原版翻页画册美术（`monsterBook.swf`、`PetAmalgamationBookPanel.swf`），彻底清除“从夯到拉”代码表格与深蓝平面方框。
  2. **精灵太空站「三大星系擂台」保留并重做**：
     - 保留 16 位守擂者 6v6 车轮战模式；移除 `GalaxyArenaMap.as` 中代码绘制的简陋椭圆看台，改用淘米原版竞技场地图美术（`9508` 大师杯赛场 `111.swf`、`9509` 龙王殿堂 `344.swf`、`9510` 巅峰之战 `433.swf`）+ 顶部原生 `Panel_TitleBar` 控制栏与 `Button_upSkin` 高光按钮；
     - 三只冠军专属奖励精灵（`3022 王之哈莫`、`3406 圣霆雷伊`、`3481 圣战盖亚`）按方案 B 统一回调至怀旧服神兽标准 **625 种族值**，并将后期超模魂印替换为经典平衡特质；
     - 升级 `ArenaStrategy.js` 守擂 AI，加入智能消强判断与强攻/坚守/战术/均衡四类风格差异。
  3. **全服 Boss 战斗机制大整改（四阶战术体系）**：
     - 彻底废除人为添加的 `onlyTypes`（非指定属性 0 伤害）、`reviveUnlessStatus`（无指定异常无限满血复活）、`armorBreak`（不降防 0 伤害）、`layers`（非连击 0 伤害），移除 `FightInviteManager.as` 与 `DarkPortalModel.as` 的战前剧透确认弹窗；
     - **果冻鸭（`74`）与闪光皮皮（`164`）回归稀有精灵捕捉**：从 SPT 列表中移除果冻鸭，将精灵广场（`34/0`）与闭锁空间（`310/0`）改为 15 级可捕捉 `果冻鸭(74)`，并在赫尔卡星（`Map 31`）野外刷新可捕捉 `果冻鸭(74)`；`10/0` 改为 14 级可捕捉 `闪光皮皮(164)`；
     - 实装 `BossSpecialRules.js` 四阶战术机制：**本系护体与克制破绽（`typeHomeTurf`，非克制减伤 32%、克制属性破防增伤 25% 并压制当回合光环）**、**半血二阶段觉醒（`halfHpAwaken`）**、**专属领域光环（`fieldAura`：深海祈雨/熔岩灼烧/生灵赐福/极度冰点/三阶暗黑侵蚀）** 与 **智能战术 AI 选招（`ChooseTacticalSkill`）**。
  4. **清理半成品入口 & 完整补齐「训练师之门」**：
     - 移除实验室左下角「北斗七星殿（`733`）」与克洛斯星顶上「克洛斯星湿地（`550`）」代码按钮及对应地图配置；
     - 完整开放 `TrainDoorEnterPanel.swf`：补齐第 13 门 **战斗系·威里特（`1156`，首胜得 `400293 威里特的精元`）**，开放右侧双属性之门 **草超能·普兰特（`1191`，首胜得 `400313 普兰特的精元`）** 与 **水暗影·帕里斯（`1304`，首胜得 `400365 帕里斯的精元`）**，并开放左右两侧的 **【普通模式（`201..217`）/ 勇者模式（`301..317`）】** 自由切换。
  5. **NoNo 随身面板视觉升级**：`PetWorkflowUI.as` 与 `BattleExperiencePanel.as` 升级为 `Panel_Background` + `Panel_TitleBar` + `Button_upSkin` 原生金属高光立体皮肤。
- **构建与发布回执**：
  - 工作树：`work/classic-cleanup-20261118`（提交 `69acb17` 已推送至 `fork/main`），构建脚本 `scripts/build-classic-polish-v2.cjs`。
  - 线上部署：`classic-polish-v2-20261118`，更新 18 个核心文件、清理残留文件，备份位于 `/opt/kose-seer/backups/classic-polish-v2-20261118/`。
  - 服务状态：`kose-seer.service`（PID `3932095`）与 `kose-seer-web.service` 均 `active/running`，`NRestarts=0`，`9999` 端口正常监听，数据库迁移版本已达 `33`，启动日志 `0` 条 ERROR/FATAL。

---

## 历史任务：经典怀旧版瘦身还原与 UI 修复（已发布 `classic-cleanup-20261118`）

- **用户决策与设计范围**：
  1. **彻底移除第六星系（远航星域）**：下线 `9700.swf~9794.swf`、`Galaxy_6.swf`、远航星图 `UniverseAtlas`、`worldMap.swf` 第六星系按钮以及服务端 49 位 `97xx` 原创宇宙首领。
  2. **彻底移除 20 只自造扩展精灵与 26 个原创技能**：从 `pets.xml`、`spt.xml`、`skills.xml`、`items.xml` 与客户端 `NieoCore.swf` 中移除 20 只扩展精灵（`1632,1633,2208..2210,2470,100001..100011,110001..110003`）、26 个原创技能（`50001..50026`）与 9 种原创领主精元（`403034..403042`），并删除对应客户端 SWF 资源。
  3. **砍掉凑数收集计划与每日签到送宠**：移除 `collect-plans.json`（82 档凑数计划）、`daily-sign.json`、右上角外挂图标（每日签到与收藏馆），恢复实验室原版 4 卡收集面板 + 第 5 组三主宠补领；`boss_abilities.json` 移除强塞的凑数 `rewardPetId`，恢复 109 位经典首领的 R84“一锁一钥”数值与机制（蘑菇怪 Lv10/100HP、钢牙鲨 Lv25/200HP、里奥斯 Lv35/170HP×2、希尔星奥尔德 7 试炼、拉铂尔星肯佩德、谱尼七封印与真身等），保留首胜 8004 获得精灵弹窗。
  4. **恢复全套赛尔号原版经典 Flash UI**：彻底淘汰千篇一律的“星际探索手册（米白+深灰代码底板）”原神式模板，恢复原版美术的精灵图鉴（`PictureBookPanel`）、精灵收集奖励（`PetCollectBoundsPanel.swf`）、精灵仓库与六槽快捷调队（`PetStorage.swf`）、融合手册（`PetAmalgamationBookPanel.swf`）、实验室精灵手册（`monsterBook.swf`）、分子转化仪（`MoleculePanel.swf`），以及采用赛尔号原生 `Panel_Background` 科幻蓝边框的 NoNo 养成面板（`PetTrainingPanel`/`PetWorkflowUI`）、精灵刻印（`PetCountermarkBookPanel.swf`）与 SPT 挑战终端（`SptPanel.swf`）。
  5. **数据库自动清理（Migration 032）**：新增并执行 `032_classic_cleanup.js`，自动从 `player_pets`、`player_pet_collection`、`player_items`、`player_essence_hatches` 中清理上述 20 只扩展精灵与原创宇宙精元，清空 `universe_*` 表及非经典收集计划记录，将停留在 `9700~9794/932` 的玩家迁回实验室（Map 5），并在登录时由 `PetManager` 自动保障背包与首发精灵合法。
- **构建与发布回执**：
  - 工作树：`work/classic-cleanup-20261118`（提交 `2910ae4` 已推送至 `fork/main`），构建脚本 `scripts/build-classic-cleanup.cjs`。
  - 线上部署：`classic-cleanup-20261118`，原子更新 39 个文件、精确清理 201 个废弃文件；完整备份位于 `/opt/kose-seer/backups/classic-cleanup-20261118/`，本地回执 `outputs/classic-cleanup-20261118/deployment-result.json`。
  - 服务状态：`kose-seer.service`（PID `3889525`）与 `kose-seer-web.service`（PID `1854128`）均 `active/running`，`NRestarts=0`，`9999` 端口正常监听，数据库迁移版本已达 `32`，启动日志 `0` 条 ERROR/FATAL。

---

## 历史记录：伤害显示、首领承伤与地图护罩

- 用户最后明确要求：伤害浮字显示本次结算值，不按首领剩余体力截断。实际扣血不得超过剩余体力；吸血、反伤、击败与收益继续按真实扣血。用户在本地验证后明确说“发布吧”，本轮据此只发布这六个文件；未沿用上轮完整SPT发布授权，未修改生产玩家数据，未使用子代理。
- 独立工作树`work/collect-map-battle-hotfix-20261102`，分支`fix/collect-map-battle-20261102`，基线`1e9ef51e29a486438181c4873154545aa1e80251`。原脏树`work/original-universe-20261027`保持不动。后续只推用户fork，不推BaiSugar的origin。
- 已确认零伤害根因：`ApplyUniverseAbsoluteDefense`只接受`universeBoss`，普通SPT计算后被归零；改用预算模块的`enabled(battle)`。已确认护罩根因：地图47误用战斗2200体力；地图独立恢复100，战斗仍2200。
- 浮字新增可选`displayDamage`；减伤、护盾和专属机制上限仍生效，仅不按剩余体力截断。`damage`保持实际扣血。分段执行、吸血和反伤不随浮字溢出增加。
- 规范源为本工作树`compat/server-patches/universe-budgets/{UniverseBossBudget,UniverseBossSegments}.js`、`scripts/patch-attack-damage-display.cjs`；类型/转换位于`src/shared/models/BattleModel.ts`、`src/GameServer/Game/Battle/BattleConverter.ts`及`src/shared/proto/common/AttackValueProto.ts`。
- `scripts/build-spt-boss.cjs`已同步完整构建；`scripts/build-collect-map-battle-hotfix.cjs --baseline <捕获的已发布app> --out <目录>`生成六文件增量。目标为`SkillEffectRuntime.js`、`MapSpawnManager.js`、上述两预算模块、`BattleTurnExecutor.js`、`BattleConverter.js`；清单有before/after哈希。完整构建与增量六文件一致，只需重启游戏、不需重启Web或数据库变更。旧SPT发布器合同不适用本轮。
- **已发布`collect-map-battle-hotfix-20261103022602`。** 发布前六文件线上哈希与清单`before`逐一致，脚本`outputs/collect-and-map-hotfix-20261102/deploy-hotfix.py`在`.release.lock`/`.client-release.lock`下原子替换，保留原`root:kose-seer 0640`。安装后回读六文件SHA256等于`after`；游戏PID`2299306`→`2542031`，Web仍`1854128`，双服务active/running、NRestarts=0，`127.0.0.1:9999`接受连接，启动日志0条ERROR/FATAL。备份与回执为`/opt/kose-seer/backups/collect-map-battle-hotfix-20261103022602/`，本地副本`outputs/collect-and-map-hotfix-20261102/deployment-result.json`。回滚只需恢复该备份目录六个文件并重启游戏。
- 线上模块作用域读回：`pvp=false`、`ordinary=true`、`universe=true`、`wild=false`，证明普通SPT伤害不再被跳过而未放开野怪或PVP。生产未做玩家账号自然战斗，业务证据来自本地同字节运行时。
- 验证根目录`outputs/collect-and-map-hotfix-20261102/`。`regression-after-display.json`记录36组通过，包含86个普通SPT入口各物理/特殊攻击实际扣血、过量伤害不放大吸血、机制上限与未执行多段；不是合法全队或难度校准。`build-parity.json`与`universe-segments-after.log`记录构建一致性和既有分段套件通过。
- `controller-acceptance.json`是最新真实SQLite/PlayerInstance/BattleManager/2505序列化回执：布鲁克克三次呐喊，里奥斯每次回击34；蓝光水泵显示3555，第一命2200被击倒后只复活一次；贯穿水枪显示3319，第二命归零并结束，无第三命。
- 原生隔离客户端已实装火焰喷射器100044，五发真实2412令地图罩子80→60→40→20→0，罩子消失并正常发起挑战、胜利。玩家397→132，首领攻击不再全为0。截图`native-mushroom-{shield-broken,challenge-after-shield,victory-hp132}.png`及录屏`native-damage.webm`。里奥斯溢出浮字未完成原生截图，以真实2505回包为证；未做全项目TS编译。
- 收集领奖未改：生产代码与已发布捕获一致；八并发领取61/956只入一只陶诺、一个领取标记，原生领取成功后推进托达。用户尚未回答“同一陶诺反复到账，还是卡片切到后续档位还能领”。该项保留阻塞，不先选根因、不重置标记、不加未经证实的锁。
- 上轮SPT发布仍是`spt-boss-20261102102221992-d5556de`，功能提交`d5556de974da0b78341fa3b31a673f0926ca4a55`；备份`/opt/kose-seer/backups/spt-boss-20261102102221992-d5556de/`。本轮六文件热修复叠加在其上，生产只有这六个文件变化；发布时哈希不是下次开工的实时基线。
- **旧验收降格**：上轮普通SPT承伤归零，`outputs/spt-boss-cutover-20261102/`中的302路线/304回放不能继续证明正常承伤下的难度和资源成本。本轮未重跑全部路线；设计、原生豁免、撤六职和奖励合同仍按三份`SPT_BOSS_*.md`，不得恢复35%份额、40%锁血或六人门槛来通过测试。
- 下一步：玩家刷新重登即生效，无需改客户端。收集现象仍需用户确认“同一陶诺反复到账”还是“卡片推进后续档位”；生产代码与领取标记未改。若要提交源码，需另行授权（当前`fix/collect-map-battle-20261102`未提交、未推送）。

### 历史发布：剩余界面与旧六职SPT（已被当前版本叠加）


- 上一轮范围与授权：精灵仓库与背包快捷调队、经验分配器、每日签到采用已认可的完整原神式底板；全部 SPT 提高难度，包含蘑菇怪，要求六名队员各司其职。用户当时授权“出了方案直接执行到上线”“有分歧选最推荐方案”；该授权不扩展到本次逐只机制任务。本轮未启动子代理，测试保持后台静音。
- 发布：`remaining-ui-spt-20261102-215552677`；完整应用与目标客户端备份为`/opt/kose-seer/backups/remaining-ui-spt-20261102-215552677/`。双锁、14个现网基线和15个保护依赖校验后，增量安装7个服务端文件与7个客户端文件；未执行数据库变更或玩家数据重置。正式包为`outputs/remaining-ui-20261102/remaining-ui-spt-20261102.tgz`。
- 界面实机：仓库冷登录读取、筛选/空结果/分页/详情、空位与满队调换、常用及归组、拒绝后刷新；经验预览、35→36级实际分配3781、满级/余额不足/拒绝；签到两页自选、1级苹果多多入仓、已签禁用及窄屏。数值是各检查结束时的隔离快照，随后另做战斗；不是生产玩家复测。证据`ui-evidence.json`及同目录截图。
- SPT机制：151个入口、135个非零SPT ID，含蘑菇怪、零ID巨型树妖目录与原生封印。六个不同队员完成物攻/特攻/压制/护卫/支援/终结，未破阵保护最后40%体力；普通首领每宠每条命输出份额35%，原生封印保留攻坚例外。完整规则与维护入口见`work/original-universe-20261027/docs/SPT_TEAM_CHALLENGES.md`。
- 最终战斗与奖励：`controller-and-rewards-final.json`逐回合通过151场真实控制器自然通关，每场六职责齐全；另验蘑菇怪重复挑战。142条首胜奖励路由、135个SPT ID的落库与重复抑制通过；13组真实动作不变量通过。单宠303对照151场0胜，不表述为穷举全部单宠与策略。`controller-replay-plan.json`是绑定当前配置的回放输入，最终验收以真实控制器回执和`release-package/acceptance.json`为准；`calibration-final.json`的150胜属于中间报告。
- 原生战斗实机：钢牙鲨开场和后续回合预告显示在左下对战信息栏，顶部血条与回合数无遮挡。最终使用仅本地的临时协议夹具在隔离已登录连接触发真实2411；技能、换宠与显示由原生客户端完成。证据`spt-native-forecast.json`、`spt-battle-opening-final.webp`、`spt-battle-rounds-final.webp`；SPT目录与说明滚动见`spt-guide-final.webp`及`spt-guide-scrolled.webp`。
- 构建修复：实机拦住`PetFightMsgManager is not defined`，确认通用构建器误取最后的`Top_sound` ABC。`build-genshin-panels.cjs`已按原目标索引和Core声明偏移提取，并校验tag数量与名称。修正后战斗类正常加载，无新增同类异常；原生战斗验证通过后才发布。Core仅两个养成ABC变化，其余2125个tag保留；战斗模块仅1535号ABC变化，其余1748个tag保留。
- 线上验证：14个文件SHA256、权限及`root:kose-seer`归属正确，15个保护依赖未变。游戏PID`2034542`→`2108976`，Web PID`1854128`未变；双服务active、NRestarts=0、9999可连，发布后启动日志无ERROR/FATAL。公网5个唯一客户端资源均200、no-cache，完整SHA256与清单一致。回执`deployment-result.json`、`post-deploy-health.json`、`public-verification.json`。
- 验收边界：151场与界面业务验证来自隔离SQLite及真实客户端，未在生产玩家账号重放业务；未在Ruffle逐场游玩151个入口。配置与运行音量均读回0，未测PCM；PP未做独立数值前后对比。
- 清理：本轮后台标签、`remaining-ui-web-v3-20261102`和`remaining-ui-game-release-candidate-20261102`已关闭；两个`/tmp/kose-remaining-ui-1793552707341*`精确副本和本轮远端暂存已删除，临时预览/造数脚本已移除。正式产物、证据及生产备份保留，见`cleanup.json`。源码保留在`work/original-universe-20261027`，未把其他会话改动并入发布包。
- 后续：本轮无未完成项。用户刷新页面并重新登录，查看新界面和实际编队难度；新任务可从本节与项目记忆接手。

## 〇、最新交接（SPT 首胜获得精灵提示，优先读本节）

- 问题：SPT 首胜精灵已落库，但结算只发送物品奖励，客户端没有获得精灵提示。
- 修复：`BattleRewardService` 返回实际已提交的 `rewardPet`；`BattleManager` 保留原物品通知，战后追加原生 8004 `PacketGetBossMonster`。仅有精灵时也通知；后续精元失败不隐藏已入库精灵，重复挑战不重复发宠或提示。
- 验证：`scripts/test-spt-pet-popup.cjs` 使用隔离 SQLite，通过真实首领进入和人为结束战斗覆盖首胜、重复、未满/满包、2304 入包确认、后续物品失败。真实客户端显示小蘑菇形象及入包/入仓去向；隔离库登录有缺 `player_soul_beads` 引起的 5000，关闭后重发已提交通知验收窗口，未自然战胜首领或操作生产玩家存档。
- 交付：独立工作树 `work/spt-pet-popup-20261102`，提交 `8ce11af4fececcf238851cbbb6ed9aab742f6af9` 已合入并推送 `fork/main`。原工作树其他改动未提交或覆盖。
- 发布：`spt-pet-popup-20261102-8ce11af`；备份 `/opt/kose-seer/backups/spt-pet-popup-20261102-8ce11af/`。双发布锁和两文件基线校验后，只替换 `BattleRewardService.js`（`5a26d0cb…`）与 `BattleManager.js`（`570ab64f…`）；游戏 PID `2021540` → `2034542`，Web PID `1854128` 未变，无新增迁移。
- 证据：`outputs/spt-pet-popup-20261102/final-regression.json`、`ui-evidence.json`、`native-bag.webp`、`native-storage.png`、`deployment-result.json`；构建入口 `scripts/build-spt-pet-popup.cjs`。本地客户端、调试连接与测试服务均已关闭。
- 验收边界：结算业务验证来自隔离脚本，窗口验证来自隔离客户端，线上已确认部署、进程和端口；未把这些证据当作生产账号自然首胜实测。

## 已发布：移动与战斗体验

### 移动点击与战斗预告修复（已发布）

- 用户反馈：部分地点需要多次点击才移动；战斗顶部提示明显遮挡体验。
- 已确认根因：原生 `MouseController` 将距上次点击各轴不超过5像素的输入直接丢弃，且跨地图保留坐标；`UniverseMap` 只禁用物件和植物的鼠标命中，漏掉27片未命名前景和25片terrain前景。
- 实现：`compat/client-patches/map-input/MouseController.as` 删除全局坐标去重；`UniverseMap` 对静态景物关闭鼠标命中、保留 `IActionSprite` 实体交互，并关闭纯前景顶层的子物件命中。
- 战斗实现：`UniverseBossHUD` 缓存并通过事件发布预告，不再绘制顶部浮层；新增 `universe-navigation/battle/scripts/com/robot/petFightModule/PetFightMsgManager.as`，将预告写入原生对战信息。`universeBossForecastRequested/Updated` 事件用于开场补发和回合更新，战斗结束移除监听；模块不依赖新Core字段。
- 构建：`scripts/build-movement-battle-feedback.cjs`；产物 `outputs/input-battle-20261101/build/`。Core仅3个ABC变化，其余2124个tag逐字节保留；战斗模块仅日志ABC变化，其余1748个tag保留。地图、XML、服务端及业务规则未改。
- 实机对照：CQ-PORT合法地面(455,325)修复前无移动包，修复后1次点击产生1个真实2101移动包；相邻(589,300)/(592,300)由仅1次移动变为两次均处理。走测CQ-PORT、CQ-06、HUB、LX-PORT、LX-01、LX-03、LX-A2的移动与出口切图，未逐图走测全部95图。
- 战斗实测：通过原生首领交互进入布鲁卡卡战斗，64006开场和第2回合预告均显示在原生对战信息栏；顶部血条与回合数无遮挡。确认败退后返回原场景，未残留顶部提示。证据 `movement-evidence.json`、`ui-evidence.json`、`evidence/after-input.webp`、`evidence/battle-rounds-and-result.webp`。
- 发布：`movement-battle-feedback-20261101`，备份 `/opt/kose-seer/backups/movement-battle-20261101-161839-336543/`，包含3个目标文件的原件；完整安装后服务器哈希均匹配。公网Core与战斗模块均200、no-cache、完整SHA256匹配；本次客户端发布无需重启。回执 `release.json`、`public-verification.json`。
- 传输：17,519字节的 `sparse-client-patch.tgz` 只传3个Core ABC与1个战斗ABC；远端按当前生产原文件重组并核验最终完整哈希，再备份安装。暂存目录已删除，记录 `remote-preparation.json`。本轮未修改SSH白名单。
- 验证页与两个本地服务已关闭，隔离目录 `/tmp/kose-input-battle-1793547287401` 已删除。仅复制的SQLite准备地图、发现与健康伙伴，本次客户端修复未写生产玩家数据。旧库登录时的既有5000提示在修复前也出现，关闭后可完成上述验收；不属于本次新增问题。

### 全服 SPT 首胜击败记录重置（2026-11-02，已执行）
- 背景：首胜奖励配置（`boss_abilities.json`）更新后，历史已击败 Boss 的账号因 `player_challenge_progress.boss_achievement` 已置位而无法触发首胜给宠逻辑。用户授权全服重置重打。
- 操作：
  1. 停 `kose-seer` 服务（避免内存缓存覆盖回写）；
  2. 自动备份生产库至 `/opt/kose-seer/backups/spt-reset-20261102-002638/seer.db`；
  3. 事务执行 `UPDATE player_challenge_progress SET boss_achievement = zeroblob(200);`；
  4. 验证全部 8 个账号 `boss_achievement` 均成功重置为 200 字节 `0x00`；同表 `max_puni_lv`（如 UID 100000004 为 1）与 `tower_boss_index` 严格保留；已有背包、仓库精灵、道具、金币完全未变；
  5. 重新启动 `kose-seer`（新 PID 2021540），9999 端口监听正常；真实登录包读回 `Boss成就: 0/200` 正常。

### 当前线上状态（哈希为发布时值，开工前重新核对）
| 文件 | 线上 SHA256 | 内容 |
|---|---|---|
| `client/assets/dll/NieoCore.swf`（overlay 同值） | `aaad0c026b4b2554520b2ee49a5b79bb4c9f64b80d27e002ea83953b8a44b98e` | MouseController点击、UniverseMap静态景物命中、UniverseBossHUD预告事件；其余2124个tag保留 |
| `client/overlay/resource/module/PetFightDLL.swf` | `366514ff4746b37b2f43758c5650b156ff3ff96aa732e32b50eed94affe2eda7` | 原生对战信息栏显示首领开场与回合预告；其余1748个tag保留 |
| `client/overlay/module/com/robot/module/book/PetCountermarkBookPanel.swf` | `ed11d1757c44277b9fe637768e01126cc7681dbd06500a06c5b2d91e0e2c1507` | 刻印整页重做；能力/技能、伙伴选择、兑换、装备和卸下 |
| `client/overlay/resource/map/9700.swf` 至 `9794.swf` | 各文件见 `outputs/living-world-20261101/release-package/manifest.json` | 95图使用原稿纹理、分层遮挡、材质动态和状态物件 |
| `app/config/data/json/map-ogres.json` | `a7d04b872708b5727fc95cc8592030c20882999ee957333dacc00f2c558d151e` | 136图来源规则 + 17只断源精灵；光之迷城61 尼可拉1463 权重100 |
| `app/config/data/json/pet-acquisition.json` | `1df55467f0d58c799e011cf1067d5888305f653367eed0df6466c2e6f09f4928` | 仅 source/disguises/wild/mechanisms；`exchange` 已删除 |
| `app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js` | `a283305a4ba3007e13b66161e77913dd3d618ace2a9d4abecd68c3a678c5c235` | 已移除 900001 状态与兑换分支 |
| `app/dist/GameServer/Game/Pet/PermanentPetExchange.js` | **已删除** | 兑换与签到状态模块，连同 `.map` 一并移除 |
| `app/config/data/json/collect-plans.json` | `914ad7ebe9e2c0576f36ca833a5405f7a13350f4d312a12a3cad3ebbaacbff01` | 82计划：84查克150(11家族)、85玛尔科1423(13)、86拉博126(15)、87磁碟怪351(17) |
| `app/config/data/json/daily-sign.json` | `6dd924a861535c5e5bb4b20803a7b11e1c5d095903ec26beeb34dd518017a727` | 签到名单，16只绝版亲本，与客户端内嵌目录一致 |
| `app/dist/GameServer/Game/Pet/DailySign.js` | `472a55888df721a4676d58efe591b42c9aec0dcc4d14df3e1e582bff0681f10c` | 免费每日签到：状态12字节、领取16字节、每日去重 |
| `app/config/data/json/pet-acquisition.json` | `1df55467f0d58c799e011cf1067d5888305f653367eed0df6466c2e6f09f4928` | 无 `exchange`；签到现在走 `daily-sign.json` |
| `app/config/data/json/boss_abilities.json` | `43dc57de6a5cde33cf81fb38f9306e766dc49a70aab913a6dea0246dfb1b5845` | 本轮不改；142条首胜发宠配置、135个SPT ID，含目录外蘑菇怪原生奖励46 |
| `app/dist/GameServer/Game/Pet/CollectPlans.js` | `7a12df31998c46fb972d2a0fc92a12de4b0a92465db2e45c5e7f61ff58b1bc70` | 计划判定/领取；列表含 `owned` |
| `app/dist/GameServer/Game/Pet/CollectReward.js` | `dc5702b0816e01c0bab253cb14463dafcd45aae577c9a96c55e30661dd5f3104` | 主宠家族含 303/306/309 |
| `app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js` | `eb9bc6b0eaa4d3b127c2b6916f5191e278d1327656c974545b24f235a3f60edf` | 计划路由 + `IS_COLLECT(5)` 返回缺失主宠 |
| `client/assets/module/.../SptPanel.swf` | `90431104f62437d658ed1ccab79d928f603809d0fdb83b866fa862a08291e7de` | 深色星系侧栏、首领列表、独立立绘与机制详情、首胜奖励及追踪按钮 |
| `client/assets/module/.../PetCollectBoundsPanel.swf` | `639a76006c94e292d1a1fb2ba1c32a741dd5d3b7f01dc4652adadf3d4ec3031f` | 全新底板；四档进度奖励、特殊谱系、经典计划、完成记录 |
| `client/overlay/module/.../PetAmalgamationBookPanel.swf` | `09341a2041bf998e4f4b349f60c6f6344b06dd896dffef296c631e7f6bbc8ed0` | 融合宝典全新底板、配方侧栏、材料流程与滚动详情 |
| `client/overlay/resource/book/monsterBook.swf` | `d073aabf38c893653d372dd034b66953bc40bd46d7aab0a78e05e2528c35c166` | 培养榜整体重做，保留评级、筛选、详情、对比和获取途径 |
| `client/overlay/resource/book/petCollection.swf` | `7c45754b9645fcfaa4d13baf60881454e1a9706070e54736a4087882bad4bce6` | 原神图录式精灵卡阵、独立立绘、永久收藏进度和印记 |

- 服务：游戏与Web均active。本次客户端发布无需重启；SPT重置中的重启见独立记录。
- 最新客户端发布：`movement-battle-feedback-20261101`；备份 `/opt/kose-seer/backups/movement-battle-20261101-161839-336543/`，包含Core两份和战斗模块。上一轮95图、刻印和此前界面继续保留。
- 当前产物、发布回执及实机证据：`outputs/input-battle-20261101/`；前一轮场景与刻印在 `outputs/living-world-20261101/`，星图与六块界面在 `outputs/atlas-ui-20261101/`、`outputs/genshin-ui-20261101/`。

### 场景与刻印联合改造（已发布）

- **新星系场景与名称**：修复背景清晰度、人物与前景遮挡、场景物件交互与可见状态，以及第六星系名称注册和星球归属。具体根因和 LX-05 样板建议见下节诊断。
- **场景参考方向（用户最新补充）**：参考原神的地图场景设计，重点是空间组织、环境生命感、地标引导和交互反馈；与原神式面板 UI 的配色改版分开验收。将这些方法落实到现有赛尔号 2.5D 场景结构。
- **场景验收标准**：远景、中景、前景分层，角色与道具比例、透视和地面接触一致；人物经过栏杆、岩石、植被时正确遮挡。水流、植被、雾气、光束等动态应依附真实场景物件和星球主题。可行走区域、出口和探索地标清晰；交互直接作用于物件，灯具修复后发光、沙堆清理后消失、机关完成后有对应外观变化，状态与现有玩家进度一致。实际窗口放大后仍保持纹理清晰。
- **样板交付口径**：先让 LX-05 深灯裂谷在真实游戏里具备上述空间、动态和交互表现，再推广其余场景。不能以一张高分辨率静态背景、统一撒粒子或只改变文字进度作为场景完成的证据。
- **精灵刻印页面**：用户明确要求重做截图中的「精灵刻印」页，和上述场景问题一起处理。沿用已认可的原神式米白内页、深色导航、细金装饰与独立立绘；整套底板、布局、能力/技能页签、刻印展示和操作区统一重做，不能只给旧蓝色底板换色。当前截图已保存为 `outputs/redesign-backlog-20261101/pet-engraving-current.png`。
- **刻印功能保留与验收**：背包精灵选择、能力/技能刻印切换、库存与效果、当前孔位与装备、精灵属性、兑换、替换装备和刷新回显。实施前核对现网等级限制、价格、库存和装备返还规则；截图中的数字仅作为现状参考，不作为调整业务规则的授权。
- 用户要求「嗯，开始吧」的实施与发布已完成。原神参考、完整场景和整页重做要求继续生效；本轮未修改业务规则或生产玩家数据。
- 源码入口：`scripts/build-living-world-assets.py` 拆分物件、植物和前景；重建时传入 `--cleanplate compat/client-resources/universe/cleanplates/LX-05.png`，CQ-03底图也已放在该目录。`scripts/build-living-world.cjs` 增量编译场景类并修复星系XML；`scripts/build-genshin-panels.cjs --target countermark` 构建刻印。地图碰撞、出生点、出口、服务端交互坐标保持现网一致。素材模型、提示词和引用图记录在 `outputs/living-world-20261101/art/generation.json`。
- 当前产物与基线：`outputs/living-world-20261101/`；Core 已验证仅允许 3 个 XML tag 和 `UniverseMap`、`OgreModel` 两个 ABC 变化，其余 2122 个 tag 逐字节保留。刻印仅替换目标 ABC，其余 474 个 tag 保留。
- 已验证：隔离客户端点击 LX-05 两盏真实灯具，服务器机关进度依次 1、2；点击浮沙后进度 3，沙层消失并出现待挑战精灵。刻印选择 100 级伙伴、能力/技能页签、兑换、装备与卸下，SQLite 读回一致；等级、价格和返还规则未改。证据 `evidence/rift-completed.webp`、`engraving-equipped.webp`、`engraving-skill.webp`。
- 最终产物：`living-world-final.tgz`、`release-package/manifest.json`。Core SHA256为 `2c92530a3f6011017f109d374918f04f5cad7e2952f878163f4ed2543d623fbb`；95图含224个状态物件、196层材质/灯光效果、289片前景，所有图均有可排序的物件或前景。98文件哈希已在本地及发布后的服务器逐一核对。
- 最终 CQ-03 已补充独立干净工作台底图，拾取圆环后完整消失，上方不再遮挡角色；实际服务器 `encounterId=2,mechanism_step=1`。星球资料 XML 已验证 9700–9708 位于根级；不能使用此前嵌套错误的旧 Core。关键实机证据与边界在 `ui-evidence.json`。
- 发布已完成：先核对98个现网基线，再备份并逐文件原子替换；备份 `/opt/kose-seer/backups/living-world-20261101-151723-069367/`。只更新客户端文件，无需重启服务。完整最终包保留；旧包、调整包和远端临时暂存目录已删除。
- 公网验证：97个唯一URL均返回200，文件长度符合清单；Core、刻印和3张样板地图的完整响应SHA256均匹配。游戏与Web双服务active。证据 `public-verification.json`。
- 用户交互授权的临时规则 `182.136.189.205/32 → TCP22` 已通过原代理精确删除，并读回确认不存在；其他SSH白名单未动。记录 `ssh-access.json`，`removed=true`、`cleanupRequired=false`。
- 隔离验证页和服务已关闭，`living-world-final-game`正常退出0；隔离目录 `/tmp/kose-living-world-20261101-1793542540569`、预览脚本及本轮临时构建目录已清理。仅副本准备等级与调查状态，生产数据库和业务配置未写。
- 验证边界：实机覆盖LX-05、CQ-03和刻印关键流程；其余场景通过构建及碰撞保持一致断言，未逐图完整游玩。用户刷新重登后评估整体视觉。

### 新星系场景实施前诊断

- 用户截图场景为澜汐星 `LX-05` 深灯裂谷（9721）。现网 Core 仍为 `76a9d18f…`；本轮仅下载静态资源与反编译核对，不修改产品代码、线上配置或玩家数据。完整基线哈希、反编译源码、图层结构与对照截图在 `outputs/scene-diagnosis-20261101/`。
- 清晰度：95 张背景均预先缩成 960×560；LX-05 原稿 1642×958，使用 Lanczos 缩放和 JPEG quality 95 后嵌入 SWF，线上嵌入 JPEG 与本地背景哈希完全相同。网页适应窗口会继续放大。离线 Ruffle 用同一场景在 1200×700 CSS、DPR 1.25、1500×875 画布比较 medium/high，1312500 像素仅 13 像素不同（约 0.001%），提高渲染质量几乎不能补回纹理细节；该对照仅覆盖静态场景背景。
- 分层：95 图中 71 图没有前景；总共 28 片前景，其中 24 片填 `depth`，但 `universe-map-swf.cjs` 只读取 `depthY`。这些片会进入固定 `top_mc`，不能参与人物 Y 排序。线上 9721 只有整张背景和 81×74 的灯具前景；`depth_mc`、`animator_mc` 均为空，所有嵌入 Sprite 单帧，灯光与主体环境仍烘焙在背景中。
- 交互：现网 `UniverseMap` 仍使用常驻黑边圆点、常驻文字和自动避让连线；`OgreModel` 仍绘制常驻「未收集」。本地源码里的传送光阵、悬停显示、采样反馈及环境微粒并未全部进入这个线上 Core。不能把本地源码或旧记忆当成现网已实现，也不能直接用本地 UniverseMap 覆盖现网并丢掉其既有 HUD 避让逻辑。
- 名称：线上 `worldMap.swf` 已有 `galaxy_6`，但 Core 的 `GalaxyXMLInfo` 原始表没有 id=6；`getName(6)` 返回空字符串，`WorldMapPanel.initGalaxy` 把该值交给 ToolTipManager。9700–9708 的 SuperMap 归属也仍是 `galaxy=0,x=0,y=0`，与原生第六星系接入约定不符。
- 原建议顺序：修复星系注册与归属，以 LX-05 做完整样板，再推广其他场景。该诊断阶段只读；用户随后明确要求开始实施，当前进度以上节为准。

### 远航星图重做（已发布）

- 用户认可上一轮六块界面，要求截图中的远航星图采用同一设计。星图改为深色星域侧栏、可分页场景目录、独立场景详情、遭遇页签与精灵立绘；中转站有八颗星球的快捷入口。
- 源码仍维护在 `compat/client-patches/universe-navigation/core/scripts/com/robot/app/mapProcess/UniverseAtlas.as`，共享 `genshin-panels/panel-art.asinc`；`build-genshin-panels.cjs --target atlas` 单独构建，`--target dex,atlas` 顺序合成同一 Core。`build-universe-maps.cjs` 同步注入美术，后续宇宙构建不会恢复旧底板。
- 构建基线 `abc35639439717ff1ff4a6d3ebeaf8e04441077bff58ab89f3a779610e67a76b`，新 Core `76a9d18fec8de00dfbe3b68a74a8fdd4a83f1d4d14ae54993fcc42a56645ae14`；仅替换 `UniverseAtlas` 的 ABC，另外 2126 个 tag 逐字节保留，包括 `UniverseState`、图鉴及世界目录。
- 后台 Chromium + Ruffle 实机检查：SPT 联动定位、中转站星球入口、场景第二页、首领/稀有/机关/普通遭遇、遭遇翻页、概率全文滚动、未发现禁用、实际跳转 9700/9751、追踪 61 成功及数据库回读、800px 窗口、待捕捉提示、两层放弃确认与取消保留、孵化入口。待捕捉、发现及调查状态只在复制的隔离 SQLite 准备；未执行最终放弃、捕捉或实际消耗精元。
- 验证边界：星图目标类无运行异常；隔离环境原有 2354 魂珠表缺失、2052 `UserInfo` #2030 仍存在。运行音量和配置音量均为 0，未测 PCM。证据与发布产物在 `outputs/atlas-ui-20261101/`。
- 发布：替换前重新匹配线上基线；备份 `/opt/kose-seer/backups/atlas-ui-20261101-125035/` 后原子替换 `client/assets/dll/NieoCore.swf` 与 `client/overlay/dll/NieoCore.swf`，两份 SHA256 均为 `76a9d18f…`。公网 `/dll/NieoCore.swf` 回读 200、`no-cache` 且完整哈希一致；双服务 active，无需重启，未修改服务端、业务配置或生产玩家数据库。刷新页面并重新登录查看。隔离预览服务与临时文件已清理。

### 原神式六块界面完整重做（已发布）

用户明确否决上一轮只换颜色的结果，要求推翻旧设计，连底板一起重做。范围为 SPT、收集奖励、精灵图鉴、融合宝典、收藏馆，并包括用户截图中的精灵培养榜。每日签到本轮未改。

- 视觉：以原神图鉴、背包、合成页的实际截图为参考，重画米白内页、深灰蓝导航、细金装饰、衬线标题、立绘展台、物品卡片和确认按钮。目标面板不再显示旧 `Panel_Background`、原生蓝色书页或旧按钮皮肤。
- SPT 改为星系侧栏、六行首领列表及独立详情；机制可滚动和翻段，地点选择、地图前置和首胜奖励保留。收集奖励以四张后续奖励卡为主，经典四组、特殊谱系、完成记录均可访问，完整条件有悬停提示。
- 图鉴重做搜索、列表、立绘、旋转、资料和获取方式弹层，保留 `PictureBookController` / `UIPanel` 生命周期及 2301 查询。融合宝典保留固定、奇迹、粉珠、未匹配配方、材料、概率和完整获取说明。收藏馆继续使用 91001 永久记录；培养榜保留现网目录和评级口径。
- 源码：`compat/client-patches/genshin-panels/{SptPanel.as,PetCollectBoundsPanel.as,PictureBookPanel.as,panel-art.asinc}`；另外三块仍维护在 `fusion-manual/PetAmalgamationBookPanel.as`、`pet-boss-handbook/monsterBook.as`、`pet-collection/monsterBook.as`。共享绘图片段在构建时注入，每块保持独立 SWF。
- 构建：`scripts/build-genshin-panels.cjs --baseline <六个实时SWF所在目录> --out <目录> --java <java> --ffdec <jar>`，可加 `--target spt,collect,dex,fusion,gallery,ranking`。从对应线上 SWF 提取 SPT、融合、评级、收藏目录，不用旧服务端配置重算数据。原有融合、培养榜、收藏构建器也已注入同一绘图片段，后续更新数据不会恢复旧皮肤。
- 保护：各文件仅替换目标 ABC；SPT 195、收集 439、Core 2126、融合 474、培养榜 5、收藏馆 5 个非目标 tag 逐字节保留。未写生产玩家数据库，未改服务端和业务配置，未重启服务。
- 实机：后台 Chromium + Ruffle，复制 `/tmp/kose-local` 的 SQLite 作隔离账号；六块均实际打开。已检查首领选择、收集分类、图鉴编号 70 检索与获取途径分页、融合配方及滚动、收藏筛选和印记、培养榜列表和详情。收藏馆在 800px 窗口可用；恢复前后及配置音量均为 0，未测 PCM。
- 验证边界：隔离旧服务端有 68 个收集计划，生产仍保留 82 个。隔离环境原有 2354 魂珠表缺失和 2052 `UserInfo` #2030 回包不匹配提示不属于本轮目标类；六个目标界面未出现运行异常。未验证生产战斗、领奖、实际融合等写操作。
- 发布：`/opt/kose-seer/backups/genshin-ui-20261101-122033/` 已备份七个目标文件（Core 两份）。替换前重新比对所有基线，安装原子替换并核验哈希。六个公网 URL 均 200、`no-cache`、哈希与构建一致；游戏和 Web 服务均 active。
- 产物与证据：`outputs/genshin-ui-20261101/{build/manifest.json,release.json,public-verification.json,ui-evidence.json,evidence/}`。刷新页面并重新登录才能替换会话内已加载的 Core 和模块；后续由用户评估视觉。

### 绝版神宠每日签到（本轮已恢复）

症状：面板标题「绝版神宠 · 每日签到」，一直显示「正在读取签到状态…」。

根因：客户端 `FightExchangePanel.onStatusResponse` 要求 `IS_COLLECT` 的 900001 响应至少 12 字节（组号 + 已签 + 累计天数）；删兑换时把 900001 分支一并去掉，服务端落到通用分支只发 8 字节，客户端直接 return，`_statusReady` 永远为 false。不是网络或资源问题。

处理：保留原有 `receiver_claims` 表与上海时区日界，新增 `DailySign.js` 与 `daily-sign.json`：

- 状态：回 12 字节 `[900001, 今日已签0/1, 累计天数]`
- 领取：回 16 字节 `[petId, catchTime, coins, error]`；成功 0，同日重复 5002，名单外 5001
- 规则：**完全免费**，不扣赛尔豆；每个上海自然日限 1 只，1 级直接入仓库
- 名单：108/62/378/445/448/469/515/526/560/576/596/598/604/618/677/682，与客户端 SWF 内嵌目录逐项一致
- 协议路由：`PetCollectHandler` 的 IS_COLLECT 与 PET_COLLECT 各加一处 900001

验证：隔离 SQLite 跑通首日状态(0,0)→领取1级→同日拒绝5002→名单外5001→跨天(0,1)→再领成功→累计2天→新玩家归零；生产确认模块可加载、名单16只、路由2处、日志无错。

### 图鉴获取说明（本轮，已上线）

图鉴原本就有「获取说明」弹窗（`PictureBookPanel.onNavigate`），但底表 `ACQUISITION` 数据过期。本轮只刷新数据，不改交互。

- 生成方式：`scripts/build-picturebook-acquisition.cjs` 读审计 `coverage.csv` + 线上 `pets.xml`/`items.xml`/`collect-plans.json`/`tasks.json` + Core 的 MapConfig，输出 1521 物种、1711 条途径，写入 `PetBookXMLInfo` 的 `ACQUISITION` 表。
- 部署形态：只替换 `com/robot/core/config/xml/PetBookXMLInfo` 一个 native class；其余 2126 个 tag 逐字节保留，脚本内置校验。
- 展示效果：`分布:` 行显示简短分类（如「光之迷城」「等级进化」「收集计划」「星系擂台」），后面的「获取说明」链接弹出逐条说明，野外类途径提供「前往/查看」跳转。
- 文本示例：尼可拉1463 → 「光之迷城的野外精灵中可以捕捉。」；拉博126 → 「拥有 10 个不同精灵家族后领取拉博。」；圣霆雷伊3406 → 「帕诺星系擂台通关奖励。」；布鲁布109 → 「由布鲁升级进化获得。」
- 已验证：ffdec 回读生产 Core 确认 1521 条数据、无重复 route；客户端页面加载「客户端已加载」且控制台 0 错误。图鉴面板实际点击由用户实机确认。

### 删兑换后的孤儿精灵（本轮已修）

删除兑换与签到后，审计立刻暴露 5 条新孤儿：拉博126、库博127、磁碟怪351、双碟怪352、迪斯凯特353。其原生记录正是「每日签到领取」，随签到体系一起消失。

处理：新增收集计划 86 拉博126、87 磁碟怪351，各自固定发一只；127/352/353 由等级进化传导。补齐后审计回到 **1521 条全部可达、0 缺失**。

门槛修正：初版把 84-87 全部设为 10 家族，玩家一到 10 家族会同时亮 4 张卡，等于集中白送。现已分散为 11/13/15/17，每升 2 个家族解锁一只，与既有偶数档交错且无重复门槛。

教训：任何删除获取途径的改动都必须重跑 `scripts/audit-pet-acquisition.py`，否则会静默产生孤儿。

### 常驻兑换下线（本轮，已上线）

用户判定「1000 赛尔豆买一只精灵基本等于白送」，要求彻底下掉，不是隐藏入口。

- 线上删除：`app/dist/GameServer/Game/Pet/PermanentPetExchange.js` 与 `.map`；`PetCollectHandler.js` 移除 900001 的 `HandleSignInStatus` 与 `HandleExchange` 两处分支；`pet-acquisition.json` 删除整个 `exchange` 字段（原只有 126/351、coins=0）。
- 源码删除：`compat/server-patches/acquisition-expansion/`（含 `exchange-groups.json` 与 `wild-additions.json`）、`scripts/build-acquisition-expansion.cjs`、`scripts/test-acquisition-expansion.cjs`、`scripts/build-acquisition-entries.cjs`、`scripts/build-daily-sign-status.cjs`、`scripts/test-daily-sign.cjs`、两份 `PermanentPetExchange.ts/.js`。
- 源码改造：`build-pet-resources.cjs` 删签到兜底名单与实验室签到菜单两段（保留 SWF 标签与战斗/头像资源下载）；`build-safari.cjs` 删签到池与 `MapProcess_5` 重编译项；`build-beidou.cjs` 改锚点，不再依赖 900001 行；两份 `pet-acquisition.json` 补丁删除 `exchange` 字段。
- 协议层结果：900001 现在落到 `canClaimCollect` 判定失败，返回 5001；不存在可用的兑换或签到状态查询。
- 客户端无需改动：从未有精灵兑换面板，原方案本就无法在客户端触达。

### 光之迷城权重修正（本轮，已上线）

- 尼可拉1463 原先权重 1，在 5% 单格稀有图上进图遇见率约 0.05%，实际抓不到。现提高到 100，与主精灵吉宝237 同级，遇见率约 2.49%，提升约 50 倍。
- 吉娜斯239 与 237 是同一进化链（237→238→239，20 级进化），权重保持 1 不影响可获得性。
- 构建脚本新增 `petWeights` 支持，供后续按图按精灵单独调权重。

### 收集奖励的进度口径（用户询问）

收集奖励**基于玩家实际拥有的精灵家族数**，不是图鉴点亮数：

- `ownedFamilyCount` 取 `player.PetManager.PetData.PetList` 中每只精灵的 `PetClass` 去重计数。
- 判定使用 `have >= plan.ownedFamilies`，`have` 即上述去重家族数。
- 因此放生或消耗精灵会降低计数；图鉴记录是否点亮不影响判定。
- 另有 2 个家族计划（id 6、7）走 `families` 分支，要求集齐指定进化链。
- 面板展示的 `have/need/owned/claimed` 全部来自服务端这同一套计算。

### 断源精灵来源补全（本轮，已上线）

口径：把「图鉴有、但没有任何获取途径」的条目补齐，不删图鉴条目。

- 审计模型原先漏掉**星系擂台奖励**，把王之哈莫3022、圣霆雷伊3406、圣战盖亚3481 误判为缺失。三只实际由帕诺/卡兰/罗格擂台 `rewardPetId` 直接发放 100 级个体；已在 `scripts/audit-pet-acquisition.py` 增加 `StarArenaCatalog.json` 来源。
- **实验室常驻兑换已彻底删除**（见上节「常驻兑换下线」）。原 527 只方案与 `exchange-groups.json` 均已移除，不能再当作获取途径，也不能作为未来重建基础。
- 17 只按 `compat/server-patches/pet-acquisition/ordinary-routes.json` 的原生捕捉描述回到记录地点，权重默认稀有档 1：尼古尔峭壁58 杰西卡432/暗金杰西卡1460/查尔1396；云霄星高空层26 阿尔克461/萨里1401；双子贝塔星47 诺拉德652；塔克星60 马尔洛932；海洋星深水区21 莫德1072；尼古尔星57 鲁迪诺斯1143/瑞姆1267；克洛斯星沼泽11 巨蘑怪1192；露希欧泥潭55 洛拉托兹1237；克洛斯湿地550 奈奇1398/艾菲德斯1459；赫尔卡星30 拉可尼1462；光之迷城61 尼可拉1463；云霄星25 霍迪斯1487。
- 查克150、玛尔科1423 的原生野怪池在客户端未登记地图（400/793），无法加回野外，改为收集计划 84/85，门槛 10 家族，固定发一只；进化形态 151/152、1424 由等级进化传导。
- 构建入口：`official-wild-spawns.json` 每图新增 `restorePetIds`；`build-official-wild-spawns.cjs` 同时生成 collect-plans 产物，新增计划会自动并入。

结果：审计由 1521 条中 32 条缺失变为 **0 缺失**。17 只在 136 图 × 500 次隔离采样中全部实际刷出，12 次计划领取与重复拒绝通过。

权重取舍：光之迷城61 是 5% 单格稀有图。尼可拉1463 初版权重 1，进图遇见率约 0.05%，实测抓不到；现改为权重 100（与主精灵237 同级），遇见率约 2.49%。吉娜斯239 权重 1，但它由 237 在 20 级进化得到，不依赖野外相遇。

### 上一轮设计口径（用户确认）
1. 每个 SPT 首领首胜都有奖励精灵，强度随首领难度递增；与精元并存，只发一次。
2. 收集奖励固定单只、不选一（三主宠除外）；弱档进收集，强档进 SPT。
3. 有普通生态的场景采用主精灵权重100、其余1；纯稀有和原生机关场景按用途处理，不强塞普通主怪。
4. 断源精灵从野怪池剥离，由 SPT / 收集承接，不硬塞野怪。

### 收集面板原生进度页返工（已验收、已发布）
用户确认采用「进度条 + 4 原生格」：展示下一档进度和后续四档奖励，特殊计划单独一页，不逐期翻阅图鉴列表。

- 入口：实验室左侧初始精灵容器。沿用生产Core的缺主宠补给提示，确认后打开图鉴进度页；上一页可回到原版两页，下一页进入稀有谱系和图鉴进阶。
- 美术：从 `UI_PetCollectBg` 复用原生卡框与 `boundsBtn`，四格横排、宋体文字、48px 原生头像。进度条也复用原生框体，无自绘色块卡片或 `bgBtnY` 替代按钮。
- 状态：按服务器 `have/need/owned/claimed` 显示未达成、可领取、已拥有、已领取；未领取且未拥有的档位按门槛排序，领取后重拉900004自动补档；完成态按实际图鉴列表长度统计，特殊计划悬停展示条件。
- 修复：奖励格在首次渲染前创建；旧 Core 头像接口改用 `ClientConfig.getResPath("pet/head/…")`；补上 `NpcTipDialog` 实际包导入；等待领取回包期间禁用按钮，拒绝后提示并刷新。
- 已发布产物：`outputs/collect-panel-progress-20261101/client/assets/module/com/robot/module/app/PetCollectBoundsPanel.swf`，SHA256 `20f9af587d3f8d95a37e12814b618f2cc747472d18d896b0a37fe3d77fb0bbd7`。初始构建基线 `0a685522…`；发布前再与实时线上 `f1dfc58a…` 比较，仅ABC索引436变化，其余标签与SWF头逐字节一致。
- 构建与校验：`build-collect-plan-panel.cjs`、`test-collect-plan-panel.cjs` 已通过；服务端协议不变，新增收集档位见下节。
- 实机：后台 Chromium + Ruffle、本地 `/tmp/kose-local` 隔离账号。10 家族真实领取哲尔尼，家族数 10→11，12/14/16/18 档自动补上；真实领取辛克；重复领取 5002 显示原生提示；已拥有不显示领取按钮；重登回显、原版翻页、特殊计划提示、66 档全部拥有、800px 窗口均已验证。
- 静音：Ruffle 加载配置 `volume=0`，恢复前后读回均为 0；未测量 PCM。未启动前台游戏。
- 返工阶段证据在同目录 `evidence/` 与 `runtime-evidence.json`；本轮生产Core+76档的复测在 `outputs/official-wild-distribution-20261101/ui-evidence.json` 和 `evidence/native-panel-76.png`。新增10个奖励头像与多特/吉塔实际野怪模型的公网资源全部返回有效SWF，详见 `release/resource-verification.json`。
- 返工阶段的原 `/tmp/kose-local` 测试库已还原；本轮额外验证全部使用独立复制品，生产玩家数据未动。本轮后台验证页面、三个临时服务、两份隔离复制目录和远端暂存目录均已清理；原测试库、正式产物、证据和生产备份保留。
- 公网面板和Core回读均为200、`Cache-Control: no-cache`且SHA256匹配；Core仍为 `85a2d9a9…`。部署与验证回执位于 `outputs/official-wild-distribution-20261101/release/`。客户端刷新并重新登录后加载新面板。

### 经典场景精灵分布修正（已实现、已发布）
- 用户明确要求按官方设定修正；克洛斯星林间只保留蘑菇怪 Boss 与特殊稀有依依。普通池清空，原生依依10秒演出、三次火焰喷射后触发12/1战斗的客户端逻辑保留；蘑菇怪仍走12/0。
- 逐图规则为 `work/original-universe-20261027/compat/server-patches/official-wild-spawns.json`。参考第三方整理的2021-02-19逐图表 `https://www.doyo.cn/news/138440.html`，结合已核官网类型说明与当前客户端原生逻辑；不把图鉴地点或跳转ID当刷怪真值，不声称该转载表是官网原文。
- `scripts/build-official-wild-spawns.cjs` 基于当前生产快照增量生成。136个经典场景中62图配置变化，移出201条候选、恢复9条；95个原创宇宙场景和4个自定义擂台保留，Boss配置不改。海底22恢复小鳍鱼198；贝塔荒原49为丁格105；NoNo之洋56为水草蛙211。赤甲虫移回17，埃尔特移回13；原生稀有巴多16、晶岩兽55、德普462保留。
- 林克41、吉宝61、斯内克62为单只低概率出现，沿用本服5%稀有档；该概率是本服调优，不称官方精确概率。未定义的12种后期精灵不造替代品，既有空剧情/活动场景不塞怪；普通地图数量、已保留条目的等级/掉落等沿用本服设定。
- 10个确实断源的弱档家族追加到收集：阿兹、沃特、西蒙、佩希、本竺、嘟拉、粉粉、布鲁、邪特、塔塔。计划ID74–83、门槛142–160家族，各固定发一只。原68项计划及134个SPT奖励不改；共78项计划，其中76档图鉴。
- 获取审计补入实际已开放的远航遭遇、深海救援、奇迹融合及收集计划，并按真实刷怪开关判定来源。修前/修后同模型均为1521条图鉴中1486条可达，35条既有未连通；本次无新增断源。模型不替代所有玩法实机验收。证据在 `outputs/official-wild-distribution-20261101/{audit-before,audit-final,acquisition-comparison.json}`。
- 真实服务端与隔离SQLite验证通过：136图各500次生成，共68000次；三张稀有图的概率边界；小鳍鱼与12/1依依真实捕捉、满包入仓；蘑菇怪破盾后正常建战；10个新增奖励逐个实领、重复领取拒绝、列表读回已拥有/已领取。捕捉只把随机熵控制为暴击捕捉，不替换战斗或发宠模块。证据：`runtime-evidence.json`；命令用Node22执行 `scripts/test-official-wild-spawns.cjs <assembled-app> <evidence.json>`。
- 后台静音Ruffle使用生产Core `85a2d9a9…` 与面板 `20f9af58…`，已看到原生四格和0/76计数，收到78项真实计划；缺主宠提示和成功提示按原生流程确认。加载配置volume=0，恢复前后读回0，未测PCM。测试库为独立复制品，原研究Core缓存和原 `/tmp/kose-local` 数据保留。
- 仅部署 `map-ogres.json`、`collect-plans.json`、`PetCollectBoundsPanel.swf` 三文件。生产只读实跑确认：林间普通怪0、站桩Boss47、特殊依依12/1→83；海底100次抽样仅198；三张纯稀有图概率边界通过；78计划和76档已加载。原135个SPT均有首胜宠配置，其中134项为补充奖励目录，另1项为蘑菇怪原生奖励46。未初始化生产数据库或操作生产玩家；详见 `release/live-runtime-evidence.json`。

### 待验证（用户实机）
- SPT 终端奖励行是否正确；打一个首领确认首胜同时给精元 + 精灵。
- 图鉴：任意条目看「分布」行与「获取说明」弹窗文字是否通顺，野外条目点「前往/查看」能否跳转。
- 收集面板现82计划，84-87 分别在 11/13/15/17 家族解锁；用户可刷新重登后确认显示与领取节奏。
- 绝版神宠每日签到：打开面板应显示「累计签到：N 天 · 今日待签」，签到领取后提示入仓，同日再点提示明天再来。
- 光之迷城61 尼可拉1463 现约 2.49%/进图，可实测抓取；如仍偏难，用 `petWeights` 继续上调。

### 已知问题 / 下一步
1. **经典场景来源已修正**：使用 `build-official-wild-spawns.cjs` 和显式来源规则；`build-main-species-weights.cjs` 是历史权重工具，不作为经典场景来源依据，不能按编号或进化层级猜分布。
2. 图鉴现为82计划：2家族计划 + 80图鉴档（10→160，其中84-87穿插在11/13/15/17）。门槛按玩家实际**拥有**的家族数判定，不是图鉴点亮数；放生或消耗精灵会降低计数。**新增计划不要复用已有门槛**，否则会在同一档集中发多只。
3. 获取审计当前 **1521 条图鉴全部可达、0 缺失**，证据 `outputs/exchange-removal-20261101/audit-final/`。审计是静态模型；**任何删除获取途径的改动都必须重跑审计**，本轮删兑换就暴露了 5 条新孤儿。
4. 稀有精确概率与等级属于本服调优；12个缺定义的后期物种未新建。95个原创宇宙场景和4个自定义擂台保持原配置。
5. **常驻兑换方案已作废**：`exchange-groups.json`、构建脚本、服务端模块与协议分支均已删除。未来若要再引入兑换，必须重新实现客户端面板与整套流程，不能恢复旧文件。
6. 图鉴获取说明依赖 `ACQUISITION` 表，刷新入口是 `build-picturebook-acquisition.cjs`（需 `--audit` 指向最新 `coverage.csv`）。表内文本由审计标签自动生成，改措辞改脚本里的 `label()`。
7. **签到与兑换不是一回事**：签到免费、每日 1 只、有天数累计，已恢复；兑换（花赛尔豆）已永久删除。不要把签到改回付费。客户端签到名单编译在 `FightExchangePanel.swf` 里，改名单需同时改 `daily-sign.json` 与重建该模块。

### 关键脚本
- 经典分布：`scripts/build-official-wild-spawns.cjs` / `test-official-wild-spawns.cjs`；逐图规则 `compat/server-patches/official-wild-spawns.json`；获取审计 `scripts/audit-pet-acquisition.py`。
- 计划与 SPT：`scripts/build-collect-plans.cjs` / `test-collect-plans.cjs`
- 收集面板：`scripts/build-collect-plan-panel.cjs` / `test-collect-plan-panel.cjs`
- SPT 面板奖励行：`scripts/build-spt-rewards.cjs`
- 主宠服务端驱动：`scripts/build-starter-server-driven.cjs`（基线要求 Core `ad671f6f…`，产物 `85a2d9a9…`）
- 图鉴获取说明：`scripts/build-picturebook-acquisition.cjs`（参数 `--baseline --audit --out --java --ffdec`），数据来自审计 `coverage.csv`。
- 权重调整：`official-wild-spawns.json` 每图的 `petWeights` 可单独覆盖某只精灵权重；默认主精灵取 `weights.main`，其余取 `weights.other`。
- **已删除脚本，勿再引用**：`build-acquisition-expansion.cjs`、`test-acquisition-expansion.cjs`、`build-acquisition-entries.cjs`、`build-daily-sign-status.cjs`、`test-daily-sign.cjs`；`build-pet-resources.cjs` 与 `build-safari.cjs` 已移除其中的签到/兑换段落。



## 一、历史生产状态（原创宇宙发布，非当前；仅作历史参考）

1. **线上部署标识**：`universe-galaxy-system-20261101`
2. **线上运行环境**：
   - 服务端 PID：`1018823`（`kose-seer.service`，监听 `127.0.0.1:9999`）
   - Web 代理 PID：`1854128`（`kose-seer-web.service`，监听 `127.0.0.1:18760`）
   - 公网入口：`https://edu.jingxi-tools.com:18761`
   - 线上数据库：`/opt/kose-seer/app/data/seer.db`（SQLite，已完成版本 30 迁移）
   - 世界发布开关：`universe.json` 已开启 `publishable: true`
3. **备份位置**：
   - `/opt/kose-seer/backups/universe-deploy-1793322535/`（保留部署前 89 个受影响文件的原貌）
   - `/opt/kose-seer/backups/universe-galaxy-system-20261101/`（保存部署前 worldMap.swf、Galaxy_1.swf 与 NieoCore.swf）
4. **合并与配置保护**：
   - `boss_abilities.json`：保留全部既有 143 位 Boss，合入 49 位原创/迁移 Boss，线上现有 152 位有效 Boss。
   - `items.xml`：保留原有全部道具，增量加入 9 种领主精元。
   - `pets.xml` / `skills.xml` / `spt.xml`：全量合入 20 种扩展精灵、26 个原创专属技能和 SPT 关系。
   - `server.json`：完全保留线上原有生产配置，未触动数据库类型与路径。

---

## 二、本次解决的关键缺陷与 Bug 修复

1. **生态调查未完成导致 5001 通用报错**：
   - 服务端 `protocol.js` 返回专用错误码 `59998`；客户端 `UniverseState.as` 拦截并友好提示：“请先完成本场景的三个生态调查地标，再选择追踪。”。
2. **闪光前置未完成导致 5001 通用报错**：
   - 服务端 `protocol.js` 返回专用错误码 `59997`；客户端拦截并提示：“请先完成此精灵的追踪前置机关，再选择追踪。”。
3. **闪光尼尔 steps 描述修正**：
   - `world-catalog.json` 修正说明，明确需“完成三处地标调查，并校正三面镜子后追踪”，消除玩家疑惑。
4. **背包全部阵亡时挑战遭遇怪 5001 报错**：
   - 遇到全阵亡情况返回专用码 `59999`，客户端拦截提示：“背包中没有体力充足的精灵，请先恢复精灵体力。”，待捕怪继续保留在场景中。
5. **仓库取宠动态越界 5001 报错**：
   - 修复两处 `PetManager.as` 中 `upDate` 循环边界：`if(ts == null || i >= ts.length)`，根治刷新中途取到 `catchTime=0` 导致的服务端报错。
6. **Boss 治疗预算动画与浮字同步**：
   - 修复艾丝柏等 Boss 在实际恢复（如 `+440`）与客户端动画超额浮字（旧为 `+1869`）不同步的问题。
7. **客户端 Core 重新编译与部署**：
   - 编译最新 `NieoCore.swf`（SHA256: `6205eef6...`），全量同步至本地与线上静态服务目录。

8. **原创宇宙星系体系化重构与视觉体验升级**：
   - **彻底废除图1色块弹窗**：移除此前在 `Galaxy_1.as`（帕诺星系）强塞的悬浮按钮及纯代码矩形弹窗 `UniverseAtlas.as`。
   - **大地图接入第六星系**：在 `resource/worldMap.swf` 的 `galaxyMC` 容器中追加 `galaxy_6` 原生按钮，坐标 (490, 160)，采用天蓝深空螺旋星系光效，悬停原生展示“远航星域”提示浮签，点击平滑居中镜头并进入。
   - **新建第六星系星球图层**：编译产出 `subMap/Galaxy_6.swf`，原生承载 8 颗星球（苔歌、澜汐、烬脉、霜环、磁穹、风砂、暮镜、曜遗）与远航勘探站。
   - **补全星球 MapTip 悬浮信息（解决反馈图1）**：在 `MapIntroXMLInfo` 中为 9700~9708 全量注入各星球的 SPT 领主（红字带星号）、常规野怪、稀有遭遇与专属矿产产物。玩家悬停任意星球，标准 `MapTip` 完整呈现难度星级、适合等级、精灵清单及产物资源。
   - **彻底重构场景传送门与调查地标（解决反馈图2、图3）**：
     1. 彻底移除场景地面上的位移黑圈、连线与常驻大字调试框，出入口采用透视地面传送光阵，悬停才浮现目标地名。
     2. 废除此前死板的“大黄星”与“调查地标2”字样。改为优雅的微光星芒采样点（未调查为金色微光星芒，已完成自动转换为沉静幽蓝圆环）；鼠标悬停显示符合世界观的“生态采样点 · 步骤 X”。
     3. 增加**赛尔号原生交互反馈**：点击采样点角色走达后，弹窗实时播报采样进度（如“你仔细记录了此处的生态特征，成功采集样本数据！（当前进度：2 / 3）”，全部完成播报“🎉 本场景的 3 处生态特征已全部调查完毕！稀有精灵的生命反应已增强，可前往追踪！”），杜绝无反馈假死感。
   - **修复野怪扎堆杂乱与稀有权重（解决反馈图1）**：
     1. 服务端 `MapSpawnManager.js` 移除了此前强制每槽挑选不同精灵的 `splice` 逻辑；恢复标准赛尔号生态规律：单图由 1~2 种常见野怪主导群落，地域/稀有野怪低概率偶现。
     2. `map-ogres.json` 全量 86 张原创生态图权重分级：常见野怪权重提至 12（占 ~85%），地域稀有权重设为 1（~15%），刷新数量恢复为自然 2~3 只。
     3. `OgreModel.as` 彻底抹除场景中常驻野怪头顶的“未收集”文字，仅闪光精灵保留金色“闪光 ”标签；收藏状态只在鼠标悬停 ToolTip 提示中展示，场景全面还原纯净原版观感。

## 三、免浏览器数值与自动化测试体系

后续接手的 AI 或用户可直接通过脚本秒级验证全部底层机制，无需开浏览器：

### 1. 执行命令
在工作区 `work/original-universe-20261027/` 目录下执行：
```bash
node scripts/run-all-universe-checks.cjs
```

### 2. 自动化测试套件演进与验证结果
- **第一阶段（11 项核心数值与战斗逻辑）**：首先跑通了 Boss 治疗预算、遭遇概率保底、生态 Boss 破幕、前沿 Boss 防御、多段拆盾、PP 耗尽应急撞击、追击增伤消除、20 只精灵六维进化、26 个原创专属技能、战斗通用管线及 49 位 Boss 真实分段战斗（11/11 全通）。
- **第二阶段（扩充至 16 项全系统覆盖）**：按用户更全面的测试要求，进一步把 Boss 首胜与孵化奖励服务、原生 A* 寻路与网格碰撞、图鉴 2301/2302 协议范围查询、0 PP 合法不行动以及 192 个 Boss 技能在服务端/客户端的 XML 与 SWF 映射纳入一键测试套件。

当前运行 `node scripts/run-all-universe-checks.cjs`，输出为完整的 **16/16 全部通过**：
- `test-universe-encounters.cjs`：遭遇概率与保底计算通过。
- `test-universe-boss-biomes.cjs`：生态 Boss 机制与反制通过。
- `test-universe-boss-frontier.cjs`：前沿 Boss 机制与防护通过。
- `test-universe-boss-segments.cjs`：多段连击逐段破盾与伤害上限通过。
- `test-universe-boss-exhaustion.cjs`：PP 耗尽 35 次应急普通撞击通过。
- `test-universe-boss-pursuit.cjs`：追击伤害加成与换宠/降攻清除通过。
- `test-universe-species-runtime.cjs`：20 只扩展精灵六维与进化通过。
- `test-universe-original-skills.cjs`：26 个原创技能底层契约通过。
- `test-universe-combat-pipeline.cjs`：战斗全流程与命中暴击管线通过。
- `test-universe-bosses.cjs`：49 位 Boss 真实分段战斗通过。
- `test-universe-boss-rewards.cjs`：49 位 Boss 首胜结算、重复胜利与 1800 秒精元孵化服务通过。
- `test-universe-native-movement.cjs`：原生 A* 寻路 AMF 解码、网格终点对齐、通行耗时与不可走地形碰撞拦截通过。
- `test-universe-dex-query.cjs`：图鉴 2301/2302 协议范围查询与分页回包通过。
- `test-universe-empty-pp.cjs`：我方技能全部 0 PP 时的显式合法不行动轮次通过。
- `test-universe-boss-skill-client.cjs`：49 位 Boss 全部 192 个技能在服务端和客户端的 XML 定义及资源映射完整性通过。
---

## 四、文档资产

- 📖 **`PROJECT_MEMORY.md`**：项目架构、路径、线上服务与协作规范。
- 📖 **`work/original-universe-20261027/原创宇宙测试指南.md`**：玩家/用户实机操作指南与问题反馈模板。
- 📖 **`work/original-universe-20261027/docs/universe/IMPLEMENTATION.md`**：全量技术实现审计与交付证据台账。

---

## 五、下一步待办（给后续 AI / 用户的说明）

1. **用户实机体验**：
   - 用户已授权直接在线上服实机验证。
   - 用户若在公网测试中遇到 UI 细节或特定剧情交互问题，根据反馈继续定点修复。
2. **代码提交与合入**：
   - 当前所有代码修改位于 `work/original-universe-20261027`，等待用户测试满意后，执行向个人 Fork 主干的统一合并与推送。

---

## 六、原版世界体验：历史发布与交接（2026-10-29）

本节记录世界体验会话的已做工作，不替代上文更晚的原创宇宙生产状态。后续部署可能修改同一 Core、战斗资源和配置；以下哈希、PID与文件状态只代表本次发布时，不可当作当前线上基线。

### 工作区与交付

- 开发工作区：`/Users/wuyunfan/Code/saierhao/work/world-experience-complete-20261025`。
- 整合工作区：`/Users/wuyunfan/Code/saierhao/work/world-experience-integration-20261029`。在当时最新 `fork/main` 基线上解决冲突并重建，保留另一会话的既有修改；原工作区未回退或覆盖。
- 个人 Fork `main` 已推送世界体验提交 `505a610` 和指南说明提交 `8c9bc6dff00bccd5be0e6ed113b3a996412ca13e`；没有推送上游仓库。本条是历史提交记录，后续开发须重新获取最新 `fork/main` 和现网基线。
- 玩家指南：`/Users/wuyunfan/Code/saierhao/work/world-experience-integration-20261029/游戏体验测试指南.md`。用户按该文件测试，反馈地图、步骤、实际结果及截图；不要索取密码或验证码。

### 已做范围

- 原版世界地图：补充多星系的入口、原生行走、门、遮挡和部分机关交互；按各图现有素材与条件定点修改。并非所有地图、机关和出口都已实机验收。
- 任务与奖励：恢复任务7的密码箱接取、藤条及炎晶采集、茜茜交付和防寒服转换；同时完成多项剧情续接、家具领取、限次与事务保护。任务95两种套装选择、任务619和624等单项证据在整合工作区 `README.md` 的地图体验章节；不同候选与实际验收范围以记录为准。
- 战斗与组队：补齐原生组队训练、战斗胜败与逃跑流程，以及普通战斗结束后逃跑框残留的修复。加入暗黑武斗场第十一门三条项目补写挑战配置，继承既有守门规则；本次没有修改既有 Boss 配置条目的数值，不应将新挑战称为原版恢复。
- 罗格星图：补充海兹尔星439、拉铂尔星441、菲尔纳星459与般若星481入口。481活动说明的原关闭按钮已接入，关闭后可继续行走。
- 般若星边界：历史活动玩法和史密斯 Boss 尚未恢复；原活动广告不代表当前玩法、奖励或时间已生效。481 的弹窗关闭修复不等于整星玩法完成。

### 发布与验证证据

- 发布标识：`world-experience-20261029T033708Z-8c9bc6d`；部署完成时间 `2026-10-29T04:08:52Z`。回执：`/Users/wuyunfan/Code/saierhao/outputs/world-experience-20261025/release140/deployment-result.json`。
- 持两把发布锁核对线上基线，备份到 `/opt/kose-seer/backups/world-experience-20261029T033708Z-8c9bc6d/`；按清单写入127个文件、精确移除5个旧断线产物，8239个受保护文件未变。仅重启游戏服务；未执行数据库迁移或手工修改玩家存档。删除和回滚必须重新核对当时目标，不能直接对当前生产重放旧包。
- 发布后游戏和 Web 服务均为 active，游戏端口9999监听；公网 Core、Galaxy_3、作战宝典及 SkeeCloth 资源返回200且哈希与该次产物一致。这些是部署当时的检查，不证明现在资源仍是同一版本。
- 最终候选 `140` 的隔离 SQLite 服务端短测23项通过，证据 `outputs/world-experience-20261025/task7-server140/world-experience-server-smoke.json`；不代表生产账号业务全流程通过。
- 后台静音候选实机验证了481弹窗关闭和行走，截图 `outputs/world-experience-20261025/native-task7-134/140-final-closed-walk.png`。另有任务7茜茜取消、重开与确认交付的 SQLite 和界面证据 `native-task7-134/task7-delivery-138.json`，以及兑换、重登截图 `138-cold-exchange-success.png`、`138-cold-relogin-bag.png`。上述证据来自隔离环境，并非生产账号复测。
- 本次测试页在 Ruffle 恢复播放前设置并读回音量0，浏览器后台启动并静音；该次没有采集 PCM，不能将历史其他轮次的 PCM 结果冒称本次测量。
- 构建与星图清单：`outputs/world-experience-20261025/build-native-world140/manifest.json`、`outputs/world-experience-20261025/rog-galaxy140/manifest.json`；地图覆盖及未验边界见同目录 `world-acceptance.json` 和 `PAUSE-CHECKPOINT-20261027.md`。历史候选记录中的“未部署”指当时状态。

### 未完成与下一步

1. 用户已决定自行进行长流程游戏验收。先按指南从任务7、般若星和通用地图流程开始；逐图、窄屏、战斗返回、取消及重登尚不能宣称全部通过。
2. 任务7采集时走动取消、驱雾动画完成门槛等边界仍需用户反馈；不能用其他单项通过推断这些边界通过。
3. 根据用户反馈定位并修复具体问题。用户要求不再启动子代理，不进行前台游戏测试；必要短测须后台静音。不要为重现而重置真实账号、回档或消耗稀有物品。
4. 般若星历史活动及史密斯 Boss 仍是独立未完成范围；先核对素材、现行规则、Boss 配置与其他会话最新工作，证据不足时不得编造奖励或数值。
5. 后续修改或发布前，重新读取上文原创宇宙交接与最新个人主干、线上目标及相关基线；该世界体验历史发布已被后续发布叠加，不能用旧清单整文件覆盖。

---

---

## 七、光明异能王·奥尔德（官方场景希尔星 Map 677 完整还原）2026-10-30

### 交付与线上状态

- **场景与交互全还原**：
  - 官方地图：**裂空星系希尔星（Map 677）**，资源 `resource/map/677.swf` 已在线。
  - 客户端 Core：注册 `MapConfig` 条目 `<map id="677" name="希尔星" x="480" y="320" sound="BGM_097"/>`，编译合入官方原生地图进程 `com.robot.app.mapProcess.MapProcess_677`。
  - 场景交互机制：
    - 6 座圆形祭坛与水晶：`floor_0..5` 与 `crystal_0..5`、点击判定区 `crystalTig_0..5`。
    - 力量（floor 3）、智慧（floor 4）、勇气（floor 5）、正义（floor 2）、仁慈（floor 1）、坚韧（floor 0）。
    - 逐层解锁：未击败前置试炼时提示无法挑战；点击对应水晶弹出试炼介绍并进入战斗。
    - 战胜试炼后水晶隐去、对应平台点亮唤醒（`gotoAndStop(2)`）。
    - 6 试炼全通后，中央祭坛显现光明异能王奥尔德浮动呼吸真身（`yinengBoss` 动画），点击中央真身触发 5 命终极对决。
    - 场景左下方原生传送箭头 `arrow` 激活，点击可返回时空裂缝（Map 400）。
- **入口与星际终端**：
  - 原生 SPT 终端“裂空星系”收录 7 个条目，点击“前往挑战”直接飞往希尔星（Map 677）。
- **服务端数值与逻辑**：
  - 地图 677 规范化挑战参数 1..7。
  - 胜利后自动更新挑战进度 `maxAlderLv`（0..7）并持久化完成官方主线任务 758..763（`TasksManager` 客户端任务列表直接识别完成态）。
  - 机制保持 100% 官方数值（力量必先+攻特攻+2+强化不可消除；智慧每回合偷强化+圣洁光芒；勇气单次压伤100；正义每回合烧伤/冻伤/混乱；仁慈伤害全额吸血；坚韧每回合回500+圣者之心；真身五命 2000/8000/20000/12000/50000，分别对应先手、偷强化、多重异常、PP无限吸血、PP双耗+偷强化+免疫瞬杀）。
  - 真身首胜发放 `400417 异能王的精元`。
- **发布产物**：
  - `outputs/alder-seals-20261030/release-2/`
  - 生产 Core：`client/assets/dll/NieoCore.swf` 与 `client/overlay/dll/NieoCore.swf`（SHA256: `ae17afc0...26ed`）。
  - 生产 SPT：`client/assets/module/com/robot/module/app/SptPanel.swf`（SHA256: `b5880518...c642`）。
  - 备份目录：`/opt/kose-seer/backups/alder-seals-map677-20261030/`（含发布前 `seer.db` 和 `NieoCore.swf`）。
  - 线上进程：`kose-seer.service` active，PID `1224408`，TCP `9999` 正常监听。
- **测试证据**：
  - `node scripts/test-alder-seals.cjs <app>`：覆盖 Map 677 试炼锁定、数值减伤、异常施加、每回合偷强化、五命真身切换、任务 758..763 持久化、重登进度验证全通。
  - 回归测试：`test-puni-settlement.cjs`、`test-universe-bosses.cjs`、`test-universe-boss-rewards.cjs`、`test-universe-combat-pipeline.cjs` 全通。

---

## 八、罗格星系新增星球悬浮修复（2026-11-01，已发布）

### 根因
- 线上 `Galaxy_3.swf` 有 `plantBtn_439/441/459/481`（海兹尔星、拉铂尔星、菲尔纳星、般若星）四个按钮，位置在星系条最右侧（x≈887–1262）。
- 线上 Core 内嵌 `MapIntroXMLInfo` 只有 43 条，缺这四个 id。`MapTipInfo` 构造时 `MapIntroXMLInfo.getTasks(id)` 的 `_dataMap.getValue(id)` 返回 `null`，随后 `null.hasOwnProperty()` 抛错，整个悬浮框中断，名字、难度、精灵全不显示。
- 同类条目缺失可先用 `GetValue == null` 判断是否抛出，不必进游戏复现。

### 构建与产物
- 数据：`compat/client-patches/star-map/planet-tips.xml`，精灵行取线上 `map-ogres.json` 实际刷怪：439 波伦|沃特|#波尼斯，441 无刷怪（空），459 克里|#克罗达，481 泰达|扶来|#泰勒斯；难度 5、适合等级 60以上。
- 脚本：`scripts/build-star-map-planet-tips.cjs`（只改 `MapIntroXMLInfo` 一个 tag，其余 tag 逐字节断言不变）、`scripts/test-star-map-planet-tips.cjs`（修复前 43 条失败，修复后 47 条通过并校验 Galaxy_3 10 个按钮全覆盖）。
- 产物：`outputs/star-map-planet-tips-20261101/client/{assets,overlay}/dll/NieoCore.swf`。
- 哈希：`ae17afc09ce80d29466dec55b027a8c43df47d0c5ceed6cc92349c4d2c2726ed` → `d7b9ee7e8668a4ddf769849643c38b0337ef2daeebe4b141cc274dba3b45272a`。

### 发布与验证
- 备份：`/opt/kose-seer/backups/star-map-planet-tips-20261101/NieoCore.{assets,overlay}.swf`（均为发布前 `ae17afc0…26ed`）。
- 只覆盖两个 Core，0644 `root:kose-seer`；未重启服务，`kose-seer`/`kose-seer-web` 均 active，9999/18760 正常监听。
- 公网 `https://edu.jingxi-tools.com:18761/dll/NieoCore.swf` 下载回读哈希 `d7b9ee7e…272a`，并通过 `test-star-map-planet-tips.cjs`。
- 浏览器可能缓存旧 Core，玩家需强制刷新（Ctrl/Cmd+Shift+R）后生效。
- 回滚：还原备份两个文件即可，不涉及数据库与服务重启。

### v2 追加（同日，已发布）
- 441 拉铂尔星线上 `map-ogres.json`/`boss_abilities.json`/`story_encounters.json` 均无 441，官方 220.xml 也只把 `#SPT肯佩德` 放在注释里，因此不写 sprite 行，避免 `getSprites()` 返回 `[""]` 造成只有标题的空“精灵”行。
- 同时补全 404/411/424/429/435/437 六颗星的精灵列表（线上实际刷怪，最低 weight 稀有档标 `#`）；这六条此前也是空 sprite，悬浮同样显示空“精灵”标题。
- 数据文件 `compat/client-patches/star-map/planet-tips.xml` 现覆盖罗格星系 10 颗星；构建脚本支持“新增条目 + 空 sprite 补全/删除”，重复执行幂等。
- 哈希：`d7b9ee7e…45272a` → `5e686abe83e119e8f0e4398253a2a81c16a51db261d47b5921426229939739ee`。
- 备份：`/opt/kose-seer/backups/star-map-planet-tips-20261101/v2-before/`；未重启服务，公网回读哈希一致并通过 `test-star-map-planet-tips.cjs`（10 星球全覆盖）。

---

## 九、拉铂尔星肯佩德 SPT 首领恢复（2026-11-01，已发布）

### 现状与根因
- 客户端 `MapProcess_441` 已有 `sptBtn`，点击 `FightInviteManager.fightWithBoss("肯佩德")` 发送 `CHALLENGE_BOSS(param2=0)`。
- 服务端 `boss_abilities.json` 没有 `(441,0)` 配置，按钮打不开战斗；`441` 也无野怪/剧情首领（`map-ogres`、`story_encounters` 均无 441）。
- 客户端 SPT 终端（148 条）也没有肯佩德条目。

### 本次改动
- 服务端：`app/config/data/json/boss_abilities.json` 追加 1 条，`(mapId 441, param2 0)`：petId 617 肯佩德、Lv85、customHP 9000、dv31、skills `11546/11545/11544/20593`、`spt.sptId=34`、首胜 `rewardItemId=400161`（肯佩德的精元，1800 秒孵化 → 615 佩奇）、exp/coins 3500。
- 客户端：以线上 `SptPanel.swf` 为基线反编译并追加肯佩德条目（罗格星系 / 拉铂尔星 / Lv85 / HP9000 / sptId 34），FFDec 重编译，只替换 SptPanel 模块 ABC，其余 tag 逐字节不变；条目总数 148 → 149。
- 构建脚本：`scripts/build-kenped-boss.cjs`、`scripts/build-spt-kenped.cjs`；校验脚本 `scripts/test-kenped-spt.cjs`；数据 `compat/server-patches/kenped/kenped-boss.json`、`compat/client-patches/spt-all-bosses/kenped-entry.json`。
- 产物：`outputs/kenped-spt-20261101/`。

### 发布与验证
- 备份：`/opt/kose-seer/backups/kenped-20261101/`（发布前 `boss_abilities.json` 159 条、`SptPanel.swf` `b5880518…`）。
- 哈希：`boss_abilities.json` `9f43ef68…` → `f9fc5fc1f4768b4ac1bc20182edd1e9708da1ed46a9c9e6998cb35f3ecc0d561`；`SptPanel.swf` `b5880518…` → `cfa25335f55596645fe6bef289c449055a2b5535610c45df0fcd5606e6236f6d`。
- 已重启 `kose-seer`（配置启动时加载），PID 1778071，9999 正常监听；公网回读 SptPanel 哈希一致，`test-kenped-spt.cjs` 校验 149 条与 (441,0) 配置通过。
- 离线模拟（`scripts/boss-lab.cjs`，同一份配置、完整 dist）：Lv100 六宠 fixture 20 场 100% 胜、中位 12.9 回合、场均损失 3.2 只；Lv70 队伍 0%，与同星系克拉尼特/墨杜萨一致（SPT 属高等级内容）。属模拟，不等于真人验收。
- 未验证：真实账号首胜发精元、重复击败不发、孵化 1800 秒与成就位，需玩家实机确认。

### 回滚
- 还原备份两个文件并重启 `kose-seer`；已发放的精元不回收。

### 肯佩德机制补丁（2026-11-01，已发布）
- 机制「黑水护甲 · 暗影暴动」，纯 `mechanics` 配置，无战斗代码改动：
  - `startStages [0,0,0,0,0,1]`，开局 `openingSkill 20593 暗影之力`（自身攻击+2）。
  - `armorBreak: "any"`：未降低防御/特防时一切伤害归零（含固定、比例、秒杀）。
  - `boostOnHit {stats:[0,2],max:4}`：破甲后每次受攻击伤害，攻击与特攻+1。
  - `lowHpCritPercent 25`、`lowHpAttackPercent 50`；`ohkoImmune`、免疫 `sameLifeDeath`，不免疫异常。
- 面板说明同步为护甲/暴走描述；条目仍 149 条。
- 离线模拟（同一配置 + 完整 dist，20 场）：无对策 0%（41 回合、场均 5.9 只阵亡）；先降防破甲 85%（12.1 回合、4.3 只）；Lv70 队伍 0%，与同星系 SPT 同档。属模拟，未真人验收。
- 哈希：`boss_abilities.json` `f9fc5fc1…` → `f296ccd3cd683ba5648a367361810a4fccbca33180714d43a8a6989f84149f56`；`SptPanel.swf` `cfa25335…` → `8ec4bbbae174aa2feafee506322017146c34c9b4eee78b35898b4d44cd1325df`。
- 备份：`/opt/kose-seer/backups/kenped-20261101/mechanics-before/`；已重启 `kose-seer`（PID 1781545），9999 正常；公网回读 SptPanel 哈希一致，`test-kenped-spt.cjs` 通过。
- 未验证：真实战斗中的 0 伤害破甲提示、叠攻、残血暴击与首胜精元，需玩家实机确认。

### SPT 终端去重（2026-11-01，已发布）
- 现象：帕诺星系页出现三张盖亚卡，名称/等级/体力/机制说明完全相同，只有地点不同；果冻鸭、哈莫雷特也各重复一次。
- 改动：渲染前按 `id + sptId + 等级 + 体力 + 机制说明` 合并同一首领；卡片位置显示“N 处 · 首个地点”，按钮改为“选择地点”，弹层按地点分别前往；已击败/未击败仍按 sptId 判定。谱尼八封印、布林克克两门因体力/等级不同不会被误合并。
- 条目 149 → 卡片 145（盖亚 3→1、果冻鸭 2→1、哈莫雷特 2→1）。
- 构建：`scripts/build-spt-dedupe.cjs`；校验：`scripts/test-spt-dedupe.cjs`（149 条、145 卡、合并组地点顺序）。
- 哈希：`SptPanel.swf` `8ec4bbba…` → `68f5f57e1c6c66204d1ce239c42336e24db7ff6983b684fa10a05c4340dbb29d`。
- 备份：`/opt/kose-seer/backups/kenped-20261101/dedupe-before/SptPanel.swf`；未重启服务，公网回读一致。
- 未验证：真实客户端中点“选择地点”弹层与前往按钮的交互，需玩家强刷后确认。

### 新星球野怪刷新口径（2026-11-01，已发布）
- 反馈：新星球同屏像“军训”，常出现多只不同精灵。核查：439/459/481/693 各只有一张开放场景；439 的子图 440 是 Task540 密码机关房，459 的 460/461 可走、462 无入口，481 无子图。拆图分散物种需要补场景与入口，不是纯配置。
- 因此先调刷新构成：主宠权重 100，次要 20-40，稀有 10-15；同屏数量从 2-4 收到 2-3。
  - 439 海兹尔星：波伦 100 / 沃特 40 / 波尼斯 12
  - 459 菲尔纳星：克里 100 / 克罗达 20
  - 481 般若星：泰达 100 / 扶来 35 / 泰勒斯 10
  - 693 拉珀尔仙境：1048 100 / 1049 15
- 概率模拟（2 万次）：439 出现单一种群 20%→60%，481 20%→62%，459 30%→77%，同屏最多 3 只。
- 构建：`scripts/build-new-planet-spawns.cjs`；哈希 `map-ogres.json` `31c93b5f…` → `7589e12b909a3bf7a16b3713c72a4eb8e41573b5ea3d2a648a5b1b40292d3f93`。
- 备份：`/opt/kose-seer/backups/kenped-20261101/spawn-before/`；已重启 `kose-seer`（PID 1788757），9999 正常。
- 未验证：线上实际刷新观感与捕捉节奏，需玩家实机确认；若要真正按子地图分层，需要补 440/460/462 的猎场用途与入口。

### 菲尔纳星分层猎场（2026-11-01，已发布）
- 结构：459 菲尔纳星（60-63，克里主）→ 460 赫鲁卡星（63-66，克罗达主）→ 462 赫鲁卡地穴（66-70，德普主）；461 赫鲁卡城不刷野。
- 入口：460 原有 `door_2` 指向未注册的 695 冰雪之城（死门），现改为 462；`MapProcess_460` 在该门位置叠加载入 `/resource/map/462_cave.png` 的可点击地穴入口（加载失败保留深色占位椭圆），ToolTip“赫鲁卡地穴”，点击 `MapManager.changeMap(462)`；462 原有回 460 的门保留。
- 美术：Magpie `codex/gpt-image-2` 生成，裁剪为 300×265 透明 PNG，存 `outputs/kenped-spt-20261101/art/462_cave.png`，线上放 `client/assets/resource/map/462_cave.png`。
- 刷新：`map-ogres.json` 新增 460/462 两张表，459 调整；主宠 100、次级 30/12，同屏 2-3。
- 构建：`scripts/build-filna-layers.cjs`（MapXMLInfo 一条 door + MapProcess_460 重编译）、`scripts/build-filna-spawns.cjs`。
- 哈希：Core `5e686abe…` → `3036d15d2d25d45b328b4f04e189b88192b849da078473a960b01d685c79dd1b`；map-ogres `7589e12b…` → `8c8f9b6f75687ff22e936c91ad31bf2311bc233362b6018d9e8d4cd127ac0e93`；`462_cave.png` `cbcb5170a0d42626c301afa5f86040b8db554e0b158fcddc99ffb3d63533b2d8`。
- 备份：`/opt/kose-seer/backups/filna-layers-20261101/`；已重启 `kose-seer`（PID 1795340），9999 正常；公网 Core 回读一致，图像与 460 地图 200。
- 未验证：入口的实际位置/大小与生成图观感、460/462 内刷新点是否自然、与任务 560/561 是否互相遮挡；需玩家实机确认，可再调坐标或换图。

### 全服野怪等级阶梯（2026-11-01，已发布）
- 规则：按各图当前加权平均等级排序，线性铺到 1-100；单图窗口 7 级；同一条进化链内进化体高于幼生体；只改 minLevel/maxLevel，权重/数量/掉落/闪光不变。
- 结果：208 张图、1011 处等级变化；每 5 级档位 10-11 张图；同链进化倒挂 0。
- 样例：克洛斯星 1-6；海兹尔星 65-71；菲尔纳星 70-76；赫鲁卡星 80-86；赫鲁卡地穴 81-86；般若星 65-71；怀特星/麦兹星/SUN星 95-100；六道星仪 95-100。
- 说明：原创宇宙 95 场景自身从 1 级延伸到 85 级，未整体压到 80-100，否则会损失其内部曲线；因此“区域带”只作为参考，实际按全局强度排序。
- 构建：`scripts/build-level-ladder.cjs`（试跑报告 `/tmp/ladder_report.json` 格式）。
- 哈希：`map-ogres.json` `8c8f9b6f…` → `7f24ffa83d5e61391b1c8ea5f6f96575ac056de6708302a8154b6837922f14ee`。
- 备份：`/opt/kose-seer/backups/level-ladder-20261101/map-ogres.json`；已重启 `kose-seer`（PID 1799571），9999 正常。
- 未验证：实机升级/捕捉节奏、任务怪等级、玩家现有队伍强度；Boss/SPT 等级未改。

### 主宠退出野怪表（2026-11-01，已发布）
- 现象：火山星刷小火猴、克洛斯星林间刷布布种子、海洋星深水区刷伊优，宇宙场景 9709/9718/9723 同样如此。属于历史刷新表遗留，不是等级重排引入。
- 改动：从 6 张刷新表移除三主宠（1 布布种子、4 伊优、7 小火猴），其余物种、等级、权重不变；主宠仍通过初始选择/既有获取途径获得。
- 哈希：`map-ogres.json` `7f24ffa8…` → `5ee374d8fb66172831e51bd90b5f9a035f593a1e30c8e57e3a5b146de9b3a141`。
- 备份：`/opt/kose-seer/backups/level-ladder-20261101/map-ogres.before-starter-clean.json`；已重启 `kose-seer`（PID 1800983），9999 正常。

### 交接（2026-11-01 会话结束）
- 新会话先读 `PROJECT_MEMORY.md` 第 7 节；当前线上 Core `ad671f6f…`、SptPanel `68f5f57e…`、map-ogres `749c1a4a…`（发布时值，开工重新核）。
- 下一优先事项：三主宠第 5 组领取实机验收（实验室 → 精灵收集奖励）、野怪观感反馈。
- 其余待办：462 地穴入口实机观感、等级阶梯反馈、460/462 刷新自然度。

### 三主宠第 5 组 + 野怪表去图鉴化（2026-11-01，已发布）
- 现象与根因：
  - 试炼之塔 30 层 `GrantFreshTowerStarter` 不是发一只，而是把当时缺失的主宠**全部**补到 5 级；已上线并被 2 个账号触发（100000002、100000004）。
  - 实验室组 301（精灵王 10 胜）是死路：`mon_king_win` 全库无写入方、8 个账号全 0，`player_collect_claims` 无 301 记录；服务端也没有精灵王对战后端。
  - 野怪表早期按「图鉴 Foundin」补齐（`evolved-additions.json`、`wild-additions.json`），普通池混入 55 种 73 条 BOSS/融合/超进化/暗黑/暗金/VIP/战神联盟初始（朵拉格 3-6 级刷海洋星、泰格尔 9-11 级刷赫尔卡星、圣光天马 5-6 级刷克洛斯星、卡茨 96-100 级刷怀特星、小布刷塔克星、米咔刷光之迷城）。捕获逻辑不读图鉴捕获率（`BattleTurnService.Catch` 基础 50%），这些都能直接抓。
  - 获取审计反向自证：`ordinary-routes.json` 把朵拉格记作“海洋星捕捉”，因此“1498/1498 有来源”部分靠野刷兜底。
- 改动：
  1. 服务端 `CollectReward.js` 新增组 5（`rewardIds [1,4,7]`、无前置）；仅拦截已拥有的同族主宠，`player_collect_claims` 保证一次。
  2. 服务端 `FreshTower.js` 删除 `GrantFreshTowerStarter`/`STARTER_IDS`；`BattleManager.js` 删除 30 层调用，塔进度 `AdvanceFreshTower` 保留。
  3. 客户端 `MapProcess_5`（Core）：点「精灵收集奖励」时若缺主宠且未领，弹确认后发 `PET_COLLECT(5, 缺失主宠)`，领取后照常打开收集面板。面板 4 张卡的美术烘焙在 `PetCollectBoundsPanel.swf`，硬加第 5 张会显示错误精灵图，所以第 5 组走入口直领而不是新卡片。
  4. `map-ogres.json`：删除 55 种/73 条；克洛斯星/火山星/海洋星/赫尔卡星/海洋星深水区改为常见 2-3 种（100/35/12），其余现代精灵降为权重 1 偶现，闪光条目与刷新数量不变。模拟 2 万次：克洛斯星 65% 出现皮皮，海洋星 62% 贝尔，赫尔卡星 59% 比比鼠。
- 构建与校验：`scripts/build-starter-lab-wilds.cjs`、`scripts/test-starter-lab-wilds.cjs`（野怪表规则、组 5 判定、塔补发移除、Core 仅换 `MapProcess_5` 一个 ABC）。产物 `outputs/starter-lab-wilds-20261101/`。
  - 可复现：同一 baseline 重跑到新目录，6 个文件 SHA256 与 manifest 完全一致（`749c1a4a…`/`15622329…`/`c34138e9…`/`c4328571…`/`ad671f6f…`×2）。
- 哈希：
  - `map-ogres.json` `5ee374d8…` → `749c1a4a…`（833393 字节）
  - `CollectReward.js` `37a339bf…` → `15622329…`
  - `FreshTower.js` `72bc0281…` → `c34138e9…`
  - `BattleManager.js` `8e6a175d…` → `c4328571…`
  - `NieoCore.swf` `3036d15d…` → `ad671f6ffcf0e553d8c693d4ce65e0ccb6a19b135dc666f642bbbf8f17fdb751`（assets/overlay 同值）
- 备份：`/opt/kose-seer/backups/starter-lab-wilds-20261101/`（6 个文件原貌）。
- 发布：先只装文件，重启 `kose-seer`（PID 1840037，13:56:22），`kose-seer`/`kose-seer-web` active，9999 监听；公网 `https://edu.jingxi-tools.com:18761/dll/NieoCore.swf` 回读哈希 `ad671f6f…` 一致。
- 未验证：实机点「精灵收集奖励」领取第 5 组（需强刷 Core）、领取后背包/仓库提示、5 张老图刷新观感；玩家已领的主宠不回收。
- 后续（未做）：重跑获取审计并把被删物种的“获取途径”从“野外捕捉”改成真实来源（融合/超进化/首领），否则图鉴仍显示野刷；`scripts/build-remove-starter-wilds.cjs` 后新增的 `build-starter-lab-wilds.cjs` 应作为下一步数据基线。


### 收集计划扩充 + SPT 全员发宠 + 单图主精灵（2026-11-01，已发布）
- 设计口径（用户确认）：每个 SPT 首领首胜都有奖励精灵，强度随首领难度递增；收集奖励只发弱档、固定单只；一场景一个主精灵，其余稀有偶现；断源精灵从野怪池剥离，改由 SPT / 收集承接。
- 数据：
  - `map-ogres.json`：184 图各 1 只主精灵（权重 100），其余普通野怪权重 1；从拥挤的后段地图剥离 200 个家族（210 种、401 条）；闪光、等级、数量、掉落不变。
  - `collect-plans.json`：68 个计划 = 2 个家族计划（辛克、闪光奇洛）+ 66 个图鉴计划（`ownedFamilies` 10→140，步长 2，奖励固定单只，弱档在前）。
  - `boss_abilities.json`：134 个 sptId 新增 `rewardPetId`（共 141 条，双入口各一条），按首领等级/血量从低到高发强度递增的精灵；原 2 个（蘑菇怪、闪光波克尔）保留，精元不变。
- 服务端：`CollectPlans.js` 新增 `ownedFamilies` 前置（按 PetClass 去重计数）；列表协议 `PET_COLLECT 900004`；领取沿用 `player_collect_claims` 幂等；发宠失败回滚。
- 客户端：
  - `SptPanel.swf`：机制说明后追加「【首胜奖励】XX」，134 个 sptId 全覆盖。
  - `PetCollectBoundsPanel.swf`：第 3 页起为计划卡 2×2 分页（每页 4 张，可翻 17 页），卡片代码绘制、精灵头像用原生资源；进入方式为面板右下「下一页」。
- 哈希（发布值）：
  - `map-ogres.json` `0fee53fde940fc167f99e207fe62290cf6057ec6dab395824d21a3fbd0a37f10`
  - `collect-plans.json` `c2e5e03f86f489ada1488758b4ddcf385b4496f742efb18d132f02500ccee11d`
  - `CollectPlans.js` `8f9f316cf144835d7ce29585e19aa366ef458fc49cbf572aa5a0d377b2c225a6`
  - `PetCollectHandler.js` `bc6eab5d395e5feb00074c25ff1da1906e605c37c9ad51f8bae785e3acf3b257`
  - `boss_abilities.json` `43dc57de6a5cde33cf81fb38f9306e766dc49a70aab913a6dea0246dfb1b5845`
  - `SptPanel.swf` `7b5991090c9786aa8ee11e1ca476b1e9aa96fa425bb2f06e6fe24a52009b1c6f`
  - `PetCollectBoundsPanel.swf` `85d95dae175a2a9056292a37adcdc4de275beb620aed088573a4002c70c40129`
- 备份：`/opt/kose-seer/backups/collect-plans-20261101/`（map-ogres `749c1a4a…`、boss `f296ccd3…`、handler `57e9470a…`、SptPanel `68f5f57e…`、Panel `0a685522…`）。
- 发布：只装文件，重启 `kose-seer`（PID 1858482），双服务 active，9999 正常，启动无 error；公网两个面板回读哈希一致。
- 校验脚本：`scripts/build-main-species-weights.cjs`、`scripts/test-main-species-weights.cjs`、`scripts/build-collect-plans.cjs`、`scripts/test-collect-plans.cjs`、`scripts/build-collect-plan-panel.cjs`、`scripts/test-collect-plan-panel.cjs`。
- 未验证：实机 SPT 首胜发宠与面板奖励行、68 计划分页与领取、剥离后各图实际刷新观感。
- 待办：主精灵自动选择在少数图会选到现代精灵（如克洛斯星林间=苹果多多），需要人工主精灵表逐图修；66 个图鉴计划的阈值 10→140 需按实际玩家进度调。

### 主宠补给提示误判 + 领取报 5001（2026-11-01，热修已发布）
- 现象：已拥有丽莎布布/鲁斯王/魔焰猩猩的账号点「精灵收集奖励」仍弹「你还没有布布种子」，确认后 5001；计划卡点领取也出现 5001。
- 根因：
  1. 客户端 `MapProcess_5.missingStarter` 只查 1/4/7，且依赖 `PetManager.containsStorageForID` 本地缓存，仓库列表未加载时误判为缺失。
  2. 组 5 的家族表 `STARTER_FAMILIES` 只有 1..9，没含 303/306/309（丽莎布布/鲁斯王/魔焰猩猩）。
  3. 计划领取失败时服务端回 5001，客户端 `onHandler` 把失败包当成功（petId=0）弹获得提示；列表也不区分“已拥有”。
- 修复：
  - 服务端 `CollectReward.js`：`STARTER_FAMILIES` 扩为 `[1,2,3,303]/[4,5,6,306]/[7,8,9,309]` 并导出。
  - `PetCollectHandler.js`：`IS_COLLECT(5)` 额外返回缺失主宠编号（按家族判定，服务端口径），客户端不再本地猜。
  - `NieoCore.swf`：`MapProcess_5` 改为直接询问服务端；缺主宠=0 或已领取时直接进收集面板。
  - `CollectPlans.js` 列表新增 `owned` 字段；面板卡片显示“已拥有”并禁用，领取失败弹「条件未满足、已拥有或已领取」。
- 哈希：`CollectReward.js` `dc5702b0…`、`PetCollectHandler.js` `eb9bc6b0…`、`NieoCore.swf` `85a2d9a9d49fda36be16bdd732d8e1450d14c801bd5d7e19b5f7baa196757900`（assets/overlay 同值）、`CollectPlans.js` `7a12df31…`、`PetCollectBoundsPanel.swf` `f1dfc58a…`。
- 备份：`/opt/kose-seer/backups/collect-plans-20261101/` 下另有上一版 Core？没有，Core 备份为 `ad671f6f…` 需从 `outputs/starter-lab-wilds-20261101/client/` 取。
- 发布：重启 `kose-seer`（PID 1864886），双服务 active，公网 Core 回读 `85a2d9a9…` 一致。
