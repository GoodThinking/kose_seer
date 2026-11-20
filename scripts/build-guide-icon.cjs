'use strict';
/**
 * 游戏右上角任务图标栏挂入赛尔号经典问号图标（new_player_icon），点击新窗口打开 /guide/index.html。
 * 只重编 NieoCore.swf 中的 com/robot/core/manager/TaskIconManager 一个 DoABC。
 * 用法：node scripts/build-guide-icon.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { compileClasses, sha, worktreeRoot } = require('./lib/swf-compile.cjs');

assert.ok(process.argv[3], 'usage: build-guide-icon.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map((p) => path.resolve(p));
const base = fs.readFileSync(basePath);
const taskIconClass = 'com/robot/core/manager/TaskIconManager';
const hatchMgrClass = 'com/robot/core/manager/HatchTaskManager';
const taskIconSrc = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/map-story/scripts', taskIconClass + '.as'),
  'utf8'
);
const hatchMgrSrc = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/map-story/scripts', hatchMgrClass + '.as'),
  'utf8'
);
assert.ok(taskIconSrc.includes('new_player_icon') && taskIconSrc.includes('openSeerGuide'), 'TaskIconManager must register classic guide icon');
assert.ok(hatchMgrSrc.includes('param2.isComplete = true'), 'HatchTaskManager must mark newly fused beads complete');
const { bytes, changed } = compileClasses(base, base, {
  [taskIconClass]: taskIconSrc,
  [hatchMgrClass]: hatchMgrSrc,
});
const allowed = new Set([hatchMgrClass, taskIconClass]);
assert.ok(changed.length > 0 && changed.every((c) => allowed.has(c)), `Unexpected changed classes: ${changed.join(', ')}`);
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({ base: sha(base), out: sha(bytes), changed }, null, 2));
