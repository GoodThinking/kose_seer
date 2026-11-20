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
const className = 'com/robot/core/manager/TaskIconManager';
const source = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/map-story/scripts', className + '.as'),
  'utf8'
);
assert.ok(source.includes('new_player_icon') && source.includes('openSeerGuide'), 'TaskIconManager must register classic guide icon');
const { bytes, changed } = compileClasses(base, base, { [className]: source });
assert.deepEqual(changed, [className], 'Expected only TaskIconManager to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({ base: sha(base), out: sha(bytes), changed }, null, 2));
