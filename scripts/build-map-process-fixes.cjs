'use strict';
/**
 * 两张地图的修复：只重编 NieoCore.swf 里下面两个 DoABC，其余标签逐字节保留。输入用上一版基线的 NieoCore.swf（02c841ad…）。
 * 1. MapProcess_318 朱雀空间（compat/client-patches/white-planet/）：德拉萨、卡修斯、迪符特三尊守护兽的形象在地图
 *    animatorLevel.small 里，旧补丁把它隐藏了，三个金圈是空的。
 * 2. MapProcess_494 麦兹星（compat/client-patches/map-story/）：init 给 OgreModel 设 isAutoTalk，核心库的 OgreModel
 *    没有这个属性，抛 #1056，init 中断，加载框一直不关。
 * 用法：node scripts/build-map-process-fixes.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

const SOURCES = {
  'com/robot/app/mapProcess/MapProcess_318': 'compat/client-patches/white-planet/MapProcess_318.as',
  'com/robot/app/mapProcess/MapProcess_494': 'compat/client-patches/map-story/scripts/com/robot/app/mapProcess/MapProcess_494.as'
};

assert.ok(process.argv[3], 'usage: build-map-process-fixes.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const sources = Object.fromEntries(Object.entries(SOURCES).map(([name, file]) => [name, fs.readFileSync(path.join(worktreeRoot, file), 'utf8')]));
const {bytes, changed} = compileClasses(base, base, sources);
assert.deepEqual([...changed].sort(), Object.keys(SOURCES).sort(), 'Expected only the listed classes to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed}, null, 2));
