'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {spawnSync} = require('node:child_process');
const {parseStringPromise} = require('xml2js');
const repo = path.resolve(__dirname, '..');
const options = {};
for (let i = 2; i < process.argv.length; i += 2) options[process.argv[i]] = process.argv[i + 1];
for (const key of ['--core', '--icon-template', '--out', '--java', '--ffdec']) {
  if (!options[key]) throw new Error('Missing ' + key);
}
const core = path.resolve(options['--core']);
const iconTemplate = path.resolve(options['--icon-template']);
const out = path.resolve(options['--out']);
const patch = path.join(repo, 'compat/client-patches/reward-boosts');
fs.mkdirSync(out, {recursive: true});
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const log = path.join(out, 'ffdec-build.log');
function ffdec(...args) {
  const result = spawnSync(options['--java'], ['-jar', options['--ffdec'], ...args],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000});
  fs.appendFileSync(log, JSON.stringify(args) + '\n' + result.stdout + result.stderr + '\n');
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('FFDec failed; see ' + log);
}
function tags(file) {
  const bytes = fs.readFileSync(file);
  const body = bytes.subarray(0, 3).toString() === 'CWS' ? zlib.inflateSync(bytes.subarray(8)) : bytes.subarray(8);
  if (body.length + 8 !== bytes.readUInt32LE(4)) throw new Error('Invalid SWF length');
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4;
  const movie = body.subarray(0, offset);
  const records = [];
  while (offset < body.length) {
    const start = offset, header = body.readUInt16LE(offset);
    offset += 2;
    let size = header & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const data = body.subarray(offset, offset + size);
    offset += size;
    records.push({type: header >> 6, bytes: body.subarray(start, offset), id: data.length >= 2 ? data.readUInt16LE(0) : -1});
  }
  return {movie, records, version: bytes[3]};
}
function inventory(directory) {
  const files = {};
  function visit(current) {
    for (const name of fs.readdirSync(current).sort()) {
      const file = path.join(current, name);
      if (fs.statSync(file).isDirectory()) visit(file);
      else files[path.relative(directory, file).split(path.sep).join('/')] = digest(fs.readFileSync(file));
    }
  }
  visit(directory);
  return files;
}
async function main() {
  if (digest(fs.readFileSync(core)) !== 'b468240b55fa29c71c6d7c8dec3479e0da4370353b4a4e762d9832838e11bfea') throw new Error('Core baseline mismatch');
  if (digest(fs.readFileSync(iconTemplate)) !== '710cbe6e3d8cfb0af85b2ef771712c602d0cb60702261b34487a6342957934b4') throw new Error('Icon linkage template mismatch');
  const itemSource = fs.readFileSync(path.join(repo, 'config/data/xml/items.xml'), 'utf8');
  const itemConfig = await parseStringPromise(itemSource);
  const configured = itemConfig.Items.Cat.flatMap(cat => cat.Item || []).filter(item => item.$.type === 'reward_boost');
  const ids = configured.map(item => Number(item.$.ID)).sort((a, b) => a - b);
  if (JSON.stringify(ids) !== '[399901,399902,399903]') throw new Error('Unexpected reward boost item scope');
  const descriptions = {
    experience: '使用后1小时内，战斗胜利时出战精灵和储存经验各获得基础经验的5倍。',
    learning: '使用后1小时内，战斗胜利获得的学习力为基础产出的5倍，仍遵守单项255、总计510上限。',
    coins: '使用后1小时内，战斗胜利获得的赛尔豆为基础奖励的5倍。'
  };
  const dataDir = path.join(out, 'baseline-data');
  ffdec('-selectid', '1,29,31', '-export', 'binaryData', dataDir, core);
  const resources = {};
  for (const id of [1, 29, 31]) {
    const matches = fs.readdirSync(dataDir).filter(name => name.startsWith(id + '_') && name.endsWith('.bin'));
    if (matches.length !== 1) throw new Error('Ambiguous embedded XML: ' + id);
    resources[id] = fs.readFileSync(path.join(dataDir, matches[0]), 'utf8');
  }
  const customLines = itemSource.split('\n').filter(line => line.includes('type="reward_boost"'));
  if (customLines.length !== 3 || resources[31].includes('type="reward_boost"')) throw new Error('Item XML baseline changed');
  const catOpen = resources[31].match(/<Cat\b[^>]*\bID="3"[^>]*>/g);
  if (!catOpen || catOpen.length !== 1) throw new Error('Pet item category missing');
  const embeddedItems = resources[31].replace(catOpen[0], catOpen[0] + '\n' + customLines.join('\n'));
  const shopLines = configured.map(({ $: item }) =>
    `\t<item itemID="${item.ID}" name="${item.Name}" productID="" price="${item.Price}" vip="1" moneyType="0"/>`);
  const tipLines = configured.map(({ $: item }) => {
    if (!descriptions[item.RewardBoostKind]) throw new Error('Unknown boost kind');
    return `\t<item id="${item.ID}" level="3" color="#ffd36e" des="${descriptions[item.RewardBoostKind]}离线照常计时；同类只延长1小时，倍率不叠加。点击背包内此卡使用；可在主界面及背包查看实时倒计时。"/>`;
  });
  if (!resources[29].includes('<root>') || !resources[1].includes('<root>')) throw new Error('Embedded XML root missing');
  const xmlFiles = {1: path.join(out, 'item-tips.xml'), 29: path.join(out, 'pet-shop.xml'), 31: path.join(out, 'items.xml')};
  fs.writeFileSync(xmlFiles[1], resources[1].replace('<root>', '<root>\n' + tipLines.join('\n')));
  fs.writeFileSync(xmlFiles[29], resources[29].replace('<root>', '<root>\n' + shopLines.join('\n')));
  fs.writeFileSync(xmlFiles[31], embeddedItems);
  for (const file of Object.values(xmlFiles)) await parseStringPromise(fs.readFileSync(file, 'utf8'));
  const xmlCore = path.join(out, 'NieoCore.reward-xml.swf');
  const candidate = path.join(out, 'NieoCore.reward-boosts.swf');
  ffdec('-replace', core, xmlCore, '1', xmlFiles[1], '29', xmlFiles[29], '31', xmlFiles[31]);
  ffdec('-onerror', 'abort', '-importScript', xmlCore, candidate, patch);
  const before = tags(core), after = tags(candidate);
  if (before.version !== after.version || !before.movie.equals(after.movie) || before.records.length !== after.records.length) throw new Error('SWF movie structure changed');
  const changed = [];
  for (let index = 0; index < before.records.length; index++) {
    const a = before.records[index], b = after.records[index];
    if (a.bytes.equals(b.bytes)) continue;
    if (a.type !== b.type || !(a.type === 82 || (a.type === 87 && [1,29,31].includes(a.id) && a.id === b.id))) throw new Error('Unrelated SWF tag changed: ' + index);
    changed.push({index, type: a.type, binaryId: a.type === 87 ? a.id : null});
  }
  if (changed.filter(tag => tag.type === 82).length !== 1 || changed.filter(tag => tag.type === 87).length !== 3) throw new Error('Unexpected SWF patch scope');
  const icons = {};
  for (const id of ids) {
    const destination = path.join(out, id + '.swf');
    ffdec('-replace', iconTemplate, destination, '1', path.join(patch, 'icons', id + '.svg'));
    const icon = tags(destination);
    if (!icon.records.some(tag => tag.type === 76 && tag.bytes.includes(Buffer.from('item\0')))) throw new Error('Icon item linkage lost');
    icons[id] = digest(fs.readFileSync(destination));
  }
  // Compiler preservation proof: compare every resolved non-target class after import.
  const baselinePcode = path.join(out, 'baseline-pcode'), candidatePcode = path.join(out, 'candidate-pcode');
  ffdec('-format', 'script:pcode', '-export', 'script', baselinePcode, core);
  ffdec('-format', 'script:pcode', '-export', 'script', candidatePcode, candidate);
  const oldClasses = inventory(baselinePcode), newClasses = inventory(candidatePcode);
  if (JSON.stringify(Object.keys(oldClasses)) !== JSON.stringify(Object.keys(newClasses))) throw new Error('Client class inventory changed');
  const changedClasses = Object.keys(oldClasses).filter(file => oldClasses[file] !== newClasses[file]);
  if (changedClasses.length !== 1 || !changedClasses[0].endsWith('com/robot/app/bag/BagPanel.pcode')) {
    fs.writeFileSync(path.join(out, 'class-differences.json'), JSON.stringify(changedClasses, null, 2));
    throw new Error('Non-target client class changed; see class-differences.json');
  }
  ffdec('-selectclass', 'com.robot.app.bag.BagPanel', '-export', 'script', path.join(out, 'roundtrip'), candidate);
  const proof = {coreBaselineSha256: digest(fs.readFileSync(core)), coreSha256: digest(fs.readFileSync(candidate)),
    movieHeaderPreserved: true, changedTags: changed, changedClasses, preservedClasses: Object.keys(oldClasses).length - 1,
    icons, itemIds: ids, shopCurrency: 'coins', pricePerItem: 100, durationSeconds: 3600, multiplier: 5,
    automatedTestsRun: false, actualGameUiRun: false};
  fs.writeFileSync(path.join(out, 'client-build-proof.json'), JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify(proof, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
