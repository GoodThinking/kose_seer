# KOSE Server - 某童年游戏的怀旧服服务端TS实现版

> 基于 TypeScript 的某童年游戏的怀旧服服务端赛尔号私服服务端，采用统一架构，所有功能集成在 GameServer 中

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

采集规则改为按地图与类型共同匹配，保留原有矿点参数与限额记录。希欧珊瑚物品ID为400026，每日可采5次；普通NoNo每次1块、超能NoNo每次2块，两种类型共享当天次数。入场只查询次数，不要求NoNo已跟随；真正采集时要求NoNo跟随，超能产量要求超能NoNo。物品和次数仍在同一事务保存。

```bash
node scripts/build-ocean-entry.cjs \
  --server-source /path/to/current/server/source \
  --runtime /path/to/deployed/Mining.js \
  --config /path/to/deployed/mining.json \
  --out /path/to/release
```

构建器要求现网运行文件、配置及对应源码匹配已确认基线，使用现有服务端的TypeScript编译器与类型定义检查补丁。发布四个文件：采集模块JS、source map、对应TS源码及采集配置；不从较早的仓库快照覆盖其他服务器代码。先合并并推送个人仓库main，再构建发布；不备份，不迁移数据库，不手工修改账号，游戏服务需要重启一次。

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

`node scripts/smoke-coin-products.cjs /path/to/staged/app` 使用临时 SQLite 验证 168 次普通/VIP 目录购买、普通购买入口、余额不足、并发防重、保存失败回滚及已移除套装拒购。该路径必须是带既有依赖的发布副本；脚本不连接游戏账号数据库。


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
