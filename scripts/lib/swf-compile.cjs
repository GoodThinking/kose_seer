'use strict';
/**
 * 用 FFDec 把 AS3 源码编译进现有 SWF，只换指定的 DoABC 标签，其余标签逐字节保留。
 * 模块 SWF 引用核心库里的类型（SocketConnection、ClientConfig 等）：编译时把 NieoCore.swf 的 DoABC 临时接在输入 SWF 的结束标签前供 FFDec 解析，
 * 编译后只取回目标标签，输出里不包含核心库的任何标签。
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const worktreeRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(worktreeRoot, '../..');
const javaBin = path.join(repoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(repoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');
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

/**
 * @param sources {类路径: 源码}，如 'com/robot/petFightModule/PetFightMsgManager'
 * @param tagNames 要取回的 DoABC 标签名；缺省为每个类一个同名标签。整个模块只有一个匿名 DoABC 时传 ['']
 * @returns {bytes, changed} changed 为实际变化的标签名
 */
function compileClasses(baseBytes, coreBytes, sources, tagNames = Object.keys(sources)) {
  const workDir = fs.mkdtempSync('/tmp/swf-compile-');
  const ffdecHome = '/tmp/ffdec-home', flashLibDir = path.join(ffdecHome, '.FFDec/flashlib');
  fs.mkdirSync(flashLibDir, {recursive: true});
  const playerglobal = path.join(flashLibDir, 'playerglobal32_0.swc');
  if (!fs.existsSync(playerglobal)) fs.copyFileSync(path.join(repoRoot, 'work/client-lab/tools/ffdec/flashlib/playerglobal32_0.swc'), playerglobal);
  for (const [className, source] of Object.entries(sources)) {
    const file = path.join(workDir, 'import/scripts', className + '.as');
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, source, 'utf8');
  }
  const movie = parseSwf(baseBytes), names = new Set(movie.tags.map(tag => tag.name).filter(Boolean));
  const end = movie.tags.findIndex(tag => tag.code === 0);
  const declarations = parseSwf(coreBytes).tags.filter(tag => tag.code === 82 && !names.has(tag.name));
  const inputs = [...movie.tags.slice(0, end), ...declarations, ...movie.tags.slice(end)];
  const inputSwf = path.join(workDir, 'input.swf'), outputSwf = path.join(workDir, 'output.swf');
  fs.writeFileSync(inputSwf, encodeSwf(movie, inputs.map(tag => tag.raw)));
  execFileSync(javaBin, ['-Duser.home=' + ffdecHome, '-Djava.awt.headless=true', '-Xmx2g', '-jar', ffdecJar, '-onerror', 'abort', '-importScript', inputSwf, outputSwf, path.join(workDir, 'import')], {stdio: ['ignore', 'ignore', 'inherit'], timeout: 300000});
  const compiled = parseSwf(fs.readFileSync(outputSwf));
  assert.equal(compiled.tags.length, inputs.length, 'Tag count changed during FFDec import');
  const targets = new Set(tagNames), changed = [];
  for (const name of targets) assert.equal(movie.tags.slice(0, end).filter(tag => tag.code === 82 && tag.name === name).length, 1, 'Expected one DoABC named ' + JSON.stringify(name));
  const bytes = encodeSwf(movie, movie.tags.map((tag, i) => {
    if (tag.code !== 82 || !targets.has(tag.name)) return tag.raw;
    assert.equal(compiled.tags[i].name, tag.name, 'DoABC tag order changed');
    if (!compiled.tags[i].raw.equals(tag.raw)) changed.push(tag.name);
    return compiled.tags[i].raw;
  }));
  fs.rmSync(workDir, {recursive: true, force: true});
  return {bytes, changed};
}

module.exports = {parseSwf, encodeSwf, compileClasses, sha, worktreeRoot};
