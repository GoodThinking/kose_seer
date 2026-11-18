'use strict';

const { shouldAppear } = require('./probability.cjs');
const crypto = require('node:crypto');
const { advance, REQUIRED_PET } = require('./mechanisms.js');

class EncounterStore {
    constructor(database) { this.database = database; }

    async transaction(ownerId, operation) {
        if (!Number.isSafeInteger(ownerId) || ownerId <= 0) throw new RangeError('Invalid owner');
        const db = this.database;
        return db.Transaction(async driver => {
            const insert = db.DatabaseType === 'mysql' ? 'INSERT IGNORE' : 'INSERT OR IGNORE';
            await driver.execute(`${insert} INTO universe_accounts (owner_id) VALUES (?)`, [ownerId]);
            // A write obtains SQLite's database lock and a MySQL row lock before any state is read.
            await driver.execute('UPDATE universe_accounts SET tracked_id = tracked_id WHERE owner_id = ?', [ownerId]);
            const rows = await driver.query('SELECT * FROM universe_accounts WHERE owner_id = ?', [ownerId]);
            if (rows.length !== 1) throw new Error('Encounter account missing');
            return operation(driver, rows[0], insert);
        });
    }

    async snapshot(driver, ownerId, account) {
        const discovered = await driver.query('SELECT map_id FROM universe_discovery WHERE owner_id = ? ORDER BY map_id', [ownerId]);
        const progress = await driver.query('SELECT encounter_id, failures, cycle_id, mechanism_step FROM universe_progress WHERE owner_id = ? ORDER BY encounter_id', [ownerId]);
        const surveys = await driver.query('SELECT map_id, landmark_mask, completed_at FROM universe_surveys WHERE owner_id = ? ORDER BY map_id', [ownerId]);
        const now = Date.now();
        return { account, discovered: discovered.map(row => Number(row.map_id)), progress, surveys: surveys.map(row => ({
            map_id: Number(row.map_id),
            landmark_mask: Number(row.landmark_mask),
            cooldown_ms: Number(row.completed_at) ? Math.max(0, Math.min(30000, 30000 - (now - Number(row.completed_at)))) : 0
        })) };
    }

    async state(ownerId) {
        return this.transaction(ownerId, (driver, account) => this.snapshot(driver, ownerId, account));
    }

    async ensureProgress(driver, insert, ownerId, encounterId) {
        await driver.execute(`${insert} INTO universe_progress (owner_id, encounter_id) VALUES (?, ?)`, [ownerId, encounterId]);
        const rows = await driver.query('SELECT * FROM universe_progress WHERE owner_id = ? AND encounter_id = ?', [ownerId, encounterId]);
        if (rows.length !== 1) throw new Error('Encounter progress missing');
        return rows[0];
    }
    async select(ownerId, encounterId) {
        if (!Number.isSafeInteger(encounterId) || encounterId <= 0) throw new RangeError('Invalid encounter');
        return this.transaction(ownerId, async (driver, account, insert) => {
            await this.ensureProgress(driver, insert, ownerId, encounterId);
            await driver.execute('UPDATE universe_accounts SET tracked_id = ? WHERE owner_id = ?', [encounterId, ownerId]);
            account.tracked_id = encounterId;
            return this.snapshot(driver, ownerId, account);
        });
    }

    async abandon(ownerId, encounterId, cycleId, retainMechanism) {
        return this.transaction(ownerId, async (driver, account) => {
            if (Number(account.pending_id) !== encounterId || Number(account.pending_cycle) !== cycleId || encounterId <= 0)
                throw new Error('Pending encounter mismatch');
            const reset = retainMechanism ? '' : ', mechanism_step = 0, mechanism_bits = 0';
            const result = await driver.execute(`UPDATE universe_progress SET failures = 0, cycle_id = cycle_id + 1${reset} WHERE owner_id = ? AND encounter_id = ? AND cycle_id = ?`, [ownerId, encounterId, cycleId]);
            if (result.affectedRows !== 1) throw new Error('Encounter cycle mismatch');
            await driver.execute('UPDATE universe_accounts SET pending_id = 0, pending_cycle = 0, pending_pet = 0, pending_level = 0, pending_dv = 0, pending_nature = 0 WHERE owner_id = ?', [ownerId]);
            Object.assign(account, { pending_id: 0, pending_cycle: 0, pending_pet: 0, pending_level: 0, pending_dv: 0, pending_nature: 0 });
            return this.snapshot(driver, ownerId, account);
        });
    }


    async recordEvent(driver, insert, ownerId, eventId, now) {
        if (typeof eventId !== 'string' || eventId.length === 0 || eventId.length > 128) throw new RangeError('Invalid event identity');
        const result = await driver.execute(`${insert} INTO universe_events (owner_id, event_id, created_at) VALUES (?, ?, ?)`, [ownerId, eventId, now]);
        return result.affectedRows === 1;
    }
    async beginInteraction(driver, account, ownerId, request) {
        if (!request) return true;
        const last = Number(account.interaction_nonce);
        if (request.nonce === last && request.mapId === Number(account.interaction_map) && request.id === Number(account.interaction_id)) return false;
        if (!Number.isInteger(request.nonce) || request.nonce !== last + 1 || request.nonce >= 0xffffffff) throw new Error('Invalid interaction nonce');
        request.validate();
        await driver.execute('UPDATE universe_accounts SET interaction_nonce = ?, interaction_map = ?, interaction_id = ? WHERE owner_id = ?', [request.nonce, request.mapId, request.id, ownerId]);
        Object.assign(account, { interaction_nonce: request.nonce, interaction_map: request.mapId, interaction_id: request.id });
        return true;
    }
    async mechanism(ownerId, encounter, interaction, definitions, individual, eventId, now, battle, request) {
        return this.transaction(ownerId, async (driver, account, insert) => {
            if (!await this.beginInteraction(driver, account, ownerId, request)) return this.snapshot(driver, ownerId, account);
            if (battle?.validate && !battle.validate()) throw new Error('Battle context changed');
            if (Number(account.pending_id)) throw new Error('Pending encounter exists');
            const progress = await this.ensureProgress(driver, insert, ownerId, encounter.id);
            const required = REQUIRED_PET[encounter.id];
            let hasRequired = false;
            if (required) {
                const rows = await driver.query('SELECT pet_id FROM player_pet_collection WHERE owner_id = ? AND pet_id = ?', [ownerId, required]);
                hasRequired = rows.length > 0;
            }
            const next = advance(progress, interaction, definitions, id => id === required && hasRequired, battle);
            if (!await this.recordEvent(driver, insert, ownerId, eventId, now)) throw new Error('Duplicate interaction');
            await driver.execute('UPDATE universe_progress SET mechanism_step = ?, mechanism_bits = ? WHERE owner_id = ? AND encounter_id = ?', [next.step, next.bits, ownerId, encounter.id]);
            if (next.complete && encounter.kind === 'mechanism') {
                if (typeof individual === 'function') individual = individual();
                await driver.execute('UPDATE universe_accounts SET pending_id = ?, pending_cycle = ?, pending_pet = ?, pending_level = ?, pending_dv = ?, pending_nature = ? WHERE owner_id = ?', [encounter.id, progress.cycle_id, encounter.petId, individual.level, individual.dv, individual.nature, ownerId]);
                Object.assign(account, { pending_id: encounter.id, pending_cycle: progress.cycle_id, pending_pet: encounter.petId, pending_level: individual.level, pending_dv: individual.dv, pending_nature: individual.nature });
            }
            if (battle?.validate && !battle.validate()) throw new Error('Battle context changed');
            request?.validate();
            return this.snapshot(driver, ownerId, account);
        });
    }
    async survey(ownerId, mapId, landmark, encounter, individual, eventId, now, request) {
        if (!Number.isInteger(landmark) || landmark < 1 || landmark > 3) throw new RangeError('Invalid landmark');
        return this.transaction(ownerId, async (driver, account, insert) => {
            if (!await this.beginInteraction(driver, account, ownerId, request)) return this.snapshot(driver, ownerId, account);
            await driver.execute(`${insert} INTO universe_surveys (owner_id, map_id) VALUES (?, ?)`, [ownerId, mapId]);
            const rows = await driver.query('SELECT * FROM universe_surveys WHERE owner_id = ? AND map_id = ?', [ownerId, mapId]);
            const survey = rows[0];
            const bit = 1 << (landmark - 1);
            if (Number(survey.completed_at) && now - Number(survey.completed_at) < 30000) throw new Error('Survey cooldown');
            if (Number(survey.landmark_mask) & bit) throw new Error('Landmark already surveyed');
            if (!await this.recordEvent(driver, insert, ownerId, eventId, now)) throw new Error('Duplicate interaction');
            const mask = Number(survey.landmark_mask) | bit;
            if (mask === 7) {
                await driver.execute('UPDATE universe_surveys SET landmark_mask = 0, completed_at = ? WHERE owner_id = ? AND map_id = ?', [now, ownerId, mapId]);
                const selected = typeof encounter === 'function' ? encounter(account) : encounter;
                if (selected) await this.roll(driver, account, insert, ownerId, selected, typeof individual === 'function' ? individual(selected) : individual, `survey:${eventId}`, now);
            } else {
                await driver.execute('UPDATE universe_surveys SET landmark_mask = ? WHERE owner_id = ? AND map_id = ?', [mask, ownerId, mapId]);
            }
            request?.validate();
            return this.snapshot(driver, ownerId, account);
        });
    }



    async roll(driver, account, insert, ownerId, encounter, individual, eventId, now) {
        if (!await this.recordEvent(driver, insert, ownerId, eventId, now)) return false;
        if (Number(account.pending_id) !== 0 || Number(account.tracked_id) !== encounter.id) return false;
        const progress = await this.ensureProgress(driver, insert, ownerId, encounter.id);
        // Uniform 48-bit integer; no user-provided random source enters production.
        const u = crypto.randomBytes(6).readUIntBE(0, 6) / 0x1000000000000;
        if (!shouldAppear(encounter.kind, Number(progress.failures), u)) {
            await driver.execute('UPDATE universe_progress SET failures = failures + 1 WHERE owner_id = ? AND encounter_id = ?', [ownerId, encounter.id]);
            return false;
        }
        await driver.execute('UPDATE universe_accounts SET pending_id = ?, pending_cycle = ?, pending_pet = ?, pending_level = ?, pending_dv = ?, pending_nature = ? WHERE owner_id = ?', [encounter.id, progress.cycle_id, encounter.petId, individual.level, individual.dv, individual.nature, ownerId]);
        Object.assign(account, { pending_id: encounter.id, pending_cycle: progress.cycle_id, pending_pet: encounter.petId, pending_level: individual.level, pending_dv: individual.dv, pending_nature: individual.nature });
        return true;
    }
}

module.exports = { EncounterStore };
