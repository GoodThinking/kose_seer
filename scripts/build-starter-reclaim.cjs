'use strict';
/**
 * 只重编 NieoCore.swf 里下面三个 DoABC，其余标签逐字节保留。输入用上一版基线的 NieoCore.swf（2bf56a5b…）。
 * 1. MapProcess_5 实验室「精灵收集奖励」入口加初始精灵补领：身边已经没有某一族初始精灵时，博士询问是否补领 1 级初始精灵
 *    （收集奖励第 5 组，服务端 PetCollectHandler 按族记录，每族一次）。
 * 2. OgreModel：classic-cleanup 从 11-02 核心库取的 OgreModel 丢了 isAutoTalk / isPurseFlag，MapProcess_494、Task628、
 *    Task641 给它赋值会抛 #1056。以当前核心库的 OgreModel 为准补回这两个成员（compat/client-patches/map-story/）。
 * 3. MapProcess_494 麦兹星：OgreModel 有了 isAutoTalk，恢复原版的 isAutoTalk = false。
 * 用法：node scripts/build-starter-reclaim.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

const SOURCES = {
  'com/robot/app/mapProcess/MapProcess_5': 'compat/client-patches/acquisition-restoration/MapProcess_5.as',
  'com/robot/core/mode/OgreModel': 'compat/client-patches/map-story/scripts/com/robot/core/mode/OgreModel.as',
  'com/robot/app/mapProcess/MapProcess_494': 'compat/client-patches/map-story/scripts/com/robot/app/mapProcess/MapProcess_494.as'
};

assert.ok(process.argv[3], 'usage: build-starter-reclaim.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const sources = Object.fromEntries(Object.entries(SOURCES).map(([name, file]) => [name, fs.readFileSync(path.join(worktreeRoot, file), 'utf8')]));
assert.ok(sources['com/robot/app/mapProcess/MapProcess_5'].includes('CommandID.IS_COLLECT,5)'), 'MapProcess_5 must query starter re-claim');
assert.ok(/set isPurseFlag[\s\S]*isAutoTalk && /.test(sources['com/robot/core/mode/OgreModel']), 'OgreModel must define isPurseFlag and isAutoTalk');
const {bytes, changed} = compileClasses(base, base, sources);
assert.deepEqual([...changed].sort(), Object.keys(SOURCES).sort(), 'Expected only the listed classes to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed}, null, 2));
