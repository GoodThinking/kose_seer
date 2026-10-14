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

## 塞西利亚星地图40初始化

`map40-init/`只修改MapProcess_40.init：地图缺少旧活动/任务122专用控件时跳过相应表现初始化，保留基础阿克希亚、任务8和地图出口。输入核心SHA256 `a89814ac8913c1c8d183337a9bc92bfa58d374a6ae3bb81ec9cadabba9b9dab1`，输出 `b468240b55fa29c71c6d7c8dec3479e0da4370353b4a4e762d9832838e11bfea`；实际地图40SHA256 `6ebafb1b3e4d02d7bbe10915beeb639eaf5129e8a6c9007bf840c53727d773aa`。

```sh
java -jar ffdec.jar -onerror abort -importScript NieoCore.task96.swf NieoCore.map40.swf compat/client-patches/map40-init
```

仅目标DoABC变化，其余1981标签、任务96及既有Task88保持；不强关加载遮罩或吞掉必需控件错误。任务122旧活动控件缺失时不声称其玩法可用。地图导航/重登入图/出口/基础BOSS交互需实际UI验收。
