'use strict';
// Execute the actual AS method bodies against a small event/inventory fixture.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sources = [path.join(__dirname, 'client/capture-recovery/com/robot/petFightModule/ui/controlPanel/petItem/category/CatchPetItemCategory.as'), ...process.argv.slice(2)];
function method(text, name) {
  const position = text.indexOf('function ' + name + '(');
  assert(position >= 0, name);
  const start = text.indexOf('{', position);
  let end = start + 1, depth = 1;
  while (depth) {assert(end < text.length); if (text[end] === '{') depth++; if (text[end] === '}') depth--; end++;}
  return text.slice(start + 1, end - 1);
}
class Events {
  constructor() {this.listeners = new Map();}
  add(type, callback) {if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback);}
  remove(type, callback) {this.listeners.get(type)?.delete(callback);}
  fire(type, event) {for (const callback of [...(this.listeners.get(type) || [])]) callback(event);}
  size() {return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0);}
}
function fixture(text, count) {
  const events = new Events(), item = {itemNum: count}, sent = [], player = {nextRound: () => {state.opened++;}};
  const state = {_itemID: 300001, _itemNum: count, catchPending: false, opened: 0, timer: 0, closed: 0, destroyed: 0, stopped: 0, alert: null, refreshInfo: () => {}};
  const dispatcher = {addEventListener: events.add.bind(events), removeEventListener: events.remove.bind(events)};
  const env = {CommandID: {CATCH_MONSTER: 2409}, SocketErrorEvent: {ERROR: 'error'},
    SocketDispatcher: {getInstance: () => dispatcher},
    SocketConnection: {addCmdListener: events.add.bind(events), removeCmdListener: events.remove.bind(events), send: (...args) => sent.push(args)},
    BaseFighterPetWin: {}, ItemManager: {getCollectionInfo: () => item},
    PlayerMode: value => value, FighterModeFactory: {playerMode: player}, TimerManager: {start: () => {state.timer++;}},
    PetFightEntry: {fighterCon: {mainPanel: {msgMC: {msg_txt: state.message = {htmlText: '', scrollV: 0, maxScrollV: 3}}}}},
    closeControls: () => {state.closed++;}, destroyCategory: () => {state.destroyed++;}};
  for (const name of ['useItem', 'consumeDisplayedCapsule', 'onCatchResponse', 'onCatchRejected', 'clearCatchListeners', 'destroy']) {
    const body = method(text, name).replace('super.useItem(param1);', 'closeControls();').replace('super.destroy();', 'destroyCategory();').replace(/var (\w+):TextField/g, 'var $1');
    state[name] = new Function('env', 'param1', 'with(env){with(this){' + body + '}}').bind(state, env);
  }
  const reject = (result, cmdID = 2409) => events.fire('error', {headInfo: {result, cmdID}, stopImmediatePropagation: () => {state.stopped++;}});
  return {state, item, events, sent, reject};
}
let cases = 0;
for (const source of sources) {
  const text = fs.readFileSync(source, 'utf8');
  for (const count of [1, 100]) {
    for (const result of [5001, 5003]) {
      const f = fixture(text, count); f.state.useItem({}); f.state.useItem({});
      assert.deepEqual(f.sent, [[2409, 300001]]); assert.equal(f.state._itemNum, count);
      f.reject(5001, 2406); assert(f.state.catchPending); assert.equal(f.state.opened, 0);
      f.reject(result); assert.equal(f.events.size(), 0); assert(!f.state.catchPending);
      const expected = count - (result === 5003 ? 1 : 0);
      assert.equal(f.state._itemNum, expected); assert.equal(f.item.itemNum, expected);
      assert.equal(f.state.opened, 1); assert.equal(f.state.timer, 1); assert.equal(f.state.stopped, 1);
      assert(f.state.message.htmlText); assert.equal(f.state.message.scrollV, 3);
      f.reject(result); assert.equal(f.state._itemNum, expected); assert.equal(f.state.opened, 1);
      cases++;
    }
    for (const catchTime of [0, 1700000001]) {
      const f = fixture(text, count); f.state.useItem({}); f.events.fire(2409, {data: {catchTime}});
      assert.equal(f.events.size(), 0); assert.equal(f.state._itemNum, count - 1); assert.equal(f.item.itemNum, count - 1);
      assert.equal(f.state.opened, 0); assert.equal(f.state.timer, 0); cases++;
    }
    const f = fixture(text, count); f.state.useItem({}); f.state.destroy(); f.reject(5001);
    assert.equal(f.events.size(), 0); assert.equal(f.state.opened, 0); assert.equal(f.state.destroyed, 1);
    assert.equal(f.item.itemNum, count); cases++;
  }
}
console.log(JSON.stringify({sources: sources.length, cases, passed: true}));
