#!/usr/bin/env node
'use strict';

/**
 * Exports crisp, auto-cropped pet icons (PNG) and planet/mechanism map previews (JPG)
 * from local SWF assets into deploy/baseline/client/overlay/guide/img/{pets,maps}/.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const WORK_ROOT = path.resolve(__dirname, '..');
const SAIERHAO_ROOT = path.resolve(WORK_ROOT, '../..');
const ASSETS_ROOT = path.join(SAIERHAO_ROOT, 'work/client-lab/assets/resource');
const JAVA_BIN = path.join(SAIERHAO_ROOT, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const FFDEC_JAR = path.join(SAIERHAO_ROOT, 'work/client-lab/tools/ffdec/ffdec.jar');

const GUIDE_DIR = path.join(WORK_ROOT, 'deploy/baseline/client/overlay/guide');
const OUT_PETS = path.join(GUIDE_DIR, 'img/pets');
const OUT_MAPS = path.join(GUIDE_DIR, 'img/maps');
const TMP_BASE = '/tmp/seer-guide-assets';

// Pure-Node PNG decoder/encoder for RGBA 8-bit PNGs (FFDec output)
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePngRGBA(buf) {
  let off = 8;
  let w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idats = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString('ascii');
    const data = buf.subarray(off + 8, off + 8 + len);
    off += 12 + len;
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') break;
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) return null;
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const stride = w * bpp;
  const pixels = Buffer.alloc(w * h * 4);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);

  for (let y = 0; y < h; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    for (let i = 0; i < stride; i++) {
      const x = raw[rowStart + 1 + i];
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 0xff;
      else if (filter === 2) val = (x + b) & 0xff;
      else if (filter === 3) val = (x + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) val = (x + paeth(a, b, c)) & 0xff;
      cur[i] = val;
    }
    for (let x = 0; x < w; x++) {
      const dst = (y * w + x) * 4;
      const src = x * bpp;
      pixels[dst] = cur[src];
      pixels[dst + 1] = cur[src + 1];
      pixels[dst + 2] = cur[src + 2];
      pixels[dst + 3] = bpp === 4 ? cur[src + 3] : 255;
    }
    cur.copy(prev);
  }
  return { w, h, pixels };
}

function encodePngRGBA(w, h, pixels) {
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function cropAndSquarePng(inPath, outPath, maxSize = 112, opts = {}) {
  const decoded = decodePngRGBA(fs.readFileSync(inPath));
  if (!decoded) {
    fs.copyFileSync(inPath, outPath);
    return false;
  }
  const { w, h, pixels } = decoded;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return false;

  // For groupFightResource/pet/*.swf (5-pose sprite sheet), isolate only the leftmost front-facing `pet` pose
  if (opts.takeLeftmostCluster) {
    const spanW = maxX - minX + 1;
    const colHasPix = new Uint8Array(spanW);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (pixels[(y * w + x) * 4 + 3] > 12) {
          colHasPix[x - minX] = 1;
          break;
        }
      }
    }
    // Find contiguous horizontal runs separated by >= 8px empty transparent gap
    const runs = [];
    let start = -1;
    let gap = 0;
    for (let i = 0; i < spanW; i++) {
      if (colHasPix[i]) {
        if (start === -1) start = i;
        gap = 0;
      } else if (start !== -1) {
        gap++;
        if (gap >= 8) {
          runs.push([minX + start, minX + i - gap]);
          start = -1;
          gap = 0;
        }
      }
    }
    if (start !== -1) runs.push([minX + start, minX + spanW - 1 - gap]);

    if (runs.length >= 2) {
      [minX, maxX] = runs[0];
      // Re-tighten minY..maxY within the leftmost pose only
      minY = h;
      maxY = -1;
      for (let y = 0; y < h; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (pixels[(y * w + x) * 4 + 3] > 12) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }
  }

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const pad = Math.max(4, Math.round(Math.max(bw, bh) * 0.08));
  const side = Math.max(bw, bh) + pad * 2;
  const outPix = Buffer.alloc(side * side * 4);
  const offX = Math.floor((side - bw) / 2);
  const offY = Math.floor((side - bh) / 2);

  for (let y = 0; y < bh; y++) {
    const srcStart = ((minY + y) * w + minX) * 4;
    const dstStart = ((offY + y) * side + offX) * 4;
    pixels.copy(outPix, dstStart, srcStart, srcStart + bw * 4);
  }

  fs.writeFileSync(outPath, encodePngRGBA(side, side, outPix));
  if (side > maxSize) {
    try {
      execFileSync('/usr/bin/sips', ['-Z', String(maxSize), outPath], { stdio: 'ignore' });
    } catch {}
  }
  return true;
}

function main() {
  fs.mkdirSync(OUT_PETS, { recursive: true });
  fs.mkdirSync(OUT_MAPS, { recursive: true });
  fs.rmSync(TMP_BASE, { recursive: true, force: true });

  const fixGroup = process.argv.includes('--fix-group');
  const petStage = path.join(TMP_BASE, 'pet-swfs');
  const petRaw = path.join(TMP_BASE, 'pet-raw');
  const groupStage = path.join(TMP_BASE, 'group-swfs');
  const groupRaw = path.join(TMP_BASE, 'group-raw');
  const mapStage = path.join(TMP_BASE, 'map-swfs');
  const mapRaw = path.join(TMP_BASE, 'map-raw');
  const ffdecHome = path.join(TMP_BASE, 'ffdec-home');
  for (const d of [petStage, petRaw, groupStage, groupRaw, mapStage, mapRaw, ffdecHome]) fs.mkdirSync(d, { recursive: true });

  // Load guide-data.js to know exact pet IDs we need
  global.window = {};
  require(path.join(GUIDE_DIR, 'guide-data.js'));
  const data = global.window.SEER_GUIDE_DATA;

  const petIds = new Set([
    ...data.pets.map((p) => p.id),
    ...data.bosses.map((b) => b.petId),
    ...data.fusion.fixed.flatMap((r) => [r.mainId, r.petId, ...r.subIds, ...(r.rare ? [r.rare.petId] : [])]),
    ...data.fusion.miracles.flatMap((m) => [m.mainId, ...m.pool.map((p) => p.petId)]),
    ...data.starArenas.map((a) => a.rewardPetId),
  ]);

  const singleDirs = [
    path.join(ASSETS_ROOT, 'pet/swf'),
    path.join(ASSETS_ROOT, 'pet/head'),
    path.join(WORK_ROOT, 'deploy/baseline/client/overlay/resource/pet/head'),
  ];
  const groupDir = path.join(ASSETS_ROOT, 'groupFightResource/pet');

  let stagedSingle = 0;
  let stagedGroup = 0;
  for (const id of petIds) {
    const outFile = path.join(OUT_PETS, `${id}.png`);
    const exists = fs.existsSync(outFile) && fs.statSync(outFile).size > 200;
    const singleMatch = singleDirs.map((d) => path.join(d, `${id}.swf`)).find((f) => fs.existsSync(f));
    if (singleMatch) {
      if (!exists) {
        fs.symlinkSync(singleMatch, path.join(petStage, `${id}.swf`));
        stagedSingle++;
      }
      continue;
    }
    const groupMatch = path.join(groupDir, `${id}.swf`);
    if (fs.existsSync(groupMatch) && (!exists || fixGroup)) {
      fs.symlinkSync(groupMatch, path.join(groupStage, `${id}.swf`));
      stagedGroup++;
    }
  }

  console.log(`Exporting ${stagedSingle} single-pose & ${stagedGroup} group-sheet pet sprites via FFDec...`);
  if (stagedSingle > 0) {
    execFileSync(
      JAVA_BIN,
      [
        `-Duser.home=${ffdecHome}`, '-Djava.awt.headless=true', '-Xmx2g', '-jar', FFDEC_JAR,
        '-onerror', 'ignore', '-ignorebackground', '-zoom', '2', '-format', 'frame:png', '-select', '1',
        '-export', 'frame', petRaw, petStage,
      ],
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    let cropped = 0;
    for (const entry of fs.readdirSync(petRaw)) {
      const m = entry.match(/^(\d+)\.swf$/);
      if (!m) continue;
      const pngPath = path.join(petRaw, entry, '1.png');
      if (fs.existsSync(pngPath) && cropAndSquarePng(pngPath, path.join(OUT_PETS, `${m[1]}.png`), 112)) cropped++;
    }
    console.log(`Cropped & saved ${cropped} single-pose pet icons.`);
  }

  if (stagedGroup > 0) {
    execFileSync(
      JAVA_BIN,
      [
        `-Duser.home=${ffdecHome}`, '-Djava.awt.headless=true', '-Xmx2g', '-jar', FFDEC_JAR,
        '-onerror', 'ignore', '-ignorebackground', '-zoom', '4', '-format', 'frame:png', '-select', '1',
        '-export', 'frame', groupRaw, groupStage,
      ],
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    let cropped = 0;
    for (const entry of fs.readdirSync(groupRaw)) {
      const m = entry.match(/^(\d+)\.swf$/);
      if (!m) continue;
      const pngPath = path.join(groupRaw, entry, '1.png');
      if (fs.existsSync(pngPath) && cropAndSquarePng(pngPath, path.join(OUT_PETS, `${m[1]}.png`), 112, { takeLeftmostCluster: true })) cropped++;
    }
    console.log(`Cropped & saved ${cropped} group-sheet pet icons (leftmost front pose).`);
  }

  // Export key planet & mechanism maps (including all hatch absorption & terrain mechanism maps)
  const targetMaps = [
    5, 10, 11, 12, 13, 15, 16, 17, 21, 22, 26, 30, 32, 33, 34, 36, 40,
    53, 54, 56, 58, 59, 102, 105, 106, 110, 304, 309, 314, 318, 326, 338,
    348, 401, 405, 414, 415, 425, 430, 435, 437, 438, 441, 450, 465, 476,
    485, 494, 511, 684, 685, 686, 687, 693, 733, 9507, 10039, 81951,
  ];
  const mapSrcDirs = [
    path.join(ASSETS_ROOT, 'map'),
    path.join(WORK_ROOT, 'deploy/baseline/client/overlay/resource/map'),
  ];
  let stagedMaps = 0;
  for (const mid of targetMaps) {
    const outFile = path.join(OUT_MAPS, `${mid}.jpg`);
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) continue;
    const candidate = mapSrcDirs.map((d) => path.join(d, `${mid}.swf`)).find((f) => fs.existsSync(f));
    if (candidate) {
      fs.symlinkSync(candidate, path.join(mapStage, `${mid}.swf`));
      stagedMaps++;
    }
  }

  console.log(`Exporting ${stagedMaps} map screenshots via FFDec...`);
  if (stagedMaps > 0) {
    execFileSync(
      JAVA_BIN,
      [
        `-Duser.home=${ffdecHome}`,
        '-Djava.awt.headless=true',
        '-Xmx2g',
        '-jar',
        FFDEC_JAR,
        '-onerror', 'ignore',
        '-format', 'frame:png',
        '-select', '1',
        '-export', 'frame',
        mapRaw,
        mapStage,
      ],
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );

    let savedMaps = 0;
    for (const entry of fs.readdirSync(mapRaw)) {
      const m = entry.match(/^(\d+)\.swf$/);
      if (!m) continue;
      const pngPath = path.join(mapRaw, entry, '1.png');
      if (!fs.existsSync(pngPath)) continue;
      const outJpg = path.join(OUT_MAPS, `${m[1]}.jpg`);
      execFileSync('/usr/bin/sips', ['-Z', '640', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', pngPath, '--out', outJpg], { stdio: 'ignore' });
      savedMaps++;
    }
    console.log(`Saved ${savedMaps} map previews to ${OUT_MAPS}`);
  }

  // Also grab real live screenshot for map 514 (谱尼圣殿) if available
  const puniShot = path.join(SAIERHAO_ROOT, 'outputs/spt-boss-cutover-20261102/native-puni-domain-entry.png');
  const puniOut = path.join(OUT_MAPS, '514.jpg');
  if (fs.existsSync(puniShot) && !fs.existsSync(puniOut)) {
    execFileSync('/usr/bin/sips', ['-Z', '640', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', puniShot, '--out', puniOut], { stdio: 'ignore' });
    console.log('Saved Puni domain screenshot 514.jpg');
  }

  fs.rmSync(TMP_BASE, { recursive: true, force: true });
  console.log('Done! Total pets:', fs.readdirSync(OUT_PETS).length, 'Total maps:', fs.readdirSync(OUT_MAPS).length);
}

main();
