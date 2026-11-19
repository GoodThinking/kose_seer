'use strict';
/**
 * 训练师之门入口面板的守卫说明 (TrainDoorEnterPanel.swf)：只更新面板类；面板最初的整套发布（XIN 美术、太空站入口）见 build-train-door-panel.cjs。
 *把 compat/client-patches/train-door/TrainDoorEnterPanel.as 编译进现有面板，
 * 只替换 com/robot/module/app/TrainDoorEnterPanel 一个 DoABC，美术与其余标签逐字节保留。
 * 守卫说明在源码的 HINTS 表里，由 build-boss-signatures.cjs 生成。
 * 输入用上一版基线的面板：FFDec 的产物随输入变化，拿产物再编译得不到相同字节（boss-signatures 第二批：bd75ffd6… 为输入）。
 * 用法：node scripts/build-train-door-hints.cjs <输入 TrainDoorEnterPanel.swf> <NieoCore.swf（只供编译解析类型）> <输出 TrainDoorEnterPanel.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[4], 'usage: build-train-door-hints.cjs <base TrainDoorEnterPanel.swf> <NieoCore.swf> <out TrainDoorEnterPanel.swf>');
const [basePath, corePath, outPath] = process.argv.slice(2, 5).map(p => path.resolve(p));
const className = 'com/robot/module/app/TrainDoorEnterPanel';
const base = fs.readFileSync(basePath);
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/train-door/TrainDoorEnterPanel.as'), 'utf8');
const {bytes, changed} = compileClasses(base, fs.readFileSync(corePath), {[className]: source});
assert.deepEqual(changed, [className], 'Only the panel class may change');
fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed}, null, 2));
