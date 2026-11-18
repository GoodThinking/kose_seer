'use strict';

const {ElementSystem} = require('./ElementSystem');

function hasElement(skill, type) {
    return skill.type === type || ElementSystem.Components(skill.type).includes(type);
}

module.exports = {hasElement};
