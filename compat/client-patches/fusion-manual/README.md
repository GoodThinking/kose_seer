# 原生融合手册

960×560 游戏窗口内的 920×520 ActionScript 面板。复用实验室“精灵融合手册”按钮：`MapProcess_5 → BookManager.show(BookId.BOOK_1) → PetAmalgamationBookPanel.swf`。交付只替换这个手册模块，不改 Core、地图、服务端融合逻辑或玩家数据。

## 内容

- 全部：33 条固定、12 条奇迹、最后 1 条未匹配配方融合。
- 固定配方按结果精灵显示；默认黄金布布。
- 奇迹融合使用现场 `PetFusionHandler.js` 原始权重，同结果 ID 合并后归一化；百分比四舍五入，极小概率保留至四位小数。
- 稀有粉珠：卡鲁、希格及全部来源，支持来源和配方双向跳转。
- 支持搜索、列表翻页、详情滚动、关闭和重新打开。详情视口包含空白处均可滚轮滚动；右侧支持拖动滑块、点击轨道及上下箭头。切换条目和关闭时结束拖动，避免留下舞台监听。
- 获得方式优先使用用户核实文案，再从现网 `map-ogres.json`、`pet-acquisition.json`、精灵 XML 与融合规则生成可证实的捕捉、进化、常驻兑换和材料掉落来源；每条新增内容写入 `acquisition-evidence.json`，未知来源不编造。
- 书册封面、书脊装订、层叠页边与金属护角；系别使用现有 `resource/ui.swf` 原生徽章，双系并列显示。类型名称依据当前 `NieoCore.swf` 的原生枚举，不能套用服务端另一套单系编号。
- 未匹配配方首屏并列展示卡门兔、辛克、伊达及各 1/3 概率。
- 使用游戏现有 SWF 精灵立绘、头像、精华与元神珠素材；每个资源使用独立 ApplicationDomain，静止首帧、等比居中，移除面板时释放加载器。
- 配方图片格下方用完整副宠名称标签换行；标题无英文装饰；没有获得方式时只保留标题。
- 查询面板不发送融合请求。材料槽提示来自现网逐槽消耗逻辑：只放对应精华 1 个，额外材料也会被消耗。

## 构建

需要 Node.js、Java 和项目现有 FFDec。基线目录必须包含：

```
client/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf
client/assets/dll/NieoCore.swf
app/dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js
app/config/data/xml/pets.xml
app/config/data/xml/items.xml
app/config/data/json/map-ogres.json
app/config/data/json/pet-acquisition.json
app/config/data/json/special-evolutions.json
```

```
node scripts/build-fusion-manual.cjs \
  --baseline /absolute/path/to/baseline \
  --out /absolute/path/to/build \
  --java /absolute/path/to/java \
  --ffdec /absolute/path/to/ffdec.jar
```

构建器校验 33 条固定配方的精灵与材料文案、12 条奇迹配方和稀有分支。输出 `catalogue.json`、输入/输出 SHA-256 的 `manifest.json` 和：

```
client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf
```

编译时使用 Core ABC 解析外部类，发布模块仅保留替换后的手册 ABC，其他原始 SWF 标签逐字节校验不变。`compiler/` 是编译上下文，不能部署。

## 验证与集成

游戏网页现有 Ruffle 配置 `deviceFontRenderer: 'canvas'` 用于中文设备字体显示。孤立预览也应使用该配置。

书册版构建和后台原生 Ruffle 交互证据位于 `outputs/kose-fusion-manual-20261019/book/qa/`；获得方式生成逻辑可用 `node scripts/test-fusion-manual-acquisition.cjs` 检查。预览额外加入本地启动和只读状态回调，生产模块不含这些测试入口；此验证不等同于登录游戏点击实验室入口验收。

部署前核对 manifest 的现场融合规则及原模块哈希，从合并后的个人仓库 main 构建并安装上述唯一 overlay 文件；发布后由用户重新进入实验室打开手册验收。
