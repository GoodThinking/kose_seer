'use strict';

const { catalog } = require('./discovery');
const movementData = require('./movement-data.json');
const { DecodeAMF } = require('../../../shared/utils/AMFDecoder');
const positions = new WeakMap();
const WIDTH = 96, HEIGHT = 56, SIZE = 10;
const DIRECTIONS = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];

function walkable(scene, x, y) {
    if (scene.gridSize !== SIZE || !Array.isArray(scene.walkMask) || scene.walkMask.length !== HEIGHT || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= 960 || y >= 560) return false;
    const row = scene.walkMask[Math.floor(y / SIZE)];
    return typeof row === 'string' && row.length === WIDTH && row[Math.floor(x / SIZE)] === '1';
}
function cell(scene, x, y) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && typeof scene.walkMask[y] === 'string' && scene.walkMask[y].length === WIDTH && scene.walkMask[y][x] === '1';
}
function visible(scene, a, b) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(length));
    let previousX = Math.floor(a.x / SIZE), previousY = Math.floor(a.y / SIZE);
    for (let n = 0; n <= steps; n++) {
        const fraction = n / steps;
        const x = a.x + (b.x - a.x) * fraction, y = a.y + (b.y - a.y) * fraction;
        if (!walkable(scene, x, y)) return false;
        const nextX = Math.floor(x / SIZE), nextY = Math.floor(y / SIZE);
        if (nextX !== previousX && nextY !== previousY && (!cell(scene, nextX, previousY) || !cell(scene, previousX, nextY))) return false;
        previousX = nextX; previousY = nextY;
    }
    return true;
}
function route(scene, from, to) {
    if (!walkable(scene, from.x, from.y) || !walkable(scene, to.x, to.y)) return null;
    if (visible(scene, from, to)) return [from, to];
    const start = Math.floor(from.y / SIZE) * WIDTH + Math.floor(from.x / SIZE);
    const goal = Math.floor(to.y / SIZE) * WIDTH + Math.floor(to.x / SIZE);
    const count = WIDTH * HEIGHT, cost = new Float64Array(count), parent = new Int32Array(count), closed = new Uint8Array(count);
    cost.fill(Infinity); parent.fill(-1); cost[start] = 0;
    const heap = [];
    function push(node, score) {
        let i = heap.length;
        heap.push({ node, score });
        while (i > 0) { const p = (i - 1) >> 1; if (heap[p].score <= score) break; heap[i] = heap[p]; i = p; }
        heap[i] = { node, score };
    }
    function pop() {
        const result = heap[0], last = heap.pop();
        if (heap.length) {
            let i = 0;
            while (true) {
                let child = i * 2 + 1;
                if (child >= heap.length) break;
                if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++;
                if (heap[child].score >= last.score) break;
                heap[i] = heap[child]; i = child;
            }
            heap[i] = last;
        }
        return result.node;
    }
    const gx = goal % WIDTH, gy = Math.floor(goal / WIDTH);
    const heuristic = (x, y) => { const dx = Math.abs(gx - x), dy = Math.abs(gy - y); return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy); };
    push(start, heuristic(start % WIDTH, Math.floor(start / WIDTH)));
    while (heap.length) {
        const id = pop();
        if (closed[id]) continue;
        if (id === goal) break;
        closed[id] = 1;
        const x = id % WIDTH, y = Math.floor(id / WIDTH);
        for (const [dx, dy] of DIRECTIONS) {
            const nx = x + dx, ny = y + dy;
            if (!cell(scene, nx, ny) || (dx && dy && (!cell(scene, x + dx, y) || !cell(scene, x, y + dy)))) continue;
            const next = ny * WIDTH + nx, nextCost = cost[id] + (dx && dy ? 14 : 10);
            if (closed[next] || nextCost >= cost[next]) continue;
            cost[next] = nextCost; parent[next] = id;
            push(next, nextCost + heuristic(nx, ny));
        }
    }
    if (start !== goal && parent[goal] < 0) return null;
    const cells = [];
    for (let node = goal; node !== start; node = parent[node]) cells.push(node);
    cells.reverse();
    const raw = [from, ...cells.slice(0, -1).map(id => ({ x: (id % WIDTH) * SIZE + SIZE / 2, y: Math.floor(id / WIDTH) * SIZE + SIZE / 2 })), to];
    const result = [raw[0]];
    for (let i = 0; i < raw.length - 1;) {
        let next = raw.length - 1;
        while (next > i + 1 && !visible(scene, raw[i], raw[next])) next--;
        if (!visible(scene, raw[i], raw[next])) return null;
        result.push(raw[next]); i = next;
    }
    return result;
}
function footSpeed(player) {
    for (const id of player.Data.clothIds || []) {
        const speed = movementData.footSpeeds[String(id)];
        if (Number.isFinite(speed) && speed > 0) return speed;
    }
    return 4.6;
}
function mountSpeed(pet) {
    if (!pet) return null;
    const speed = movementData.mountSpeeds[String(pet.petId)];
    return Number.isFinite(speed) && speed >= 0 ? speed + 5 : null;
}
function reset(player, scene, x, y) {
    if (!walkable(scene, x, y)) throw new Error('Universe spawn is not walkable');
    const point = { x, y }, equipped = player.Data.clothIds || [];
    const pet = player.PetManager.GetDefaultPet();
    // Enter-map sends the displayed pet, followed by a clothing update when nonempty.
    const actorSpeed = equipped.length ? footSpeed(player) : (mountSpeed(pet) ?? footSpeed(player));
    positions.set(player, { mapId: scene.mapId, route: [point], startAt: Date.now(), phase: 1000 / 24, speeds: [], speedEvents: [], confirmed: 0, actorSpeed, mountShown: mountSpeed(pet) !== null, mode: 'walk' });
}
function resume(player, x, y) {
    const mapId = Number(player.Data.mapID);
    if (mapId < 9700 || mapId > 9794) return;
    const scene = catalog().scenes.find(item => item.mapId === mapId);
    if (!scene) throw new Error('Unknown universe login map');
    reset(player, scene, x, y);
}
// WalkAction advances twice per 24 Hz frame. This is an upper bound, not
// the rendered pose: allow one frame of phase and native half-step snaps.
function reachable(pos, now, overshoot, budgetOverride) {
    if (pos.mode === 'fly') {
        // Flight keeps its existing easing and 150 px/s duration; one 24 Hz
        // frame is the phase allowance for its reachable-prefix upper bound.
        const length = Math.hypot(pos.route[1].x - pos.route[0].x, pos.route[1].y - pos.route[0].y);
        const t = pos.duration === 0 ? 1 : Math.min(1, Math.max(0, now - pos.startAt + pos.phase) / pos.duration);
        const eased = 1 - (1 - t) * (1 - t);
        return overshoot ? false : length * eased * eased;
    }
    const budget = budgetOverride ?? Math.floor((Math.max(0, now - pos.startAt) + pos.phase) * 48 / 1000 + 1e-9);
    let earliest = 0, distance = 0;
    for (let i = 1; i < pos.route.length; i++) {
        const a = pos.route[i - 1], b = pos.route[i];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const choices = [{ step: 0, speed: pos.speeds[0] }];
        if (i > 1) choices.push(...pos.speedEvents);
        let finish = Infinity, partial = 0;
        for (let j = 0; j < choices.length; j++) {
            const entry = Math.max(earliest, choices[j].step);
            // A segment entering after another change uses that later speed.
            const end = j + 1 < choices.length ? choices[j + 1].step : Infinity;
            if (entry >= end || entry > budget) continue;
            const speed = choices[j].speed;
            if (overshoot && overshoot.index === i && overshoot.along <= length + speed / 2 + 1e-6 &&
                entry + Math.ceil(overshoot.along / speed - 1e-9) <= budget) return true;
            const cost = Math.max(1, Math.ceil(length / speed - 0.5));
            finish = Math.min(finish, entry + cost);
            partial = Math.max(partial, Math.min(length, Math.max(0, budget - entry) * speed));
        }
        if (finish > budget) return overshoot ? false : distance + partial;
        distance += length;
        earliest = finish;
    }
    return overshoot ? false : distance;
}
function pointAtDistance(pos, distance) {
    for (let i = 1; i < pos.route.length; i++) {
        const a = pos.route[i - 1], b = pos.route[i], length = Math.hypot(b.x - a.x, b.y - a.y);
        if (distance <= length && length) return { x: a.x + (b.x - a.x) * distance / length, y: a.y + (b.y - a.y) * distance / length };
        distance -= length;
    }
    return pos.route[pos.route.length - 1];
}
function progress(pos, now) {
    if (pos.mode === 'fly') {
        const t = pos.duration === 0 ? 1 : Math.min(1, Math.max(0, now - pos.startAt) / pos.duration);
        const eased = 1 - (1 - t) * (1 - t), fraction = eased * eased;
        const [a, b] = pos.route;
        return { point: { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction }, index: 1 };
    }
    return { point: pointAtDistance(pos, reachable(pos, now)) };
}
function positionAt(pos, now) { return progress(pos, now).point; }
function changeActorSpeed(player, actorSpeed, mountShown) {
    const pos = positions.get(player);
    if (!pos) return;
    if (pos.mode === 'walk' && pos.route.length > 1) {
        const step = Math.floor((Math.max(0, Date.now() - pos.startAt) + pos.phase) * 48 / 1000 + 1e-9);
        const events = pos.speedEvents;
        if (events.length && events[events.length - 1].step === step) events.pop();
        events.push({ step, speed: actorSpeed });
    }
    pos.actorSpeed = actorSpeed;
    if (mountShown !== undefined) pos.mountShown = mountShown;
}
function clothesChanged(player) { changeActorSpeed(player, footSpeed(player)); }
function petShown(player, pet) {
    const pos = positions.get(player);
    if (!pos) return;
    const mounted = Number(player.Data.actionType) === 1 ? null : mountSpeed(pet);
    if (mounted !== null) changeActorSpeed(player, mounted, true);
    else if (pos.mountShown) changeActorSpeed(player, footSpeed(player), false);
}
function nativeSegment(scene, from, to) {
    const x = Math.floor(from.x / SIZE), y = Math.floor(from.y / SIZE);
    const tx = Math.floor(to.x / SIZE), ty = Math.floor(to.y / SIZE);
    const dx = tx - x, dy = ty - y;
    if (!cell(scene, tx, ty)) return false;
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        return !dx || !dy || (cell(scene, tx, y) && cell(scene, x, ty));
    }
    // AStar.optimize samples integer grid coordinates, not every crossed pixel.
    // WalkAction then replaces the first grid point with the actor's exact position.
    const distance = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
    for (let step = 1; step < Math.floor(distance); step++) {
        if (!cell(scene, Math.trunc(x + Math.cos(angle) * step), Math.trunc(y + Math.sin(angle) * step))) return false;
    }
    return true;
}
// Minimum movement time represented by an authorized arc, using the same
// upper-bound step model. Phase is spent once and carried across reroutes.
function travelTime(pos, now, arc, overshoot) {
    if (pos.mode === 'fly') {
        const length = Math.hypot(pos.route[1].x - pos.route[0].x, pos.route[1].y - pos.route[0].y);
        if (!length || !arc) return 0;
        return pos.duration * (1 - Math.sqrt(1 - Math.sqrt(Math.min(1, arc / length))));
    }
    if (!arc && !overshoot) return 0;
    let low = 0, high = Math.floor((Math.max(0, now - pos.startAt) + pos.phase) * 48 / 1000 + 1e-9);
    const reaches = steps => overshoot ? reachable(pos, now, overshoot, steps) : reachable(pos, now, null, steps) + 1e-6 >= arc;
    if (!reaches(high)) return Infinity;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (reaches(middle)) high = middle;
        else low = middle + 1;
    }
    return low * 1000 / 48;
}
function onRoute(pos, point, now, allowOvershoot) {
    // Flash display positions are quantized to 20 twips per pixel.
    const tolerance = 0.05 + 1e-6;
    const upper = reachable(pos, now);
    if (pos.route.length === 1) {
        if (Math.abs(point.x - pos.route[0].x) > tolerance || Math.abs(point.y - pos.route[0].y) > tolerance) return null;
        const moved = Math.hypot(point.x - pos.route[0].x, point.y - pos.route[0].y) > 1e-6;
        return moved ? 1000 / 48 : 0;
    }
    let offset = 0;
    for (let i = 1; i < pos.route.length; i++) {
        const a = pos.route[i - 1], b = pos.route[i], dx = b.x - a.x, dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (!length) {
            if (offset >= pos.confirmed - 1e-6 && offset <= upper + 1e-6 &&
                Math.abs(point.x - a.x) <= tolerance && Math.abs(point.y - a.y) <= tolerance) {
                const spent = travelTime(pos, now, offset);
                return offset < 1e-6 && Math.hypot(point.x - pos.route[0].x, point.y - pos.route[0].y) > 1e-6
                    ? Math.max(spent, 1000 / 48) : spent;
            }
            continue;
        }
        let low = 0, high = i < pos.route.length - 1 ? Infinity : length;
        for (const [value, origin, delta] of [[point.x, a.x, dx / length], [point.y, a.y, dy / length]]) {
            if (delta === 0) {
                if (Math.abs(value - origin) > tolerance) { high = -1; break; }
            } else {
                const first = (value - origin - tolerance) / delta, last = (value - origin + tolerance) / delta;
                low = Math.max(low, Math.min(first, last));
                high = Math.min(high, Math.max(first, last));
            }
        }
        if (Math.max(low, pos.confirmed - offset) <= Math.min(high, length, upper - offset)) {
            const projected = ((point.x - a.x) * dx + (point.y - a.y) * dy) / length;
            const arc = offset + Math.max(pos.confirmed - offset, Math.min(length, upper - offset, Math.max(0, projected)));
            let spent = travelTime(pos, now, arc);
            if (arc < 1e-6 && Math.hypot(point.x - pos.route[0].x, point.y - pos.route[0].y) > 1e-6) spent = Math.max(spent, 1000 / 48);
            return spent;
        }
        // advance() publishes _curPos before nextFun() resets an intermediate
        // segment. It can expose up to half a step past that vertex. Terrain
        // remains mandatory, even for a native overshoot.
        const beyond = Math.max(low, length + 1e-6);
        if (allowOvershoot && i < pos.route.length - 1 && beyond <= high && offset + length >= pos.confirmed - 1e-6 &&
            reachable(pos, now, { index: i, along: beyond })) return travelTime(pos, now, offset + length, { index: i, along: beyond });
        offset += length;
    }
    return null;
}
function nativeWalkPath(scene, pos, request, now) {
    if (!Buffer.isBuffer(request.amfData) || request.amfData.length === 0 || request.amfData.length > 65536) return null;
    let decoded;
    try { decoded = DecodeAMF(request.amfData); } catch { return null; }
    if (!Array.isArray(decoded) || decoded.length < 2 || decoded.length > 4096) return null;
    const from = decoded[0];
    if (!from || !Number.isFinite(from.x) || !Number.isFinite(from.y) || from.x < 0 || from.y < 0 || from.x >= 960 || from.y >= 560) return null;
    const fromWalkable = walkable(scene, from.x, from.y);
    // A native optimized segment may cross an unsampled blocked cell. Only
    // its already-authorized, reachable walk prefix can start a reroute there.
    if (!fromWalkable && (pos.mode !== 'walk' || pos.route.length < 2)) return null;
    const spent = onRoute(pos, from, now, fromWalkable);
    if (spent === null) return null;
    const path = [{ x: from.x, y: from.y }];
    for (const point of decoded.slice(1)) {
        if (!point || !walkable(scene, point.x, point.y)) return null;
        const next = { x: point.x, y: point.y };
        if (!nativeSegment(scene, path[path.length - 1], next)) return null;
        path.push(next);
    }
    const last = path[path.length - 1];
    return last.x === Math.floor(request.x / SIZE) * SIZE && last.y === Math.floor(request.y / SIZE) * SIZE ? { path, spent } : null;
}
function accept(player, request) {
    const mapId = Number(player.Data.mapID);
    if (mapId < 9700 || mapId > 9794) return true;
    const config = catalog(), scene = config.scenes.find(item => item.mapId === mapId), pos = positions.get(player);
    if (!scene || !pos || pos.mapId !== mapId || !walkable(scene, request.x, request.y)) return false;
    const now = Date.now(), flying = Number(player.Data.actionType) === 1;
    if (Number(request.walkType) !== (flying ? 1 : 0)) return false;
    let result;
    if (flying) {
        const estimated = positionAt(pos, now);
        const anchor = pos.route[0];
        const estimatedArc = pos.mode === 'walk' ? reachable(pos, now) : Math.hypot(estimated.x - anchor.x, estimated.y - anchor.y);
        const arc = Math.max(pos.confirmed, estimatedArc);
        const from = pointAtDistance(pos, arc);
        result = { path: [from, { x: request.x, y: request.y }], spent: travelTime(pos, now, arc) };
    } else result = nativeWalkPath(scene, pos, request, now);
    if (!result || !Number.isFinite(result.spent)) return false;
    const available = Math.max(0, now - pos.startAt) + pos.phase;
    if (result.spent > available + 1e-6) return false;
    const path = result.path, from = path[0];
    const duration = flying ? Math.hypot(request.x - from.x, request.y - from.y) / 150 * 1000 : 0;
    const phase = Math.min(1000 / 24, Math.max(0, available - result.spent));
    positions.set(player, { ...pos, route: path, startAt: now, phase, speeds: path.slice(1).map(() => pos.actorSpeed), speedEvents: [], confirmed: 0, duration, mode: flying ? 'fly' : 'walk' });
    return true;
}
// Return the earliest possible walkable arc position, including an open
// grid-cell boundary when the boundary itself belongs to the blocked cell.
function firstWalkableDistance(scene, a, dx, dy, length, start, end) {
    const vx = dx / length, vy = dy / length, cuts = [start, end];
    for (const [origin, velocity, limit] of [[a.x, vx, WIDTH], [a.y, vy, HEIGHT]]) {
        if (!velocity) continue;
        for (let cellIndex = 1; cellIndex < limit; cellIndex++) {
            const distance = (cellIndex * SIZE - origin) / velocity;
            if (distance > start && distance < end) cuts.push(distance);
        }
    }
    cuts.sort((left, right) => left - right);
    const isWalkable = distance => walkable(scene, a.x + vx * distance, a.y + vy * distance);
    for (let i = 0; i < cuts.length; i++) {
        if (isWalkable(cuts[i])) return cuts[i];
        if (i + 1 < cuts.length && cuts[i + 1] > cuts[i] && isWalkable((cuts[i] + cuts[i + 1]) / 2)) return cuts[i];
    }
    return null;
}
function near(player, scene, hotspot) {
    const pos = positions.get(player);
    if (!pos || pos.mapId !== scene.mapId || !Number.isFinite(hotspot.x) || !Number.isFinite(hotspot.y) || !Number.isFinite(hotspot.radius) || hotspot.radius <= 0) return false;
    const now = Date.now();
    const upper = reachable(pos, now);
    let offset = 0;
    for (let i = 1; i < pos.route.length; i++) {
        const a = pos.route[i - 1], b = pos.route[i], dx = b.x - a.x, dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (!length) {
            if (offset >= pos.confirmed && offset <= upper && walkable(scene, a.x, a.y) &&
                (a.x - hotspot.x) ** 2 + (a.y - hotspot.y) ** 2 <= hotspot.radius ** 2) return true;
            continue;
        }
        const projection = ((hotspot.x - a.x) * dx + (hotspot.y - a.y) * dy) / length;
        const perpendicular = (hotspot.x - a.x) ** 2 + (hotspot.y - a.y) ** 2 - projection ** 2;
        const radiusSquared = hotspot.radius ** 2 - perpendicular;
        if (radiusSquared >= 0) {
            const start = Math.max(0, pos.confirmed - offset, projection - Math.sqrt(radiusSquared));
            const end = Math.min(length, upper - offset, projection + Math.sqrt(radiusSquared));
            if (start <= end) {
                const witness = firstWalkableDistance(scene, a, dx, dy, length, start, end);
                if (witness !== null) {
                    pos.confirmed = Math.max(pos.confirmed, offset + witness);
                    return true;
                }
            }
        }
        offset += length;
    }
    if (pos.route.length === 1) {
        const point = pos.route[0];
        return walkable(scene, point.x, point.y) && (point.x - hotspot.x) ** 2 + (point.y - hotspot.y) ** 2 <= hotspot.radius ** 2;
    }
    return false;
}
module.exports = { walkable, route, reset, resume, accept, near, clothesChanged, petShown };
