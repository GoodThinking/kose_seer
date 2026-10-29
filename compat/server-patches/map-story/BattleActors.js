'use strict';

const pair = Object.freeze(['player', 'enemy']);

// Group battles keep actor identity separate from the pair currently executing
// an attack. Persistent effects must retain their original source and target.
class BattleActors {
    static Sides(battle) {
        return battle.groupActors ? battle.groupActors.sides : pair;
    }

    static Key(battle, pet) {
        if (!battle.groupActors) return pet === battle.player ? 'player' : 'enemy';
        const key = battle.groupActors.keys.get(pet);
        if (key === undefined) throw new Error('Group battle actor is not registered');
        return key;
    }

    static Foe(battle, pet) {
        if (!battle.groupActors) return pet === battle.player ? battle.enemy : battle.player;
        const foe = battle.groupActors.opponents.get(pet);
        if (!foe) throw new Error('Group battle actor has no selected opponent');
        return foe;
    }
}

module.exports = { BattleActors };
