'use strict';
/**
 * SPT 面板 (SptPanel.swf)：把 compat/client-patches/spt-all-bosses/SptPanel.as 编译进现有 SptPanel.swf。
 * 面板里所有类在同一个匿名 DoABC 中，只有这个标签变化，美术与其余标签逐字节保留。
 * BOSS 说明文字在 SptPanel.as 的 BOSSES 表里，由 build-boss-signatures.cjs 与 boss_abilities.json 的 hint 同步。
 * 输入用上一版基线的 SptPanel.swf：FFDec 的产物随输入变化，拿产物再编译得不到相同字节（第一批：d47fb90a… → 0ba8cbe3…）。
 * 用法：node scripts/build-spt-panel.cjs <输入 SptPanel.swf> <NieoCore.swf（只供编译解析类型）> <输出 SptPanel.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

assert.ok(process.argv[4], 'usage: build-spt-panel.cjs <base SptPanel.swf> <NieoCore.swf> <out SptPanel.swf>');
const [basePath, corePath, outPath] = process.argv.slice(2, 5).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/spt-all-bosses/SptPanel.as'), 'utf8');
const {bytes, changed} = compileClasses(base, fs.readFileSync(corePath), {'com/robot/module/app/SptPanel': source}, ['']);
fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed: changed.length > 0}, null, 2));
