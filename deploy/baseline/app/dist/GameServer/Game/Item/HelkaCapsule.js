'use strict';
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');

// User-authorized server rule: type 1502 is one permanent claim per account.
const ITEM_ID = 300008, COUNT = 2, MAX = 999, KEY = 'helka:capsule';
class HelkaCapsuleAlreadyClaimed extends Error {}
class HelkaCapsule {
  constructor(player) { this.player = player; }
  Validate() {
    if (this.player.Data.mapID !== 35 || this.player.Data.actionType === 1) {
      throw new Error('Helka capsule requires map 35 and non-busy state');
    }
  }
  async Count() {
    this.Validate();
    return DatabaseManager.Instance.WithConnection(async driver => {
      const rows = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, KEY, 0]);
      return rows.length ? 1 : 0;
    });
  }
  async Claim() {
    this.Validate();
    const inventory = this.player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
      this.Validate();
      return await DatabaseManager.Instance.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
          const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [this.player.Uid, KEY, 0]);
          if (claim) throw new HelkaCapsuleAlreadyClaimed('Helka capsule already claimed');
          const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]);
          if (!row) throw new Error('Inventory missing');
          const items = JSON.parse(row.item_list);
          const item = items.find(entry => entry.itemId === ITEM_ID);
          if (item) {
            if (!Number.isSafeInteger(item.count) || item.count < 0 || item.count + COUNT > MAX) throw new Error('Capsule inventory limit exceeded');
            item.count += COUNT;
          } else {
            items.push({ itemId: ITEM_ID, count: COUNT, expireTime: 0x057E40 });
          }
          const now = Math.floor(Date.now() / 1000);
          const quotaWrite = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, KEY, 0, now, 1]);
          const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
          if (quotaWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1) throw new Error('Capsule reward was not saved');
          await driver.commit();
          committed = true;
          inventory.ItemList = items;
          return { itemId: ITEM_ID, count: COUNT };
        } catch (error) {
          if (!committed) await driver.rollback();
          throw error;
        }
      });
    } finally { release(); }
  }
}
module.exports = { HelkaCapsule, HelkaCapsuleAlreadyClaimed };
