# 部署基线

`deploy/baseline/` 是现网 `/opt/kose-seer/{app,client}` 的原样快照，是部署内容的唯一来源。

- 捕获：2026-11-18 18:19（`classic-polish-v5-20261118` 发布后），只读 tar。
- 范围：排除 `._*`、`app/node_modules`（按 `app/package-lock.json` 安装）、`app/data`（玩家存档）、`app/logs`、`client/assets`（2.5G 上游资源缓存）、`client/node_modules`、`client/resource-tree.json`。
- `MANIFEST.tsv`：`路径 sha256 权限 属主`。git 不保存 640/属主，安装时按此文件设置。
- source of truth 是 `app/dist` 与 `app/config`。`app/src` 只是参考：它编译不出现网 dist（36 个 TS 错误，914 个 js 中 168 个不同，114 个没有源码）。

## 每版流程

1. 在 `deploy/baseline/` 里直接改目标文件（新增 dist 文件要 `git add -f`，因为 `app/.gitignore` 忽略 `dist/`）。
2. 同一提交里更新 `MANIFEST.tsv` 中对应行。
3. 发布前在服务器跑 `deploy/verify-baseline.sh /opt/kose-seer <上一版 MANIFEST>`，确认现网等于上一版基线。
4. 发布后跑 `deploy/verify-baseline.sh /opt/kose-seer`，确认现网等于本版基线。

检查 git 能否重建：`git archive HEAD deploy/baseline | tar -x -C /tmp/x && deploy/verify-baseline.sh /tmp/x/deploy/baseline`。
