'use strict';

class Migration032ClassicCleanup {
    constructor() {
        this.version = 32;
        this.name = 'classic_cleanup';
        this.atomicSQLite = true;
    }
    statements() {
        return [
            `UPDATE player_pets SET pet_list = COALESCE(
                (SELECT json_group_array(json(value)) FROM json_each(player_pets.pet_list)
                 WHERE CAST(json_extract(value, '$.petId') AS INTEGER) NOT IN (1632,1633,2208,2209,2210,2470,100001,100002,100003,100004,100005,100006,100007,100008,100009,100010,100011,110001,110002,110003)),
                '[]'
            ) WHERE pet_list IS NOT NULL AND json_valid(pet_list)`,
            'DELETE FROM player_pet_collection WHERE pet_id IN (1632,1633,2208,2209,2210,2470,100001,100002,100003,100004,100005,100006,100007,100008,100009,100010,100011,110001,110002,110003)',
            `UPDATE player_items SET item_list = COALESCE(
                (SELECT json_group_array(json(value)) FROM json_each(player_items.item_list)
                 WHERE CAST(json_extract(value, '$.itemId') AS INTEGER) NOT IN (403034,403035,403036,403037,403038,403039,403040,403041,403042)),
                '[]'
            ) WHERE item_list IS NOT NULL AND json_valid(item_list)`,
            'DELETE FROM player_essence_hatches WHERE item_id IN (403034,403035,403036,403037,403038,403039,403040,403041,403042) OR pet_id IN (1632,1633,2208,2209,2210,2470,100001,100002,100003,100004,100005,100006,100007,100008,100009,100010,100011,110001,110002,110003)',
            'DELETE FROM universe_accounts',
            'DELETE FROM universe_discovery',
            'DELETE FROM universe_discovery_imports',
            'DELETE FROM universe_progress',
            'DELETE FROM universe_events',
            'DELETE FROM universe_surveys',
            'DELETE FROM universe_captures',
            'CREATE TABLE IF NOT EXISTS player_collect_claims (owner_id INTEGER NOT NULL, group_id INTEGER NOT NULL, PRIMARY KEY (owner_id, group_id))',
            'DELETE FROM player_collect_claims WHERE group_id NOT IN (1, 2, 3, 4, 5, 301)',
            "DELETE FROM receiver_claims WHERE reward_key LIKE 'signin:pet%'",
            'UPDATE players SET map_id = 5, pos_x = 480, pos_y = 320 WHERE (map_id >= 9700 AND map_id <= 9794) OR map_id = 932'
        ];
    }
    upSQLite() { return this.statements(); }
    upMySQL() { return this.statements(); }
    downSQLite() { return []; }
    downMySQL() { return []; }
}

module.exports = { Migration032ClassicCleanup };
