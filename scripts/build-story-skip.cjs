'use strict';
/**
 * 为全局全屏/场景剧情动画（AnimateManager）与 NPC 对话框（NpcDialog）加入一键跳过按钮与键盘快捷键。
 * 只重编 NieoCore.swf 中的 AnimateManager 与 NpcDialog 两个 DoABC。
 * 用法：node scripts/build-story-skip.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { compileClasses, sha, worktreeRoot } = require('./lib/swf-compile.cjs');

assert.ok(process.argv[3], 'usage: build-story-skip.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map((p) => path.resolve(p));
const base = fs.readFileSync(basePath);
const animClass = 'com/robot/core/animate/AnimateManager';
const dialogClass = 'com/robot/core/npc/NpcDialog';
const animSrc = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/map-story/scripts', animClass + '.as'),
  'utf8'
);
const dialogSrc = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/map-story/scripts', dialogClass + '.as'),
  'utf8'
);
assert.ok(animSrc.includes('createSkipButton'), 'AnimateManager must include skip button');
assert.ok(dialogSrc.includes('onSkipClickHandler'), 'NpcDialog must include skip handler');
const { bytes, changed } = compileClasses(base, base, {
  [animClass]: animSrc,
  [dialogClass]: dialogSrc,
});
assert.deepEqual(changed.sort(), [animClass, dialogClass].sort(), `Unexpected changed classes: ${changed.join(', ')}`);
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({ base: sha(base), out: sha(bytes), changed }, null, 2));
