'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const directories = ['resource/fightResource/pet/swf', 'resource/fightResource/skill/swf'];
const battleModule = '/resource/module/PetFightDLL.swf';
const isBattleAsset = pathname => pathname === battleModule || /^\/resource\/fightResource\/(pet|skill)\/swf\/\d+\.swf$/.test(pathname);
const signature = stat => `${stat.dev}-${stat.ino}-${stat.size}-${stat.mtimeNs}-${stat.ctimeNs}`;

module.exports = function createBattleAssetCache(root) {
  let version = '';
  let signatures = new Map();

  return {
    refresh() {
      const next = new Map();
      // Overlay wins exactly as it does in the HTTP asset resolver.
      for (const layer of ['assets', 'overlay']) {
        const base = path.join(root, layer);
        for (const directory of directories) {
          const folder = path.join(base, directory);
          if (!fs.existsSync(folder)) continue;
          for (const name of fs.readdirSync(folder)) {
            if (!/^\d+\.swf$/.test(name)) continue;
            const stat = fs.statSync(path.join(folder, name), { bigint: true });
            if (stat.isFile()) next.set(`/${directory}/${name}`, signature(stat));
          }
        }
        const moduleFile = path.join(base, battleModule);
        if (fs.existsSync(moduleFile)) {
          const stat = fs.statSync(moduleFile, { bigint: true });
          if (stat.isFile()) next.set(battleModule, signature(stat));
        }
      }
      const digest = crypto.createHash('sha256');
      for (const [name, stamp] of [...next].sort(([a], [b]) => a.localeCompare(b))) {
        digest.update(`${name}\0${stamp}\n`);
      }
      signatures = next;
      version = digest.digest('hex');
      return { version };
    },

    cacheControl(pathname, stat, requestedVersion) {
      if (!version || requestedVersion !== version || !isBattleAsset(pathname)) return 'no-store';
      // A deployment or on-demand download after the snapshot must not poison its immutable URL.
      return signatures.get(pathname) === signature(stat)
        ? 'public, max-age=31536000, immutable'
        : 'no-store';
    }
  };
};
