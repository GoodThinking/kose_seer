'use strict';
/**
 * 战报里的首领提示 (boss-notice)
 * 以 deploy/baseline 的 PetFightDLL.swf 为输入，只替换两个类的 DoABC，其余标签逐字节保留：
 *   PetFightMsgManager 监听 64006（服务端 BattleManager.SendBossNotice 下发的 BOSS 招牌特性提示），追加到左下战报；
 *   PetFightController 在一回合双方出手都播完时调用 PetFightMsgManager.roundEnd()，提示排在本回合战报之后。
 * 输入必须是改动前的那一版（boss-signatures 第一批用的是 fb83f6e7…，产物 e42e9692…）：FFDec 的产物随输入变化，拿产物再编译得不到相同字节。
 * 用法：node scripts/build-boss-notice.cjs <输入 PetFightDLL.swf> <NieoCore.swf（只供编译解析类型）> <输出 PetFightDLL.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[4], 'usage: build-boss-notice.cjs <base PetFightDLL.swf> <NieoCore.swf> <out PetFightDLL.swf>');
const [basePath, corePath, outPath] = process.argv.slice(2, 5).map(p => path.resolve(p));
const classNames = ['com/robot/petFightModule/PetFightMsgManager', 'com/robot/petFightModule/control/PetFightController'];
const base = fs.readFileSync(basePath);
const {bytes, changed} = compileClasses(base, fs.readFileSync(corePath), Object.fromEntries(classNames.map(name => [name, fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/boss-notice/scripts', name + '.as'), 'utf8')])));
assert.deepEqual(changed.sort(), classNames.slice().sort(), 'Both battle log classes must change');
fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed}, null, 2));
