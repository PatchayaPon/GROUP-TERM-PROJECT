const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'portfolios.json');
const PORT = Number(process.env.PORT || 3000);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));

function readData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function writeData(data) {
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}
function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON format')); }
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
function validatePortfolio(p) {
  if (!validText(p.id, 200) || !validText(p.displayName, 80) ||
      !validText(p.whatIEnjoy, 1000) || !validText(p.whatIveTried, 1000) ||
      !validText(p.whatImCuriousAbout, 1000) || !Array.isArray(p.items)) return 'Invalid portfolio fields';
  const ids = new Set();
  for (const item of p.items) {
    const error = validateItem(item);
    if (error) return error;
    if (ids.has(item.id)) return 'Duplicate Portfolio Item ID';
    ids.add(item.id);
  }
  return null;
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'GET' && url.pathname === '/api/portfolios') return send(res, 200, readData());
    if (req.method === 'PUT' && url.pathname === '/api/portfolios') {
      try {
        const data = await readBody(req);
        if (!Array.isArray(data)) return send(res, 400, { error: 'Expected an array of portfolios' });
        const portfolioIds = new Set();
        for (const p of data) {
          const error = validatePortfolio(p);
          if (error) return send(res, 400, { error });
          if (portfolioIds.has(p.id)) return send(res, 400, { error: 'Duplicate Portfolio ID' });
          portfolioIds.add(p.id);
        }
        writeData(data);
        return send(res, 200, { success: true });
      } catch (error) { return send(res, 400, { error: error.message }); }
    }
    return send(res, 404, { error: 'API route not found' });
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
server.listen(PORT, '0.0.0.0', () => console.log(`Portfolio app running on port ${PORT}`));
