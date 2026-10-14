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

## 任务88奖励显示

`task88-reward-display/` 只修改 TaskClass_88：根据成功2202返回的奖励列表显示数量与名称，仅将返回的赛尔豆加入本地金币缓存一次；积累经验与金豆保持原权威余额查询。保留播放动画3700ms、跳过引导、确认后进入map8及原任务完成状态。不改变服务端奖励配置。

在上面的任务96输出基础上单独导入本类。输入 NieoCore SHA256：`a89814ac8913c1c8d183337a9bc92bfa58d374a6ae3bb81ec9cadabba9b9dab1`；输出 SHA256：`83dcae629de198015454bc7bea13da919bbd8aff60ac77828098b1a379cbf1e3`。保留已部署NpcClass_6和其他1981标签。

```sh
java -jar ffdec.jar -importScript NieoCore.task96.swf NieoCore.task88.swf compat/client-patches/task88-reward-display
```

显示修复需以实际加载文件SHA绑定新手播放、跳过、最终转场和重登余额验证；构建或源码模型不能替代真实UI验收。
