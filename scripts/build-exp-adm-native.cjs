'use strict';
/**
 * NoNo「经验分配」回到原版经验分配器：NonoShortcut.onjn 打开原版 ExpAdmPanel 模块（PET_GET_EXP 2319 / PET_SET_EXP 2318，
 * 服务端已实现），不再打开自绘的 PetTrainingPanel。只重编 NieoCore.swf 里 NonoShortcut 一个 DoABC。
 * 输入用上一版基线的 NieoCore.swf（36f32a7b…）。
 * 用法：node scripts/build-exp-adm-native.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[3], 'usage: build-exp-adm-native.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const className = 'com/robot/core/ui/nono/NonoShortcut';
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/nono-experience/core/scripts/com/robot/core/ui/nono/NonoShortcut.as'), 'utf8');
assert.ok(source.includes('getAppModule("ExpAdmPanel")') && !source.includes('PetTrainingPanel.show'), 'NonoShortcut must open ExpAdmPanel');
const {bytes, changed} = compileClasses(base, base, {[className]: source});
assert.deepEqual(changed, [className], 'Expected only NonoShortcut to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed}, null, 2));
