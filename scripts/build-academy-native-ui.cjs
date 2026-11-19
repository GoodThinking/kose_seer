'use strict';
/**
 * 精灵学院原版化 (academy-native-ui-20261119)
 * 以 deploy/baseline 的 NieoCore.swf 为输入，只替换 5 个类的 DoABC，其余标签逐字节保留：
 *   TrainGradePanel（原版 trainGrade.swf 选房 + 基于原版 Train_UI 的经验训练室）、TrainControl（去掉文字 HUD，回房自动补满）、
 *   MapProcess_485（去掉文字铭牌，用场景原有物件做入口）、MapProcess_102（入口名牌只写「精灵学院」）、NonoShortcut（NoNo 直接传送学院）。
 * 另把地图说明 485 的 des 恢复为原版「精灵学院」。
 * 用法：node scripts/build-academy-native-ui.cjs <输入 NieoCore.swf（上一版基线 35000e5c…）> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const worktreeRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(worktreeRoot, '../..');
const javaBin = path.join(repoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(repoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');
assert.ok(process.argv[3], 'usage: build-academy-native-ui.cjs <base NieoCore.swf> <out NieoCore.swf>');
const basePath = path.resolve(process.argv[2]);
const outPath = path.resolve(process.argv[3]);

const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

function parseSwf(raw) {
  const sig = raw.subarray(0, 3).toString();
  assert.ok(['CWS', 'FWS'].includes(sig), 'Expected SWF');
  const body = sig === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + size); offset += size;
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString('utf8') : null;
    tags.push({code, payload, name, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  assert.equal(offset, body.length, 'Truncated SWF stream');
  return {raw, sig, header, tags};
}

function encodeSwf(source, rawTags) {
  const body = Buffer.concat([source.header, ...rawTags]);
  const head = Buffer.from(source.raw.subarray(0, 8));
  head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, source.sig === 'CWS' ? zlib.deflateSync(body, {level: 9}) : body]);
}

function longTag(code, payload) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE((code << 6) | 63);
  head.writeUInt32LE(payload.length, 2);
  return Buffer.concat([head, payload]);
}

function symbolId(swf, symName) {
  for (const tag of swf.tags.filter(t => t.code === 76)) {
    let offset = 2;
    const count = tag.payload.readUInt16LE(0);
    for (let i = 0; i < count; i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString('utf8') === symName) return id;
      offset = end + 1;
    }
  }
  throw new Error('Missing symbol: ' + symName);
}

function replaceBinaryXml(swf, symName, transformFn) {
  const id = symbolId(swf, symName);
  const idx = swf.tags.findIndex(t => t.code === 87 && t.payload.readUInt16LE(0) === id);
  assert.ok(idx >= 0, 'Missing binary tag for ' + symName);
  const oldTag = swf.tags[idx];
  const oldXml = oldTag.payload.subarray(6).toString('utf8');
  const nextXml = transformFn(oldXml);
  const newPayload = Buffer.concat([oldTag.payload.subarray(0, 6), Buffer.from(nextXml, 'utf8')]);
  const raw = longTag(87, newPayload);
  swf.tags[idx] = {code: 87, payload: newPayload, name: null, raw};
}

function compileScriptsIntoSwf(baseSwfBytes, scriptMap, workSubdir) {
  const workDir = path.join('/tmp/academy-native-ui-swf', workSubdir);
  fs.rmSync(workDir, {recursive: true, force: true});
  const importDir = path.join(workDir, 'import');
  const ffdecHome = '/tmp/ffdec-home';
  const flashLibDir = path.join(ffdecHome, '.FFDec/flashlib');
  fs.mkdirSync(flashLibDir, {recursive: true});
  const playerglobalSrc = path.join(repoRoot, 'work/client-lab/tools/ffdec/flashlib/playerglobal32_0.swc');
  const playerglobalDst = path.join(flashLibDir, 'playerglobal32_0.swc');
  if (!fs.existsSync(playerglobalDst)) {
    fs.copyFileSync(playerglobalSrc, playerglobalDst);
  }
  for (const [relClassPath, sourceContent] of Object.entries(scriptMap)) {
    const file = path.join(importDir, 'scripts', relClassPath + '.as');
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, sourceContent, 'utf8');
  }
  const inputSwf = path.join(workDir, 'input.swf');
  const outputSwf = path.join(workDir, 'output.swf');
  fs.writeFileSync(inputSwf, baseSwfBytes);
  execFileSync(
    javaBin,
    ['-Duser.home=' + ffdecHome, '-Djava.awt.headless=true', '-Xmx2g', '-jar', ffdecJar, '-onerror', 'abort', '-importScript', inputSwf, outputSwf, importDir],
    {stdio: 'inherit', timeout: 300000}
  );
  const orig = parseSwf(baseSwfBytes);
  const comp = parseSwf(fs.readFileSync(outputSwf));
  assert.equal(comp.tags.length, orig.tags.length, 'Tag count changed during FFDec import');
  const allowed = new Set(Object.keys(scriptMap));
  let replaced = 0;
  orig.tags = orig.tags.map((oldTag, idx) => {
    if (oldTag.code !== 82) return oldTag;
    const newTag = comp.tags[idx];
    if (allowed.has(oldTag.name)) {
      assert.equal(oldTag.name, newTag.name, 'DoABC tag name mismatch');
      replaced++;
      return newTag;
    }
    return oldTag;
  });
  assert.equal(replaced, allowed.size, `Expected ${allowed.size} replaced DoABC tags, got ${replaced}`);
  return encodeSwf(orig, orig.tags.map(t => t.raw));
}

const patch = rel => fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches', rel), 'utf8');
const scriptMap = {
  'com/robot/app/task/petstory/app/train/TrainGradePanel': patch('academy-train/TrainGradePanel.as'),
  'com/robot/app/task/petstory/app/train/TrainControl': patch('academy-train/TrainControl.as'),
  'com/robot/app/mapProcess/MapProcess_485': patch('academy-train/MapProcess_485.as'),
  'com/robot/app/mapProcess/MapProcess_102': patch('train-door/MapProcess_102.as'),
  'com/robot/core/ui/nono/NonoShortcut': patch('nono-experience/core/scripts/com/robot/core/ui/nono/NonoShortcut.as'),
};

const base = fs.readFileSync(basePath);
console.log('base', basePath, sha(base));
const swf = parseSwf(compileScriptsIntoSwf(base, scriptMap, 'nieocore'));
replaceBinaryXml(swf, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', xml => {
  const from = '<map id="485" des="刷学习力与经验特训">';
  assert.ok(xml.includes(from), 'Expected map 485 intro');
  return xml.replace(from, '<map id="485" des="精灵学院">');
});
const out = encodeSwf(swf, swf.tags.map(t => t.raw));
fs.writeFileSync(outPath, out);
console.log('out', outPath, sha(out), out.length);
