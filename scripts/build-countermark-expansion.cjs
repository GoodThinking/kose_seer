'use strict';
/**
 * 精灵刻印扩充（刻印目录在服务端 countermarks.json）：面板刻印列表翻页（每页 6 枚）、新刻印按属性/档次绘制图标、
 * 技能页把当前精灵用得上的刻印排在前面并标「适用」、只能掉落获得的刻印显示获取途径。
 * 只重编 PetCountermarkBookPanel.swf 唯一的 DoABC（frame1），NieoCore.swf 只用于编译时提供类声明。
 * 用法：node scripts/build-countermark-expansion.cjs <输入 PetCountermarkBookPanel.swf> <NieoCore.swf> <输出 PetCountermarkBookPanel.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[4], 'usage: build-countermark-expansion.cjs <base panel.swf> <NieoCore.swf> <out panel.swf>');
const [basePath, corePath, outPath] = process.argv.slice(2, 5).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/countermark/PetCountermarkBookPanel.as'), 'utf8');
assert.ok(source.includes('PAGE_SIZE') && source.includes('function kindMarks'), 'Panel source must paginate marks');
const {bytes, changed} = compileClasses(base, fs.readFileSync(corePath), {'com/robot/module/book/PetCountermarkBookPanel': source}, ['frame1']);
assert.deepEqual(changed, ['frame1'], 'Expected the countermark DoABC to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes)}, null, 2));
