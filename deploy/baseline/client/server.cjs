'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pipeline } = require('node:stream');
const { WebSocketServer } = require('ws');
const fetchAsset = require('./asset-cache.cjs');
const battleAssetCache = require('./battle-asset-cache.cjs')(__dirname);
const port = Number(process.env.PORT || 18760);
const upstreamPort = Number(process.env.KOSE_TCP_PORT || 49199);
const origin = process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`;
const expectedHost = new URL(origin).host;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm', '.xml': 'application/xml', '.swf': 'application/x-shockwave-flash', '.txt': 'text/plain' };
const server = http.createServer(async (req, res) => {
  if (req.headers.host !== expectedHost) { res.writeHead(403).end(); return; }
  let url, pathname;
  try { url = new URL(req.url, origin); pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname.includes('..') || pathname.includes('\\')) { res.writeHead(400).end(); return; }
  if (pathname === '/battle-assets-version.json') {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const body = JSON.stringify(battleAssetCache.refresh());
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }).end(body);
    } catch (error) {
      console.error('BATTLE_ASSET_VERSION', error);
      res.writeHead(500).end();
    }
    return;
  }
  const files = pathname === '/' ? [path.join(__dirname, 'index.html')]
    : pathname.startsWith('/ruffle/') ? [path.join(__dirname, 'node_modules/@ruffle-rs/ruffle', pathname.slice(8))]
    : ['overlay', 'assets'].map(root => path.join(__dirname, root, pathname));
  let file = files.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file && !pathname.startsWith('/ruffle/')) {
    try { file = await fetchAsset(pathname.slice(1)); }
    catch (error) { console.error(error.message); res.writeHead(502).end(); return; }
  }
  if (!file) { console.log('MISSING', pathname); res.writeHead(404).end(); return; }
  console.log('ASSET', pathname);
  let fd;
  try { fd = fs.openSync(file, 'r'); }
  catch (error) { console.error(error.message); res.writeHead(500).end(); return; }
  const stat = fs.fstatSync(fd, { bigint: true });
  // Uncached files still revalidate on every use, so a deployment is seen at once while unchanged files answer 304.
  const policy = battleAssetCache.cacheControl(pathname, stat, url.searchParams.get('__battle_v'));
  const etag = `"${stat.dev}-${stat.ino}-${stat.size}-${stat.mtimeNs}"`;
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', policy === 'no-store' ? 'no-cache' : policy);
  if ((req.headers['if-none-match'] || '').split(',').some(tag => tag.trim() === etag)) {
    fs.closeSync(fd);
    res.writeHead(304).end();
    return;
  }
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; connect-src 'self' ${origin.replace(/^http/, 'ws')}; img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none'`);
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  // pipeline closes the file when the client aborts a download; pipe() kept those descriptors open.
  pipeline(fs.createReadStream(file, { fd }), res, () => {});
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 * 1024 });
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/socket' || req.headers.origin !== origin) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
});
wss.on('connection', ws => {
  console.log('WS_CONNECTED');
  const tcp = net.connect({ host: '127.0.0.1', port: upstreamPort });
  tcp.on('data', bytes => { if (ws.readyState === 1) ws.send(bytes); });
  ws.on('message', bytes => tcp.write(bytes));
  ws.on('close', () => tcp.destroy());
  ws.on('error', () => tcp.destroy());
  tcp.on('close', () => ws.close());
  tcp.on('error', () => ws.close(1011));
});
server.listen(port, '127.0.0.1', () => console.log(`CLIENT_LAB ${origin}`));
