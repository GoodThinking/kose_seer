'use strict';
/**
 * 核心库 NieoCore.swf 的两处修复，只换下面两个标签，其余标签逐字节保留。输入用上一版基线的 NieoCore.swf（a8057f67…）。
 * 1. DoABC com/robot/core/manager/UserInfoManager（compat/client-patches/more-userinfo/UserInfoManager.as）：
 *    登录时 SPT 图标与关卡模块同时请求自己的详细信息（GET_MORE_USERINFO 2052），第一个回包派发给两个监听，
 *    第二个监听从已读完的数据接着读，报 Error #2030。现在每个监听只认自己请求的米米号，并从头读。
 * 2. OgreXMLInfo 内嵌 XML 的 <boss> 段补地图站位：没有登记的地图，BOSS 落在默认点 (430+80×region, 300)；
 *    430 活力源泉的默认点是半空的石柱，人物走不到，点了不能开战。其余 SPT 地图的默认点都能走到，不补。
 * 用法：node scripts/build-core-fixes.cjs <输入 NieoCore.swf> <输出 NieoCore.swf>
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {parseSwf, encodeSwf, compileClasses, sha, worktreeRoot} = require('./lib/swf-compile.cjs');

const BOSS_POSITIONS = [{mapId: 430, region: 0, x: 620, y: 440}];

assert.ok(process.argv[3], 'usage: build-core-fixes.cjs <base NieoCore.swf> <out NieoCore.swf>');
const [basePath, outPath] = process.argv.slice(2, 4).map(p => path.resolve(p));
const base = fs.readFileSync(basePath);
const className = 'com/robot/core/manager/UserInfoManager';
const source = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/more-userinfo/UserInfoManager.as'), 'utf8');
const {bytes: compiled, changed} = compileClasses(base, base, {[className]: source});
assert.deepEqual(changed, [className], 'Expected only UserInfoManager to change');

// 内嵌 XML：SymbolClass 找到 OgreXMLInfo_xmlClass 的字符 ID，再改对应的 DefineBinaryData
const movie = parseSwf(compiled);
const symbolName = 'com.robot.core.config.xml.OgreXMLInfo_xmlClass';
let characterId = null;
for (const tag of movie.tags.filter(t => t.code === 76)) {
  let offset = 2;
  for (let i = tag.payload.readUInt16LE(0); i > 0; i--) {
    const id = tag.payload.readUInt16LE(offset), end = tag.payload.indexOf(0, offset + 2);
    if (tag.payload.subarray(offset + 2, end).toString('utf8') === symbolName) characterId = id;
    offset = end + 1;
  }
}
assert.ok(characterId !== null, 'OgreXMLInfo symbol not found');
const binaries = movie.tags.map((tag, i) => tag.code === 87 && tag.payload.readUInt16LE(0) === characterId ? i : -1).filter(i => i >= 0);
assert.equal(binaries.length, 1, 'Expected one OgreXMLInfo binary');
const binary = movie.tags[binaries[0]], text = binary.payload.subarray(6).toString('utf8');
assert.equal((text.match(/<\/boss>/g) || []).length, 1, 'Expected one <boss> section');
const bossSection = text.slice(text.indexOf('<boss'), text.indexOf('</boss>'));
for (const p of BOSS_POSITIONS) assert.ok(!new RegExp(`<item id="${p.mapId}"`).test(bossSection), `Map ${p.mapId} already has boss positions`);
const added = BOSS_POSITIONS.map(p => `\n    <item id="${p.mapId}"><region id="${p.region}" pList="${p.x},${p.y}"></region></item>\n  `).join('');
const nextText = text.replace('</boss>', added + '</boss>');
const payload = Buffer.concat([binary.payload.subarray(0, 6), Buffer.from(nextText, 'utf8')]);
const head = Buffer.alloc(6);
head.writeUInt16LE((87 << 6) | 63);
head.writeUInt32LE(payload.length, 2);
const bytes = encodeSwf(movie, movie.tags.map((tag, i) => i === binaries[0] ? Buffer.concat([head, payload]) : tag.raw));
fs.writeFileSync(outPath, bytes);
console.log(JSON.stringify({base: sha(base), out: sha(bytes), changed: [...changed, symbolName]}, null, 2));
