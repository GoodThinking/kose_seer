'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const repo = path.resolve(__dirname, '..');
const xmlPath = path.join(repo, 'compat/server-patches/coin-products/config/data/xml/items.xml');
const bin31Path = path.join(repo, 'compat/client-patches/coin-products/binaryData/31.bin');
const bin1Path = path.join(repo, 'compat/client-patches/coin-products/binaryData/1.bin');
const jsonPath = path.join(repo, 'compat/server-patches/coin-products/config/data/json/money-products.json');

console.log('Running reward boost and item price verification...');

// 1. Verify items.xml
const itemsXml = fs.readFileSync(xmlPath, 'utf8');
assert.ok(itemsXml.includes('ID="399901" Name="十倍经验卡"'), '399901 name in items.xml');
assert.ok(itemsXml.includes('ID="399901"') && itemsXml.includes('RewardMultiplier="10"'), '399901 multiplier in items.xml');
assert.ok(itemsXml.includes('ID="399903" Name="十倍赛尔豆卡"'), '399903 name in items.xml');
assert.ok(itemsXml.includes('ID="399903"') && itemsXml.includes('RewardMultiplier="10"'), '399903 multiplier in items.xml');

// Key prices
const keyPrices = [
  ['300001', '1000'],
  ['300002', '3000'],
  ['300003', '8000'],
  ['300004', '20000'],
  ['300006', '100000'],
  ['300011', '100'],
  ['300014', '2000'],
  ['300016', '200'],
  ['300017', '1000'],
  ['300024', '20000'],
  ['300025', '30000'],
  ['300026', '5000'],
  ['300052', '50000'],
  ['300053', '30000'],
  ['300054', '50000'],
  ['300650', '10000'],
  ['300651', '50000'],
  ['300700', '200000'],
  ['399901', '20000'],
  ['399902', '20000'],
  ['399903', '20000'],
  ['400501', '5000'],
];

for (const [id, price] of keyPrices) {
  const pat = new RegExp(`ID="${id}"[^>]*Price="${price}"`);
  assert.ok(pat.test(itemsXml), `Item ${id} price ${price} in items.xml`);
}
console.log('✓ items.xml verification passed');

// 2. Verify 31.bin
const bin31 = fs.readFileSync(bin31Path, 'utf8');
assert.ok(bin31.includes('ID="399901" Name="十倍经验卡"'), '399901 name in 31.bin');
assert.ok(bin31.includes('ID="399903" Name="十倍赛尔豆卡"'), '399903 name in 31.bin');
for (const [id, price] of keyPrices) {
  const pat = new RegExp(`ID="${id}"[^>]*Price="${price}"`);
  assert.ok(pat.test(bin31), `Item ${id} price ${price} in 31.bin`);
}
console.log('✓ 31.bin verification passed');

// 3. Verify 1.bin
const bin1 = fs.readFileSync(bin1Path, 'utf8');
assert.ok(bin1.includes('id="399901"') && bin1.includes('基础经验的10倍'), '399901 10x in 1.bin');
assert.ok(bin1.includes('id="399903"') && bin1.includes('基础奖励的10倍'), '399903 10x in 1.bin');
console.log('✓ 1.bin verification passed');

// 4. Verify money-products.json
const moneyProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const p300700 = moneyProducts.products.find(p => p.itemIds.includes(300700));
assert.ok(p300700, '300700 found in money-products.json');
assert.equal(p300700.coins, 200000, '300700 coins in money-products.json');
assert.equal(p300700.vipCoins, 200000, '300700 vipCoins in money-products.json');
console.log('✓ money-products.json verification passed');

console.log('All static verifications passed!');
