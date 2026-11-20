'use strict';
/**
 * 精灵道具连续使用栏与筛选栏样式优化：只重编 NieoCore.swf 中 PetPropsPanel 一个 DoABC。
 * 从输入 NieoCore.swf 反编译提取现网 REROLL_TYPES 与 ITEM_META 常量原样注入，确保零逻辑回退。
 * 用法：node scripts/build-pet-props-polish.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { compileClasses, sha, worktreeRoot } = require('./lib/swf-compile.cjs');

assert.ok(process.argv[3], 'usage: build-pet-props-polish.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map((p) => path.resolve(p));
const saierhaoRoot = path.resolve(worktreeRoot, '../..');
const javaBin = path.join(saierhaoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(saierhaoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');

const tmpDir = `/tmp/pet-props-extract-${process.pid}`;
const ffdecHome = '/tmp/ffdec-home';
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(ffdecHome, { recursive: true });

execFileSync(
  javaBin,
  [
    `-Duser.home=${ffdecHome}`, '-Djava.awt.headless=true', '-Xmx2g', '-jar', ffdecJar,
    '-onerror', 'abort',
    '-selectclass', 'com.robot.app.petbag.petPropsBag.ui.PetPropsPanel',
    '-export', 'script', tmpDir, basePath,
  ],
  { stdio: 'pipe' }
);

const decompiled = fs.readFileSync(
  path.join(tmpDir, 'scripts/com/robot/app/petbag/petPropsBag/ui/PetPropsPanel.as'),
  'utf8'
);
fs.rmSync(tmpDir, { recursive: true, force: true });

function extractConst(src, name) {
  const re = new RegExp(`private\\s+static\\s+const\\s+${name}:Object\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = src.match(re);
  assert.ok(m, `Failed to extract ${name} from decompiled PetPropsPanel`);
  return m[1];
}

const rerollObj = extractConst(decompiled, 'REROLL_TYPES');
const itemMetaObj = extractConst(decompiled, 'ITEM_META');

const base = fs.readFileSync(basePath);
const className = 'com/robot/app/petbag/petPropsBag/ui/PetPropsPanel';
let source = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/continuous-pet-edit/scripts', className + '.as'),
  'utf8'
);
source = source.replace('private static const REROLL_TYPES:Object = {}; // @REROLL_TYPES@', `private static const REROLL_TYPES:Object = ${rerollObj};`);
source = source.replace('private static const ITEM_META:Object = {}; // @ITEM_META@', `private static const ITEM_META:Object = ${itemMetaObj};`);
assert.ok(!source.includes('@REROLL_TYPES@') && !source.includes('@ITEM_META@'), 'Placeholders must be replaced');

const { bytes, changed } = compileClasses(base, base, { [className]: source });
assert.deepEqual(changed, [className], 'Expected only PetPropsPanel to change');
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({ base: sha(base), out: sha(bytes), changed }, null, 2));
