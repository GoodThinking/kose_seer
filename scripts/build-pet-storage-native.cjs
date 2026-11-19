'use strict';
/**
 * 精灵仓库去掉自加的「背包快捷调队」侧栏，回到原版：背包未满直接放入，满 6 只时打开原版 PetSwitchPanel 换精灵。
 * PetStorage.as 回到 1e7dc76 的版本（保留名称/编号搜索与记住视图），只重编 PetStorage.swf 唯一的匿名 DoABC。
 * 输入：上一版基线的 PetStorage.swf（7fe3fc14…）与 NieoCore.swf（编译时提供类声明，不改动）。
 * 用法：node scripts/build-pet-storage-native.cjs <输入 PetStorage.swf> <NieoCore.swf> <输出 PetStorage.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[4], 'usage: build-pet-storage-native.cjs <base PetStorage.swf> <NieoCore.swf> <out PetStorage.swf>');
const [basePath, corePath, outPath] = process.argv.slice(2, 5).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/nono-experience/warehouse/scripts/com/robot/module/app/PetStorage.as'), 'utf8');
assert.ok(!source.includes('_quickPane'), 'PetStorage.as still contains the quick-swap pane');
const {bytes, changed} = compileClasses(base, fs.readFileSync(corePath), {'com/robot/module/app/PetStorage': source}, ['']);
assert.deepEqual(changed, [''], 'Expected the warehouse DoABC to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes)}, null, 2));
