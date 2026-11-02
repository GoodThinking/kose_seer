#!/usr/bin/env python3
"""Install the reviewed SPT delta; never restore player data during rollback."""
import argparse
from datetime import datetime, timezone
import fcntl
import grp
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import stat
import subprocess
import tempfile
import time

if not __debug__:
    raise SystemExit('Release checks require Python assertions; do not use -O.')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('stage', type=Path)
parser.add_argument('release')
parser.add_argument('--manifest-sha256', required=True)
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
root = Path('/opt/kose-seer')
stage = args.stage.resolve()

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest() if file.is_file() else None

assert sha(stage / 'manifest.json') == args.manifest_sha256
manifest = json.loads((stage / 'manifest.json').read_text(encoding='utf-8'))
assert re.fullmatch(r'spt-boss-[A-Za-z0-9_-]+', args.release)
assert manifest['release'] == args.release
assert manifest['userAuthorized'] is True and manifest['databaseChanges'] is False
assert re.fullmatch(r'[0-9a-f]{40}', manifest['sourceCommit'])
assert sha(stage / 'acceptance.json') == manifest['acceptanceHash']
acceptance = json.loads((stage / 'acceptance.json').read_text(encoding='utf-8'))
assert acceptance['complete'] is True
assert acceptance['verified']['designRoutes'] == 302
assert acceptance['verified']['controllerReplays'] == 304
assert acceptance['verified']['rewardRoutes'] == 142
assert acceptance['verified']['nativeClientVictories'] == 6
expected = {
    'app/config/data/json/boss_abilities.json',
    *(f'app/dist/GameServer/Game/Battle/{name}.js' for name in (
        'SPTBossRules', 'UniverseBossRules', 'UniverseBossBiomes',
        'UniverseBossFrontier', 'UniverseBossBudget', 'BossSpecialRules',
        'BattleEffectIntegration', 'BattleTurnExecutor', 'BattleManager',
        'SkillEffectRuntime')),
    'client/assets/dll/NieoCore.swf', 'client/overlay/dll/NieoCore.swf',
    'client/assets/module/com/robot/module/app/SptPanel.swf',
    'client/overlay/resource/module/PetFightDLL.swf',
}
records = manifest['files']
removed = manifest['removed']
assert len(records) == len(expected) and {row['path'] for row in records} == expected
assert len(removed) == 1 and removed[0]['path'] == 'app/dist/GameServer/Game/Battle/SPTTeamBattle.js'
locks = []
for name in ('.release.lock', '.client-release.lock'):
    lock = (root / name).open('a')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    locks.append(lock)

def run(*command):
    return subprocess.check_output(command, text=True).strip()

def state(service):
    fields = ('ActiveState', 'SubState', 'MainPID', 'NRestarts', 'WorkingDirectory')
    return dict(line.split('=', 1) for line in run('systemctl', 'show', service,
                *('-p' + key for key in fields)).splitlines())

services = ('kose-seer.service', 'kose-seer-web.service')
before = {service: state(service) for service in services}
assert all(value['ActiveState'] == 'active' for value in before.values()), before
assert before[services[0]]['WorkingDirectory'] == str(root / 'app')
node = os.readlink('/proc/' + before[services[0]]['MainPID'] + '/exe')
for row in [*records, *removed]:
    destination = root / row['path']
    assert destination.resolve().is_relative_to(root), 'Target escapes installation root'
    assert not destination.is_symlink(), 'Refuse symlink target: ' + row['path']
    assert sha(destination) == row['before'], 'Live baseline changed: ' + row['path']
for row in records:
    assert sha(stage / row['path']) == row['after'], 'Uploaded bytes changed: ' + row['path']
    if row['path'].endswith('.js'):
        subprocess.run([node, '--check', str(stage / row['path'])], check=True)
for relative, digest in manifest['protected'].items():
    assert sha(root / relative) == digest, 'Protected dependency changed: ' + relative
old_bosses = json.loads((root / 'app/config/data/json/boss_abilities.json').read_text())['bossConfigs']
new_bosses = json.loads((stage / 'app/config/data/json/boss_abilities.json').read_text())['bossConfigs']
identity = lambda boss: (boss['mapId'], boss['param2'], boss['petId'])
assert [identity(boss) for boss in old_bosses] == [identity(boss) for boss in new_bosses]
for old, new in zip(old_bosses, new_bosses):
    if not old.get('teamChallenge'):
        assert old == new, 'Non-SPT boss changed'
        continue
    for key in ('spt', 'drops', 'rewards', 'skills', 'requiredBosses'):
        assert old.get(key) == new.get(key), 'Reward or entry contract changed: ' + key
    if new['sptBoss']['native']:
        without_profile = lambda boss: {key: value for key, value in boss.items()
                                       if key not in ('teamChallenge', 'sptBoss')}
        assert without_profile(old) == without_profile(new), 'Native mechanics changed'
assert sum(bool(boss.get('sptBoss')) for boss in new_bosses) == 151
assert not any(boss.get('teamChallenge') for boss in new_bosses)

def runtime_snapshot():
    result = {}
    for subtree in ('app/dist', 'app/src', 'app/config'):
        for directory, _, files in os.walk(root / subtree, followlinks=False):
            for name in files:
                file = Path(directory) / name
                if file.suffix in ('.js', '.ts', '.json', '.xml') and not file.is_symlink():
                    result[str(file.relative_to(root))] = sha(file)
    return result

protected_runtime = runtime_snapshot()
changed_app = {row['path'] for row in [*records, *removed] if row['path'].startswith('app/')}
protected_runtime = {key: value for key, value in protected_runtime.items() if key not in changed_app}
app_bytes = int(run('du', '-sk', str(root / 'app')).split()[0]) * 1024
assert shutil.disk_usage(root).free > app_bytes * 2 + 100_000_000, 'Insufficient backup space'
if not args.apply:
    print(json.dumps({'ready': True, 'files': len(records), 'removed': len(removed),
                      'protectedRuntimeFiles': len(protected_runtime), 'services': before}))
    raise SystemExit(0)

os.umask(0o027)
gid = grp.getgrnam('kose-seer').gr_gid
backup = root / 'backups' / args.release
backup.mkdir(mode=0o750)
os.chown(backup, 0, gid)
installed = []
deleted = []
stopped = False

def replace(source, destination, mode):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=destination.name + '.spt-',
                                         dir=destination.parent, delete=False) as output:
            temporary = Path(output.name)
            with source.open('rb') as incoming:
                shutil.copyfileobj(incoming, output)
            output.flush()
            os.fsync(output.fileno())
        os.chown(temporary, 0, gid)
        os.chmod(temporary, mode)
        os.replace(temporary, destination)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

try:
    subprocess.run(['systemctl', 'stop', services[0]], check=True)
    stopped = True
    shutil.copytree(root / 'app', backup / 'app', symlinks=True)
    for row in records:
        source = root / row['path']
        if row['path'].startswith('client/') and source.is_file():
            target = backup / row['path']
            target.parent.mkdir(parents=True, exist_ok=True, mode=0o750)
            shutil.copy2(source, target)
    for name in ('manifest.json', 'acceptance.json'):
        shutil.copy2(stage / name, backup / name)
    for directory, _, files in os.walk(backup, followlinks=False):
        os.chown(directory, 0, gid)
        os.chmod(directory, 0o750)
        for name in files:
            target = Path(directory) / name
            if not target.is_symlink():
                mode = stat.S_IMODE(target.stat().st_mode) & 0o750
                os.chown(target, 0, gid)
                os.chmod(target, mode)
    for row in sorted(records, key=lambda entry: entry['path'].endswith('/NieoCore.swf')):
        destination = root / row['path']
        assert sha(destination) == row['before'], 'Baseline changed during install: ' + row['path']
        replace(stage / row['path'], destination, row['mode'])
        installed.append(row)
        assert sha(destination) == row['after'], 'Installed bytes differ: ' + row['path']
    for row in removed:
        destination = root / row['path']
        assert sha(destination) == row['before']
        destination.unlink()
        deleted.append(row)
    actual = runtime_snapshot()
    assert {key: value for key, value in actual.items() if key not in changed_app} == protected_runtime
    for relative, digest in manifest['protected'].items():
        assert sha(root / relative) == digest, 'Protected dependency changed during install'
    subprocess.run(['systemctl', 'start', services[0]], check=True)
    deadline = time.monotonic() + 30
    while True:
        try:
            assert state(services[0])['ActiveState'] == 'active'
            with socket.create_connection(('127.0.0.1', 9999), timeout=1):
                pass
            break
        except (AssertionError, OSError):
            if time.monotonic() >= deadline:
                raise
            time.sleep(0.25)
    after = {service: state(service) for service in services}
    assert all(value['ActiveState'] == 'active' for value in after.values())
    assert after[services[1]]['MainPID'] == before[services[1]]['MainPID']
    assert after[services[0]]['MainPID'] != before[services[0]]['MainPID']
    result = {'release': args.release, 'sourceCommit': manifest['sourceCommit'],
              'installedAt': datetime.now(timezone.utc).isoformat(), 'backup': str(backup),
              'files': records, 'removed': removed, 'before': before, 'after': after,
              'protectedRuntimeFiles': len(protected_runtime), 'tcp9999': True,
              'databaseChanges': False, 'playerDataChangedByDeployment': False,
              'fullAppBackup': True}
    (backup / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))
except BaseException:
    for row in reversed(deleted):
        destination = root / row['path']
        assert not destination.exists(), 'Refuse rollback over external replacement'
        replace(backup / row['path'], destination, row['mode'])
    for row in reversed(installed):
        destination = root / row['path']
        assert sha(destination) == row['after'], 'Refuse rollback over external update'
        if row['before'] is None:
            destination.unlink()
        else:
            replace(backup / row['path'], destination, row['mode'])
    if stopped:
        subprocess.run(['systemctl', 'restart', services[0]], check=True)
    raise
