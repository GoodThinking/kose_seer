# 固定怀旧客户端兼容补丁

使用 JPEXS FFDec 26.3.0 的 importScript 将对应子目录中的修改类导入同一原始 SWF。先核对下面的输入哈希；只导入涉及的类，保留所有其他标签及资源。此目录保存修改后的 ActionScript 源码，SWF不纳入仓库。

- `task96-owned-nono/`：只修改 NpcClass_6。已有 NoNo、已接受任务96且完成阶段0时，补正常领取对应的阶段1；按原芯片、跟随及领奖流程继续。请求去重及销毁后的回调检查不跳过后续阶段。实际线上输入 NieoCore SHA256：`cccd595b6535981e4bb2c4aa03c8b53e6facf9bf103c188a14611be9b539dcb1`。本地原验证基线仅 TaskClass_88 不同；本次发布保留线上 TaskClass_88。输出 SHA256：`a89814ac8913c1c8d183337a9bc92bfa58d374a6ae3bb81ec9cadabba9b9dab1`。
- `medicine-recovery/`：只修改 AbstractPetItemCategory、RenewBloodItemCategory、RenewPPItemCategory。成功确认后扣一次本地库存；拒绝后读取权威库存再恢复操作，跨药品请求互斥。输入 PetFightDLL SHA256：`906b514cc3606d92d2fc2af9ae5606b670ed2b1f5834ba31cd3593c28883e9d1`；保留既有捕捉错误恢复类。输出 SHA256：`903085c19b9577c4af7c9a9be3044bcb2d95eb4a4bafec0c927ed75c12c91d91`。

示例（输入必须匹配上述固定哈希）：

```sh
java -jar ffdec.jar -importScript NieoCore.swf NieoCore.patched.swf compat/client-patches/task96-owned-nono
java -jar ffdec.jar -importScript PetFightDLL.swf PetFightDLL.patched.swf compat/client-patches/medicine-recovery
```

两个 SWF 分别导入，只编译各目录内列出的修改类。构建后重新导出目标类并比较方法体，核对只有目标 DoABC 改变、其他编码标签与帧头不变；正常领奖只发一次、刷新不重发，用药成功与拒绝均须验证。无网络回复时的库存读回仍依赖既有连接错误处理；不能用统一退款猜测是否消费。


`skill-list-dedup/` 只修改 PetSelectPanel.handler 的普通列表合并，按技能 ID 保留首次出现项，保留服务端新增技能、原有已装备排除及黑色精灵分支。修复同一候选列表重复为两份而产生的多余分页。输入 PetSelectPanel.swf SHA256：`a1eaa2fc8ff71f453642d33213dcfd8b0c5f70d230e9a05634799d89a29ca2e1`；输出：`626371d2a8cd3d00fbd110028c4c84c2f942115f84a2cf729aa3b9374422ea44`。使用 JPEXS `-importScript` 单独导入此目录，不替换 Core、战斗或其他 UI 模块。导出源码中的 SWF 元数据仅从导入源中移除，输出帧头和全部非目标编码标签保持逐字节一致。

验证：22 项合并模型与反导出检查通过，两次构建输出相同；后台合成客户端候选由 6 页恢复为 3 页，属性技能可选择、保存并重登回显。此修复不改变技能效果或学习资格。

## 限时十倍战斗奖励道具

`reward-boosts/` 保存背包类补丁和三张48px自绘SVG图标。只在`type=reward_boost`
的道具上增加点击使用；背包提供“战斗加成状态”服务器查询。购买入口沿用实验室道具商城，
三种卡各100赛尔豆，不更改旧商品。商城、道具和说明的嵌入XML各追加三条。

构建入口 `scripts/build-reward-boosts.cjs`，参数 `--core`、`--icon-template`、
`--out`、`--java`、`--ffdec` 均须显式提供。固定输入Core SHA256
`b468240b55fa29c71c6d7c8dec3479e0da4370353b4a4e762d9832838e11bfea`；
图标模板SHA256 `710cbe6e3d8cfb0af85b2ef771712c602d0cb60702261b34487a6342957934b4`。
产出Core SHA256 `680a80a3f03e1f1aa9c5e7dc8c20f34907222d9ca4c0b641bc9030018dab9dce`。
帧头和非目标标签保持，1928个非BagPanel类的resolved pcode逐文件一致。

道具ID399901/399902/399903分别为经验、学习力、赛尔豆卡。图标保留`item`链接，放到
`client/overlay/resource/item/petItem/icon/ID.swf`；Core仍替换assets/dll原位置，
不新增overlay/dll遮蔽。构建证明见生成目录`client-build-proof.json`，其中明确记录
本轮未运行自动测试和游戏UI；实际购买、使用、重登和到期表现由用户验收。
