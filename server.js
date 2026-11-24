const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'portfolios.json');
const PORT = Number(process.env.PORT || 3000);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));

function readData() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(data)) throw new Error('Data file is corrupted');
  return data;
}
function writeData(data) {
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}
function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(fail(413, 'Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(fail(400, 'Invalid JSON format')); }
    });
    req.on('error', reject);
  });
}
function validText(v, max=2000) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}
function validateItem(item) {
  const requiredStrings = ['id','title','type','date','role','description'];
  for (const key of requiredStrings) {
    if (!validText(item[key], key === 'description' ? 5000 : 1000)) return `Invalid ${key}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return 'Date must use YYYY-MM-DD';
  if (!Array.isArray(item.skills) || item.skills.length < 1 ||
      !item.skills.every(s => validText(s, 100))) return 'Skills must be a non-empty string array';
  if (!item.reflection || typeof item.reflection !== 'object') return 'Reflection is required';
  for (const key of ['whatIDid','whatILearned','challenge','nextStep']) {
    if (!validText(item.reflection[key], 5000)) return `Invalid reflection.${key}`;
  }
  if (!Array.isArray(item.evidence) || item.evidence.length < 1 ||
      !item.evidence.every(url => {
        if (typeof url !== 'string') return false;
        try { const u = new URL(url); return ['http:','https:'].includes(u.protocol); }
        catch { return false; }
      })) return 'Evidence must contain at least one valid URL';
  for (const key of ['challengeId','hostGroup','category','schemaVersion']) {
    if (item[key] !== undefined && typeof item[key] !== 'string') return `${key} must be a string`;
  }
  if (item.category !== undefined && !['discover','mix','levelup'].includes(item.category)) return 'Invalid category';
  return null;
}
function validateProfile(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'Invalid portfolio';
  if (!validText(p.displayName, 80) || !validText(p.whatIEnjoy, 1000) ||
      !validText(p.whatIveTried, 1000) || !validText(p.whatImCuriousAbout, 1000)) return 'Invalid portfolio fields';
  return null;
}
function profileFields(p) {
  return {
    displayName: p.displayName.trim(), whatIEnjoy: p.whatIEnjoy.trim(),
    whatIveTried: p.whatIveTried.trim(), whatImCuriousAbout: p.whatImCuriousAbout.trim()
  };
}
function fail(status, message) {
  const e = new Error(message); e.status = status; return e;
}
// Each write reads the latest file, changes one thing and saves it in one synchronous step,
// so simultaneous requests from different browsers cannot overwrite each other.
async function handleApi(req, res, url) {
  const m = url.pathname.match(/^\/api\/portfolios(?:\/([^/]+))?(?:\/items(?:\/([^/]+))?)?$/);
  if (!m) throw fail(404, 'API route not found');
  let pid, iid;
  try { pid = m[1] && decodeURIComponent(m[1]); iid = m[2] && decodeURIComponent(m[2]); }
  catch { throw fail(400, 'Bad request'); }
  const isItems = url.pathname.includes('/items');
  const find = list => {
    const p = list.find(x => x.id === pid);
    if (!p) throw fail(404, 'Portfolio not found');
    return p;
  };

  if (req.method === 'GET' && !pid) return send(res, 200, readData());

  if (req.method === 'POST' && !pid) {
    const body = await readBody(req);
    const error = validateProfile(body);
    if (error) throw fail(400, error);
    const list = readData();
    const portfolio = { id: crypto.randomUUID(), ...profileFields(body), items: [] };
    list.push(portfolio); writeData(list);
    return send(res, 201, portfolio);
  }
  if (req.method === 'PUT' && pid && !isItems) {
    const body = await readBody(req);
    const error = validateProfile(body);
    if (error) throw fail(400, error);
    const list = readData(); const p = find(list);
    Object.assign(p, profileFields(body)); writeData(list);
    return send(res, 200, p);
  }
  if (req.method === 'DELETE' && pid && !isItems) {
    const list = readData(); find(list);
    writeData(list.filter(x => x.id !== pid));
    return send(res, 200, { success: true });
  }
  if (req.method === 'POST' && pid && isItems && !iid) {
    const item = await readBody(req);
    const error = validateItem(item);
    if (error) throw fail(400, error);
    const list = readData(); const p = find(list);
    if (p.items.some(x => x.id === item.id)) throw fail(409, 'This Item ID already exists in the selected Portfolio');
    p.items.push(item); writeData(list);
    return send(res, 201, item);
  }
  if (req.method === 'DELETE' && pid && isItems && iid) {
    const list = readData(); const p = find(list);
    if (!p.items.some(x => x.id === iid)) throw fail(404, 'Item not found');
    p.items = p.items.filter(x => x.id !== iid); writeData(list);
    return send(res, 200, { success: true });
  }
  throw fail(405, 'Method not allowed');
}
const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); }
  catch { return send(res, 400, 'Bad request', 'text/plain; charset=utf-8'); }
  if (url.pathname.startsWith('/api/')) {
    try { return await handleApi(req, res, url); }
    catch (error) {
      const status = error.status || 500;
      return send(res, status, { error: status === 500 ? 'Server error' : error.message });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
  }
  let requested = url.pathname;
  if (requested === '/') requested = '/index.html';
  const filePath = path.resolve(PUBLIC_DIR, '.' + requested);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  }
  fs.readFile(filePath, (error, content) => {
    if (error) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
      '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
      '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
    send(res, 200, content, types[ext] || 'application/octet-stream');
  });
});
server.on('clientError', (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));
process.on('uncaughtException', err => console.error('Unexpected error:', err));
server.listen(PORT, '0.0.0.0', () => console.log(`Portfolio app running on port ${PORT}`));
