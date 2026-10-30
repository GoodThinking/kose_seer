# KOSE 赛尔号多 AI 交接记录 (HANDOFF.md)

> 更新时间：2026-10-30
> 当前执行阶段：原创宇宙全部开发与 Bug 修复完成，已全量增量部署至线上生产服（154.8.196.52），免浏览器数值自动化测试 11/11 全通。

---

## 一、当前最新生产状态

1. **线上部署标识**：`universe-deploy-1793322535`
2. **线上运行环境**：
   - 服务端 PID：`1018823`（`kose-seer.service`，监听 `127.0.0.1:9999`）
   - Web 代理 PID：`1854128`（`kose-seer-web.service`，监听 `127.0.0.1:18760`）
   - 公网入口：`https://edu.jingxi-tools.com:18761`
   - 线上数据库：`/opt/kose-seer/app/data/seer.db`（SQLite，已完成版本 30 迁移）
   - 世界发布开关：`universe.json` 已开启 `publishable: true`
3. **备份位置**：
   - `/opt/kose-seer/backups/universe-deploy-1793322535/`（保留部署前 89 个受影响文件的原貌）
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

---

## 三、免浏览器数值与自动化测试体系

后续接手的 AI 或用户可直接通过脚本秒级验证全部底层机制，无需开浏览器：

### 1. 执行命令
在工作区 `work/original-universe-20261027/` 目录下执行：
```bash
node scripts/run-all-universe-checks.cjs
```

### 2. 验证结果（16/16 全项通过）
- `test-universe-budgets.cjs`：Boss 治疗预算与浮字回包一致性通过。
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
