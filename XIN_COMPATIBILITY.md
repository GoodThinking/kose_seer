# XIN 兼容服务端：战斗、登录与宠物协议

目标是在 KOSE 上逐步实现个人可用、可调整数值和活动的版本。已完成两阶段的局部协议适配和本地验证；尚不能将这一分支当作完整 XIN 服务端部署。

## 基线与配置

- KOSE 基线 `fda0e32bf16fa73e3cadf0dac94a022a617aa211`，独立 worktree，分支 `codex/xin-protocol-compat`，没有 upstream。
- 原 `kose-validation` 中的 `PlayerConverter.ts` 修改与 `.runtime/` 保留。未集成原部署的兼容修复；发布前必须检查。
- 本轮没有提交、推送、发布、修改公网配置或连接 XIN 游戏后台。
- 使用已有 REA 调查资料和公开客户端本地副本进行 FFDec 定向反编译；没有服务端源码。

`services.game.clientProtocol` 选择报文体格式：缺省或 `kose` 保持旧路径；`xin-20261013` 使用本次固定样本的格式；非法值在配置加载时报错。包头版本 `1`/`2` 不变。

第一阶段未发布的实验字段 `battleProtocol` 已统一改名为 `clientProtocol`，因为现在同时控制登录、宠物和战斗。请使用新字段；未提供旧字段别名。实际 `server.json` 未修改，示例配置默认为 `kose`。这一选项不会自动配置资源、登录入口或新增玩法。

## 已适配的路径

| 路径 | XIN 模式的变化 |
| --- | --- |
| `1001` 游戏登录响应 | 增加 200 字节记录区和三个关卡字段；按新格式嵌入完整宠物；服装之后写 XIN 的七个尾部字段，避免把 KOSE Boss 成就数组当作其他字段 |
| `2001` / `2003` 地图人物 | XIN 从 userID 开始，省略旧时间戳；增加宠物扩展字段；战队徽标改为四个 Int16；列表每条记录写完整两个尾部字段 |
| `2301` 宠物详情 | 增加特殊属性、七个附加能力值、效果标记、异色及扩展区；单只无效果宠物从 154 字节变为 230 字节 |
| `2303` 宠物列表 | 每只写 20 字节摘要：ID、捕获时间、等级、皮肤、异色；实际请求入口回复 `2303`，保留首发优先排序 |
| `2304` 存仓/取出 | 取出时嵌入新版完整宠物；存仓响应仍是 12 字节，保持原有保存逻辑 |
| `2503` 准备战斗 | 双方昵称后补 32 字节签名；简化宠物补齐 XIN 字段，保持多宠物及第二方边界 |
| `2505` 技能结果 | 50 个有符号状态字节；移除每条攻击末尾的 KOSE 专用三字段；支持 v1 场地效果和护盾快照的编码 |
| 发包链路 | `Player.SendPacket` 和登录前发送路径传递当前格式；缓存型宠物/战斗包在构造时选择格式，保留快照语义 |

`2303` 有两处独立问题：KOSE 的实际 `HandleGetPetList` 原先调用 `PacketPetRoomList`，回复 `2324` 和 12 字节摘要；另一条 `PacketGetPetList` 路径则发送完整宠物。XIN 的监听器等待 `2303` 并按 20 字节摘要读取。两条路径均已在 XIN 模式适配，旧模式保留原行为。`2324`、`2309` 的独立客户端流程仍需后续核查。

## 数据来源与明确缺口

- 完整宠物的基础属性、技能、捕获信息来自 KOSE `IPetInfo` 和现有配置；XIN 皮肤和异色分别取持久化的 `skinId`、`shiny`。这次没有迁移数据库结构。
- 特性参数来自 `effectList.args`：XIN 每个效果为 24 字节，包含八个小端 UInt16 参数，已覆盖大于 255 的值及后六个参数。旧格式仍使用原先的两个字节参数布局。
- 现有宠物转换器仍按技能配置发送满 PP；这次没有实现持久化当前 PP。
- XIN 特殊属性、附加能力、技能质子、刻印、装饰、部分关卡和记录区尚无已验证的 KOSE 数据映射，发送未设置值。不会把 KOSE `commonMark` 仅凭名称映射到 XIN 刻印。
- XIN 成就称号没有与 KOSE `curTitle` 完成 ID 对照；登录尾部称号等字段暂为 0。`serverID` 支持编码，但实际登录路径尚未绑定可靠来源，默认 0；不能据此宣称服务器选择和登录会话已兼容。
- 原登录转换器的新手进度映射仍需与旧部署的修复集成。本阶段验证的是字节结构，未验证全部玩家字段的游戏语义。
- 玩家战斗前简化宠物已从持久化 skinId/shiny 透传皮肤与异色；野怪扩展及其他未确认字段仍未映射。
- 前 19 种战斗状态已核对编号和含义；额外状态未增加结算逻辑。场地效果和四时点护盾编码器可写值，但当前战斗引擎发送空列表。

## 可复现验证

在本 worktree 安装匹配依赖后：

```sh
npm run build
npm test -- --runInBand --runTestsByPath src/shared/proto/__tests__/XinBattleProtocol.test.ts src/shared/proto/__tests__/XinLoginPetProtocol.test.ts src/shared/proto/__tests__/XinMapProtocol.test.ts
python3 ../xin-site-research/validate-kose-generated.py
```

阶段 1–2 结果：构建通过，25 项测试通过，独立 Python 战斗解码的 2 类完整包通过，实际配置加载器的缺省/XIN/非法值 3 项检查通过。

新增测试按客户端的读取顺序独立解析登录和宠物，不复用服务端写入工具，覆盖：

- 多只宠物、空列表、效果参数大小端、服装与登录尾部边界、截断报文；
- 原版登录、完整宠物、列表、取出响应的修改前逐字节基线；
- 实际 `PetManager.HandleGetPetList` 命令号、排序及皮肤/异色来源；
- 实际 `Player.SendPacket` 配置透传与完整包头。

另外执行了 `../xin-site-research/validate-kose-pet-storage.cjs`，使用已有 Node 22.23.3 和匹配的 SQLite 原生依赖。脚本仅创建临时目录及 SQLite 文件，加载 KOSE 的宠物表定义、DataSaver/DataLoader/PetManager 和实际发包方法：存仓 → 取出 → 100ms 防抖自动保存 → 清缓存 → 断开并重新连接数据库 → 读回宠物并再次发包。8 项检查通过；读回后的宠物详情逐字节相同。临时数据库已清理，未使用真实玩家数据，未启动网络监听。

这验证的是持久化和管理器调用链，**不是账号认证、真实客户端重登或游戏 UI 验证**。

证据及日志位于 `../xin-site-research/evidence/`：

- `kose-phase2-validation.json`：结果与客户端/反编译文件 SHA256；
- `kose-phase2-tests.log`、`kose-phase2-build.log`；
- `kose-phase2-storage-validation.json`、`kose-phase2-storage.log`：8 项检查和 6 个合成玩家完整响应；
- `kose-independent-validation.json`：独立战斗解析与配置检查。

本轮源头为 `core.swf` 中的 `UserInfo.setForLoginInfo`、`PetInfo`、`PetEffectInfo`、`PetListInfo`、`PetTakeOutInfo`、`PetManager`。不能用较旧 `Login.swf` 的同名类代替游戏核心的读取格式。仓库仅加入实现、合成测试数据和文档，没有纳入第三方 SWF 或整套反编译代码。

## 阶段 3：地图响应（2026-10-13）

新增 7 项地图测试，连同前两阶段共 32 项通过；TypeScript 构建通过。

- 来源：固定 `core.swf` 的 `UserInfo.setForPeoleInfo` / `canReadPeoleInfoList`，以及 `MapController.onEnterMap`、`UserListCmdListener.onUserList`。进一步核对 `SocketImpl`、`TMF`、`TmfByteArray`：这些地图消息直接读取消息体，没有先消耗时间戳。
- `2001` 初始登录推送、主动进图响应与进图广播均已传递当前协议；`2003` 的原始 Proto 通过 `Player.SendPacket` 选择协议。缓存包继续在构造时保留快照。协议配置目前是进程级，不支持同一部署混合两种客户端。
- 皮肤/异色来自首发宠物 `skinId` / `shiny`；位置和服装来自现有玩家数据。成就称号、坐骑、装饰、特殊属性、金色昵称和 NoNo 变形暂为 0，未凭名称套用旧 ID。
- 战队四个徽标字段按客户端 signed Int16 写入；现有默认值是 0。超出 -32768..32767 的旧数据会明确报错，尚未验证存量非默认战队数据，不默默截断。
- 回归覆盖修改前的 KOSE 完整字节、空/多人列表、服装数量不同的记录边界、有符号字段边界、缓存快照、`MapManager.buildUserInfo` 数据来源和实际 `Player.SendPacket` 包头。
- 证据：`../xin-site-research/evidence/kose-phase3-tests.log`、`kose-phase3-build.log`、`kose-phase3-validation.json`。

网页观察与本地协议验证需分别看待：使用用户授权账号的普通网站登录曾跳转到游戏页，游戏界面曾显示选服列表；没有取得可确认的地图/背包业务证据。REA 第二次游戏场景采集返回 `cleanup_incomplete`，只能使用其部分观察，不能算完整成功。用户反馈已进地图后，最后可访问的内嵌浏览器标签是 `/game` 的 Nginx 404；不能据此判断用户先前未进图，也不能据此确定断线原因。未把账号、密码、会话值写入仓库或研究报告。

以上是本地编码器验证，尚未证明 XIN 客户端能连接 KOSE 完成游戏流程。没有部署、修改公网服务或获取 XIN 服务端源码。

## 下一阶段验收

1. 隔离网页/客户端的 HTTP、WebSocket 和数据入口，确保测试仅使用自建服务。
2. 核对主登录、服务器列表、游戏会话、进入地图及完整玩家信息，集成原部署的新手进度修复。
3. 真实客户端验证登录 → 背包 → 进入地图 → 野怪战斗 → 捕捉 → 保存 → 退出重登。
4. 按需要逐项增加 Boss、融合、活动和效果结算，公开资源表不代表玩法已实现。
5. 完成隔离环境业务验收后，再评估公网切换与现有数据集成。

## 三系统首批集成（2026-10-13）

已审查并集成三个 Astra 会话的 14 个源码增量和 3 个专用测试，主目录统一构建通过，6 套件 46 项通过。首次从外层目录运行导致配置相对路径缺失，保留该失败日志；在仓库根目录执行规定命令后全部通过，不是通过修改断言规避失败。

新增任务 100 字节缓存及错误码透传、宠物取出响应前显式保存、玩家战斗皮肤/异色透传。任务与宠物的正常 SQLite 重载路径已测；数据库故障、并发领奖、捕捉和新客户端端到端尚未验收。证据位于 ../xin-site-research/evidence/kose-integrated-{tests,build}.log；范围与下一阶段见 ../kose-xin-parallel/PROJECT_STATUS.md。公网仍为原部署。

## KOSE fixed Nieo: inventory and room display

The fixed Nieo client consumes command 2303 as the complete inventory (12-byte
id/catchTime/skinID summaries), and command 2324 as the named room owner's
exhibition. The 2324 request contains that owner's UID, not a storage type.
Storage ownership alone does not mean a pet is exhibited. Optional `isRoomShow`
flags in the existing pet JSON persist the explicit exhibition, with absent old
flags meaning hidden. A stored pet taken into the bag is removed from exhibition.
Command 2323 saves the owner's selection: count plus catchTime/petId pairs, at
most five entries. Identity, duplicates, bag ownership and exact length are
validated before one staged save; failed saves do not publish candidate flags.
The XIN room-list branch keeps its prior behavior.

For the fixed `ExpAdmPanel.swf`, `scripts/patch-exp-panel.cjs` verifies input
SHA256 `dc33f997cf21acb7adf337d5b97de8f5d6e46aa09c67a3a801bc2ae98f49af8e` and
changes only DefineEditText character 24 fontHeight from 280 to 240 twips.
The ten-digit business balance `2147483647` then fits its existing box. Output
SHA256 is `3a0b5fa8a2f0e53b42a1396276304f36534e8c2a850c6974d6bc851c54424512`;
ABC scripts, geometry and all other uncompressed bytes are unchanged. Generated
SWFs and account credentials are release artifacts, not repository source.
