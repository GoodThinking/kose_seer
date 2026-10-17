'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const createCache = require('../compat/client-patches/versioned-assets/battle-asset-cache.cjs');
const pet = '/resource/fightResource/pet/swf/165.swf';
const immutable = 'public, max-age=31536000, immutable';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seer-asset-cache-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  function put(layer, name, bytes) {
    const file = path.join(root, layer, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    return file;
  }
  const cache = createCache(root);
  const policy = (name, file, version) => cache.cacheControl(name, fs.statSync(file, { bigint: true }), version);
  return { root, put, cache, policy };
}

test('only a matching snapshot enables immutable caching; unchanged refresh preserves its key', t => {
  const { put, cache, policy } = fixture(t);
  const file = put('assets', pet, 'original');
  const version = cache.refresh().version;
  assert.equal(policy(pet, file, version), immutable);
  assert.equal(cache.refresh().version, version);
  assert.equal(policy(pet, file, null), 'no-store');
  assert.equal(policy(pet, file, 'stale'), 'no-store');
  const config = put('assets', '/config/server.xml', '<server/>');
  assert.equal(policy('/config/server.xml', config, version), 'no-store');
  assert.equal(cache.refresh().version, version);
});

test('a changed asset cannot be cached under an old version even before the next refresh', t => {
  const { put, cache, policy } = fixture(t);
  const file = put('assets', pet, 'original');
  const oldVersion = cache.refresh().version;
  put('assets', pet, 'new asset bytes');
  assert.equal(policy(pet, file, oldVersion), 'no-store');
  const newVersion = cache.refresh().version;
  assert.notEqual(newVersion, oldVersion);
  assert.equal(policy(pet, file, oldVersion), 'no-store');
  assert.equal(policy(pet, file, newVersion), immutable);
});

test('overlay overrides and removal track the file actually served', t => {
  const { root, put, cache, policy } = fixture(t);
  const base = put('assets', pet, 'base');
  const original = cache.refresh().version;
  const overlay = put('overlay', pet, 'override');
  const replaced = cache.refresh().version;
  assert.notEqual(replaced, original);
  assert.equal(policy(pet, overlay, replaced), immutable);
  assert.equal(policy(pet, base, replaced), 'no-store');
  fs.unlinkSync(path.join(root, 'overlay', pet));
  assert.equal(cache.refresh().version, original);
  assert.equal(policy(pet, base, original), immutable);
});

test('assets downloaded after the snapshot stay uncached until their version is discovered', t => {
  const { put, cache, policy } = fixture(t);
  const oldVersion = cache.refresh().version;
  const file = put('assets', pet, 'downloaded');
  assert.equal(policy(pet, file, oldVersion), 'no-store');
  const newVersion = cache.refresh().version;
  assert.notEqual(newVersion, oldVersion);
  assert.equal(policy(pet, file, newVersion), immutable);
});

test('atomic replacement with equal size and preserved mtime still invalidates the version', t => {
  const { put, cache, policy } = fixture(t);
  const file = put('assets', pet, 'old');
  const oldStat = fs.statSync(file);
  const version = cache.refresh().version;
  const replacement = put('assets', pet + '.next', 'new');
  fs.utimesSync(replacement, oldStat.atime, oldStat.mtime);
  fs.renameSync(replacement, file);
  assert.equal(policy(pet, file, version), 'no-store');
  assert.notEqual(cache.refresh().version, version);
});
