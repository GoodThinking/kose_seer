'use strict';
const { DatabaseManager } = require('../DatabaseManager');

// SPT flags are monotonic. Merge with the locked row so a stale cache cannot erase
// another committed first win. Capture mutable fields only after entering the queue.
async function saveProgress(data) {
    const db = DatabaseManager.Instance;
    await db.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
            const lock = db.DatabaseType === 'mysql' ? ' FOR UPDATE' : '';
            const [previous] = await driver.query('SELECT boss_achievement FROM player_challenge_progress WHERE user_id = ?' + lock, [data.userID]);
            const row = data.ToRow();
            if (previous?.boss_achievement) {
                const old = Buffer.from(previous.boss_achievement);
                if (old.length !== 200) throw new Error('Invalid SPT progress');
                for (let i = 0; i < 200; i++) if (old[i]) row.boss_achievement[i] = 1;
            }
            if (db.DatabaseType === 'sqlite') {
                await driver.execute('INSERT INTO player_challenge_progress (user_id,boss_achievement,max_puni_lv,tower_boss_index) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET boss_achievement=excluded.boss_achievement,max_puni_lv=excluded.max_puni_lv,tower_boss_index=excluded.tower_boss_index', [row.user_id, row.boss_achievement, row.max_puni_lv, row.tower_boss_index]);
            } else {
                await driver.execute('INSERT INTO player_challenge_progress (user_id,boss_achievement,max_puni_lv,tower_boss_index) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE boss_achievement=VALUES(boss_achievement),max_puni_lv=VALUES(max_puni_lv),tower_boss_index=VALUES(tower_boss_index)', [row.user_id, row.boss_achievement, row.max_puni_lv, row.tower_boss_index]);
            }
            await driver.commit();
            committed = true;
            for (let i = 0; i < 200; i++) if (row.boss_achievement[i] && !data.bossAchievement[i]) data.bossAchievement[i] = true;
            // BaseData's running debounce clears _pendingSave after save returns.
            // Re-arm after that continuation if anything changed during the write.
            const current = data.ToRow();
            if (!current.boss_achievement.equals(row.boss_achievement) || current.max_puni_lv !== row.max_puni_lv || current.tower_boss_index !== row.tower_boss_index)
                setTimeout(() => data.scheduleSave(), 0);
        } catch (error) {
            if (!committed) await driver.rollback();
            throw error;
        }
    });
}
exports.saveProgress = saveProgress;
