# KOSE 赛尔号项目工程记忆与多 AI 协作总则 (PROJECT_MEMORY.md)

> 本文档为项目通用记忆与多 AI / 多会话协作交接基准。任何接手本项目的 AI Agent 均应首先查阅本文件与 `HANDOFF.md`。

---

## 1. 项目基础架构与核心路径

- **代码根目录**：`/Users/wuyunfan/Code/saierhao`
- **当前主开发工作区**：`work/original-universe-20261027`
  - 承载原创宇宙（95场景、49 Boss、20扩展精灵、26专属技能、机关解谜等）核心开发。
- **线上服务器（生产）**：
  - **主机/用户**：腾讯云北京实例 `154.8.196.52:22`，用户 `ubuntu`，免密 sudo 可用。
  - **SSH 配置别名**：`ssh kose-seer`（固定代理出口或直连白名单）。
  - **线上安装目录**：`/opt/kose-seer`（属于 `root:kose-seer`）。
  - **线上数据库**：SQLite 数据库 `/opt/kose-seer/app/data/seer.db`。
  - **公网 Web 访问**：`https://edu.jingxi-tools.com:18761`（Nginx 反代本地 `18760` Web 服务与 `9999` 游戏 TCP 服务）。
  - **线上守护服务**：`kose-seer.service` (Node 后端) 与 `kose-seer-web.service` (静态资源与 WebSocket 代理)。

---

## 2. 线上发布与合并规范

1. **禁止暴力覆盖**：
   - 线上已有数据和配置来自多个版本的迭代积累（如 Boss 配置、掉落、任务系统、原有精灵与技能）。
   - 部署前必须对比本地与线上配置，只做增量合入，严禁直接全量覆盖清空线上已有条目。
2. **备份优先**：
   - 每次部署前必须在 `/opt/kose-seer/backups/` 下自动建立带时间戳的完整备份目录。
3. **数据库迁移机制**：
   - 所有数据库变更必须编写为版本化迁移脚本（位于 `app/dist/DataBase/migrations/scripts/`），并在 `MigrationRunner.js` 中按版本有序注册，由服务端启动时自动平滑升级。
4. **权限保护**：
   - 部署的所有服务端文件权限为 `0o640`，客户端静态文件为 `0o644`，目录为 `0o750`，属组统一为 `root:kose-seer`。

---

## 3. 免浏览器纯脚本测试与数值验证体系

本项目已建立免浏览器自动化数值与逻辑测试套件，位于 `work/original-universe-20261027/scripts/`：

- **一键自动化测试命令**：
  ```bash
  node scripts/run-all-universe-checks.cjs
  ```
- **核心单项测试脚本**：
  - `test-universe-budgets.cjs`：Boss 治疗预算、实际回复截断与浮字回包同步校验。
  - `test-universe-encounters.cjs`：稀有/闪光/机关遭遇出现概率、落空累计增量与硬保底计算。
  - `test-universe-boss-biomes.cjs`：生态 Boss 护盾减伤、火攻破幕、先手蓄力打断。
  - `test-universe-boss-frontier.cjs`：前沿 Boss 连续扫描、属性防护与破防断言。
  - `test-universe-boss-segments.cjs`：多段连击技能逐段破盾、伤害上限与暴击结算。
  - `test-universe-boss-exhaustion.cjs`：技能 PP 耗尽防空转（回退 35 次应急普通撞击）。
  - `test-universe-boss-pursuit.cjs`：追击标记增伤、换宠与先手降攻清除机制。
  - `test-universe-species-runtime.cjs`：扩展精灵六维计算、个体值判定与等级进化阈值。
  - `test-universe-original-skills.cjs`：26 个原创专属技能的战斗底层契约与效果执行。
  - `test-universe-combat-pipeline.cjs`：完整战斗回合管线（优先度、命中、秒杀免疫、固定扣血）。
  - `test-universe-bosses.cjs`：全量 49 位 Boss 真实分段战斗与身份绑定遍历。
  - `universe-boss-lab.cjs`：离线战斗实验室（可对任意队伍与 Boss 进行 100 场真实种子对决模拟）。

---

## 4. 多 AI 协作与分支管理规约

- **Git Fork 仓库**：`https://github.com/GoodThinking/kose_seer`
  - 仅向个人 Fork 推送，严禁推往 upstream `BaiSugar`。
- **任务隔离**：
  - 多个 AI 或多个功能分支并行开发时，必须在 `work/` 下创建独立的 worktree，互不干扰工作区。
- **交接日志规范**：
  - 每次完成关键功能、Bug 修复或部署时，必须实时更新 `HANDOFF.md`。
  - 记录包括：当前发布版本号、涉及文件差异、测试证据、已知未决问题、用户最新指令与下一步计划。

---

## 5. 原版世界体验开发与交接

- **隔离开发工作区**：`/Users/wuyunfan/Code/saierhao/work/world-experience-complete-20261025`；发布整合工作区：`/Users/wuyunfan/Code/saierhao/work/world-experience-integration-20261029`。两者保留原有工作，不能用旧工作区覆盖其他会话的新代码。
- **玩家测试指南**：`/Users/wuyunfan/Code/saierhao/work/world-experience-integration-20261029/游戏体验测试指南.md`，包含通用地图流程、防寒服任务7、般若星481和反馈模板。
- **地图验收台账与证据**：`/Users/wuyunfan/Code/saierhao/outputs/world-experience-20261025/world-acceptance.json` 和同目录下的截图、日志、构建清单及发布回执。台账是该轮历史状态，未测或部分验证不能记为全图通过。
- **共享资源合并**：Core、星图、战斗DLL、宝典及服务端共享配置可能被其他会话更新。先核对最新个人 `fork/main` 与现网全部相关输入，以当前基线合并、重建，再按清单部署；不要直接复用旧 SWF 或旧配置覆盖新版本。
- **数据库和发布边界**：发布前核对权限、差异和备份；只改明确授权的目标，不直接更改玩家存档。若需要数据库迁移或其他额外数据变更，按当前授权及相应审批门禁另行处理。
- **用户当前协作偏好**：不再启动子代理；由主会话负责开发。用户接手长流程游戏测试，问题按测试指南反馈；必要的短验证使用后台静音，不启动前台游戏或改系统音量。
- **静音约束**：用户曾实际听到测试声音，不能只凭 `--mute-audio` 声称静音。隔离测试页需在 Ruffle `resume()` 前设置并读回 `volume = 0`；验证事实与是否测量PCM分别记录。
