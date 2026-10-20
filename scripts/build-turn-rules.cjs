'use strict';
// Build the turn-rule release from a captured live app: using an item, switching pets or failing a capture gives up the
// move but still runs a whole turn (turn start/end effects, the foe moves first); switching in after a faint is free.
// BattleTurnExecutor/BattleTurnService: dist + TS mirror. BattleManager: dist only (its TS mirror predates the live file).
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['context', 'baseline', 'out'].map(n => [n, {type: 'string'}]))});
for (const n of ['context', 'baseline', 'out']) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
const ts = require(path.join(path.resolve(v.context), 'node_modules/typescript'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}
function blankMap(rel) {
  const mapRel = rel + '.map';
  if (!fs.existsSync(path.join(baseline, mapRel))) return;
  const map = JSON.parse(fs.readFileSync(path.join(baseline, mapRel), 'utf8'));
  if (map.mappings === '') return;
  map.mappings = '';
  put(mapRel, JSON.stringify(map));
}
const indentOf = (text, pos) => /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', pos - 1) + 1))[0];
function patch(rel, visitor, expected) {
  const text = fs.readFileSync(path.join(baseline, rel), 'utf8');
  const ast = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  (function walk(n) { visitor(n, ast, edits, text); ts.forEachChild(n, walk); })(ast);
  const counts = {};
  for (const e of edits) counts[e.tag] = (counts[e.tag] || 0) + 1;
  assert.deepEqual(counts, expected, `${rel}: unexpected edit points`);
  let result = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, e.start) + e.text + result.slice(e.end);
  const check = ts.createSourceFile(rel, result, ts.ScriptTarget.Latest, true);
  if (check.parseDiagnostics.length) throw Error('Syntax: ' + rel + ' ' + check.parseDiagnostics[0].messageText);
  put(rel, result);
  if (rel.endsWith('.js')) blankMap(rel);
}
const name = (n, a) => n.name ? n.name.getText(a) : '';
const methodOf = (n, a) => {
  let p = n;
  while (p && !ts.isMethodDeclaration(p)) p = p.parent;
  return p ? name(p, a) : '';
};
const declared = (n, a, variable, method) => ts.isVariableDeclaration(n) && name(n, a) === variable && methodOf(n, a) === method;
// TS mirror uses 2-space indentation, dist uses 4
const lines = (list, indent, js) => list.map(l => l ? indent + (js ? l : l.replace(/^ {2,}/, sp => ' '.repeat(sp.length / 2))) : '').join('\n');

// ==================== BattleTurnExecutor：放弃出手的回合 ====================
for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const SER = js ? 'SkillEffectRuntime_1.SkillEffectRuntime' : 'SkillEffectRuntime';
  const CORE = js ? 'BattleCore_1.BattleCore' : 'BattleCore';
  patch(`app/${dir}/GameServer/Game/Battle/BattleTurnExecutor${ext}`, (n, a, e, text) => {
    if (!js && ts.isInterfaceDeclaration(n) && name(n, a) === 'ITurnOptions') {
      const last = n.members[n.members.length - 1];
      const indent = indentOf(text, last.getStart(a));
      e.push({start: last.end, end: last.end, tag: 'option',
        text: `\n${indent}/** PvE：玩家用道具、换精灵或捕捉失败，本回合放弃出手 */\n${indent}playerIdle?: boolean;`});
    }
    if (declared(n, a, 'pet1Skill', 'ExecuteTurn'))
      e.push({start: n.initializer.getStart(a), end: n.initializer.getStart(a), tag: 'idleSkill', text: 'options.playerIdle ? this.GetNoActionSkill() : '});
    if (declared(n, a, 'pet1CanAct', 'ExecuteTurn')) {
      const body = n.initializer.body;
      e.push({start: body.getStart(a), end: body.end, tag: 'idleCanAct', text: `options.playerIdle ? this.IdleCanAct(battle) : (${body.getText(a)})`});
    }
    if (declared(n, a, 'pet1First', 'ExecuteTurn'))
      e.push({start: n.initializer.getStart(a), end: n.initializer.getStart(a), tag: 'idleFirst', text: '!options.playerIdle && '});
    if (ts.isMethodDeclaration(n) && name(n, a) === 'ExecuteTurn') {
      const indent = indentOf(text, n.getStart(a));
      // dist 的方法之间没有空行
      e.push({start: n.end, end: n.end, tag: 'idleMethod', text: '\n' + lines([
        ...(js ? [] : ['']),
        '/**',
        ' * 放弃出手：本回合不行动，敌方获得先手权；控制类异常照常过一回合',
        ' */',
        `${js ? 'static' : 'private static'} IdleCanAct(battle${js ? '' : ': IBattleInfo'})${js ? '' : ': { canAct: boolean; reason?: string }'} {`,
        `    ${SER}.CanAct(battle, battle.player, this.GetNoActionSkill());`,
        `    ${CORE}.CanAct(battle.player);`,
        "    return { canAct: false, reason: 'idle' };",
        '}',
      ], indent, js)});
    }
  }, js ? {idleSkill: 1, idleCanAct: 1, idleFirst: 1, idleMethod: 1} : {option: 1, idleSkill: 1, idleCanAct: 1, idleFirst: 1, idleMethod: 1});
}

// ==================== BattleTurnService：道具/换精灵/捕捉失败后的回合 ====================
for (const [dir, ext] of [['src', '.ts'], ['dist', '.js']]) {
  const js = ext === '.js';
  const EXEC = js ? 'BattleTurnExecutor_1.BattleTurnExecutor' : 'BattleTurnExecutor';
  const CORE = js ? 'BattleCore_1.BattleCore' : 'BattleCore';
  patch(`app/${dir}/GameServer/Game/Battle/services/BattleTurnService${ext}`, (n, a, e, text) => {
    if (!ts.isMethodDeclaration(n) || name(n, a) !== 'ExecuteEnemyTurn') return;
    const indent = indentOf(text, n.getStart(a));
    e.push({start: n.body.getStart(a), end: n.body.end, tag: 'enemyTurn', text: lines([
      '{',
      '    // 玩家放弃出手：敌方获得先手权，回合开始和结束的效果照常结算',
      '    battle.turn++;',
      `    const skillConfigs = new Map${js ? '' : '<number, ISkillConfig>'}();`,
      '    for (const skillId of battle.player.skills) {',
      '        this.LoadSkillConfig(skillId, skillConfigs);',
      '    }',
      '    for (const skillId of battle.enemy.skills) {',
      '        this.LoadSkillConfig(skillId, skillConfigs);',
      '    }',
      `    const enemySkillId = require("../BossSpecialRules").BossSpecialRules.SelectBossSkill(battle, ${CORE}.AISelectSkill(battle.enemy, battle.player, battle.enemy.skills, skillConfigs));`,
      '    this.LoadSkillConfig(enemySkillId, skillConfigs);',
      `    const result = ${EXEC}.ExecuteTurn(battle, 0, enemySkillId, skillConfigs, { playerIdle: true });`,
      '    const enemyAttack = [result.firstAttack, result.secondAttack].find(attack => attack && attack.userId !== battle.userId);',
      '    // 回合开始时已分出胜负，敌方没有出手',
      `    return enemyAttack || ${js ? EXEC : `(${EXEC} as any)`}.ExecuteAttack(battle, battle.enemy, battle.player, ${EXEC}.GetNoActionSkill(), 0, { canAct: false, reason: 'idle' }, false);`,
      '}',
    ], indent, js).slice(indent.length)});
  }, {enemyTurn: 1});
}

// ==================== BattleManager（dist）：阵亡后换精灵不算回合；回合结束击倒敌方即胜利 ====================
patch('app/dist/GameServer/Game/Battle/BattleManager.js', (n, a, e, text) => {
  if (ts.isMethodDeclaration(n) && name(n, a) === 'ExecuteEnemyCounterAndSend') {
    const last = n.body.statements[n.body.statements.length - 1];
    assert.equal(last.getText(a), 'this.UpdatePlayerHPRecord();', 'Unknown end of ExecuteEnemyCounterAndSend');
    const indent = indentOf(text, last.getStart(a));
    e.push({start: last.end, end: last.end, tag: 'counterOver', text: '\n' + lines([
      '// 回合结束的效果（中毒等）击倒了敌方',
      'if (this._currentBattle?.enemy.hp <= 0)',
      '    await this.HandleFightOver(this.UserID, 0, isCurrent);',
    ], indent, true)});
  }
  if (declared(n, a, 'oldCatchTime', 'ChangePet')) {
    const statement = n.parent.parent;
    const indent = indentOf(text, statement.getStart(a));
    e.push({start: statement.end, end: statement.end, tag: 'freeSwitch', text: '\n' + lines([
      '// 精灵阵亡后换上来直接进入下一回合；主动换精灵算放弃出手',
      'const freeSwitch = this._currentBattle.player.hp <= 0;',
    ], indent, true)});
  }
  if (ts.isBlock(n) && methodOf(n, a) === 'ChangePet') {
    const list = n.statements;
    for (let i = 0; i + 1 < list.length; i++) {
      if (list[i].getText(a) !== 'await this.ExecuteEnemyCounterAndSend();' || list[i + 1].getText(a) !== 'await this.CheckPlayerPetDeath();') continue;
      const indent = indentOf(text, list[i].getStart(a));
      e.push({start: list[i].getStart(a), end: list[i + 1].end, tag: 'counterSkip', text: lines([
        'if (!freeSwitch) {',
        '    await this.ExecuteEnemyCounterAndSend();',
        '    await this.CheckPlayerPetDeath();',
        '}',
      ], indent, true).slice(indent.length)});
    }
  }
}, {counterOver: 1, freeSwitch: 1, counterSkip: 1});

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'AST edit points counted per file; verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
