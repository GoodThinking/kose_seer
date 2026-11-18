'use strict';

class Migration030CreateUniverseEncounters {
    constructor() {
        this.version = 30;
        this.name = 'create_universe_encounters';
        this.atomicSQLite = true;
    }
    statements() {
        return [
            `CREATE TABLE universe_accounts (
                owner_id BIGINT PRIMARY KEY, tracked_id INTEGER NOT NULL DEFAULT 0,
                pending_id INTEGER NOT NULL DEFAULT 0, pending_cycle INTEGER NOT NULL DEFAULT 0,
                pending_pet INTEGER NOT NULL DEFAULT 0, pending_level INTEGER NOT NULL DEFAULT 0,
                pending_dv INTEGER NOT NULL DEFAULT 0, pending_nature INTEGER NOT NULL DEFAULT 0,
                interaction_nonce BIGINT NOT NULL DEFAULT 0, interaction_map INTEGER NOT NULL DEFAULT 0,
                interaction_id INTEGER NOT NULL DEFAULT 0
            )`,
            `CREATE TABLE universe_discovery (
                owner_id BIGINT NOT NULL, map_id INTEGER NOT NULL,
                discovered_at BIGINT NOT NULL, source VARCHAR(64) NOT NULL,
                PRIMARY KEY (owner_id, map_id)
            )`,
            `CREATE TABLE universe_discovery_imports (
                owner_id BIGINT NOT NULL, spt_id INTEGER NOT NULL, map_id INTEGER NOT NULL,
                imported_at BIGINT NOT NULL, PRIMARY KEY (owner_id, spt_id, map_id)
            )`,
            `CREATE TABLE universe_progress (
                owner_id BIGINT NOT NULL, encounter_id INTEGER NOT NULL,
                failures INTEGER NOT NULL DEFAULT 0, cycle_id INTEGER NOT NULL DEFAULT 1,
                mechanism_step INTEGER NOT NULL DEFAULT 0, mechanism_bits INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (owner_id, encounter_id)
            )`,
            `CREATE TABLE universe_events (
                owner_id BIGINT NOT NULL, event_id VARCHAR(128) NOT NULL,
                created_at BIGINT NOT NULL, PRIMARY KEY (owner_id, event_id)
            )`,
            `CREATE TABLE universe_surveys (
                owner_id BIGINT NOT NULL, map_id INTEGER NOT NULL,
                landmark_mask INTEGER NOT NULL DEFAULT 0, completed_at BIGINT NOT NULL DEFAULT 0,
                PRIMARY KEY (owner_id, map_id)
            )`,
            `CREATE TABLE universe_captures (
                owner_id BIGINT NOT NULL, encounter_id INTEGER NOT NULL, cycle_id INTEGER NOT NULL,
                pet_id INTEGER NOT NULL, catch_time BIGINT NOT NULL,
                PRIMARY KEY (owner_id, encounter_id, cycle_id)
            )`,
        ];
    }
    upSQLite() { return this.statements(); }
    upMySQL() { return this.statements(); }
    downSQLite() { return []; }
    downMySQL() { return []; }
}

module.exports = { Migration030CreateUniverseEncounters };
