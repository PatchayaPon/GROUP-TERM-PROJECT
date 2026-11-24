const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 4100 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-test-'));
let child;

function start() {
  child = spawn('node', [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir }, stdio: 'ignore'
  });
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 50; i++) {
      try { await fetch(BASE + '/'); return resolve(); } catch { await new Promise(r => setTimeout(r, 100)); }
    }
    reject(new Error('server did not start'));
  });
}
function stop() { return new Promise(r => { child.once('exit', r); child.kill(); }); }
const post = (url, body) => fetch(BASE + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const item = (id, extra = {}) => ({
  id, title: 'T', type: 'Challenge', date: '2026-11-24', role: 'Participant', description: 'D', skills: ['s'],
  reflection: { whatIDid: 'a', whatILearned: 'b', challenge: 'c', nextStep: 'd' },
  evidence: ['https://example.com'], challengeId: 'CH-001', hostGroup: 'G', category: 'mix', schemaVersion: '1.0', ...extra
});
let pid;

before(async () => {
  await start();
  const res = await post('/api/portfolios', { displayName: 'A', whatIEnjoy: 'x', whatIveTried: 'y', whatImCuriousAbout: 'z' });
  pid = (await res.json()).id;
});
after(async () => { await stop(); fs.rmSync(dataDir, { recursive: true, force: true }); });

test('valid item is saved (201)', async () => {
  assert.strictEqual((await post(`/api/portfolios/${pid}/items`, item('ok-1'))).status, 201);
});
test('server rejects invalid input (400)', async () => {
  const bad = [
    item('b1', { date: '2026-13-45' }), item('b2', { skills: [] }), item('b3', { evidence: ['not-a-url'] }),
    item('b4', { evidence: [] }), item('b5', { category: 'other' }), item('b6', { reflection: { whatIDid: 'a' } }),
    item('b7', { title: 123 })
  ];
  for (const b of bad) assert.strictEqual((await post(`/api/portfolios/${pid}/items`, b)).status, 400, b.id);
  assert.strictEqual((await post(`/api/portfolios/${pid}/items`, '{bad json')).status, 400);
  assert.strictEqual((await post(`/api/portfolios/${pid}/items`, 'null')).status, 400);
});
test('duplicate item ID is rejected (409)', async () => {
  assert.strictEqual((await post(`/api/portfolios/${pid}/items`, item('ok-1'))).status, 409);
});
test('unknown fields are not stored', async () => {
  await post(`/api/portfolios/${pid}/items`, item('clean-1', { evil: 'x' }));
  const list = await (await fetch(BASE + '/api/portfolios')).json();
  assert.ok(!('evil' in list[0].items.find(i => i.id === 'clean-1')));
});
test('data file and source files cannot be opened by URL', async () => {
  for (const u of ['/data/portfolios.json', '/server.js', '/package.json', '/.git/config', '/%2e%2e/server.js']) {
    const res = await fetch(BASE + u);
    assert.notStrictEqual(res.status, 200, u);
  }
});
test('malformed URL does not crash the server', async () => {
  await fetch(BASE + '/%E0%A4%A').catch(() => {});
  assert.strictEqual((await fetch(BASE + '/')).status, 200);
});
test('simultaneous saves do not overwrite each other', async () => {
  await Promise.all(Array.from({ length: 10 }, (_, i) => post(`/api/portfolios/${pid}/items`, item('c-' + i))));
  const list = await (await fetch(BASE + '/api/portfolios')).json();
  const ids = list[0].items.map(i => i.id);
  for (let i = 0; i < 10; i++) assert.ok(ids.includes('c-' + i), 'missing c-' + i);
});
test('data persists after server restart', async () => {
  const before = await (await fetch(BASE + '/api/portfolios')).json();
  await stop(); await start();
  const after = await (await fetch(BASE + '/api/portfolios')).json();
  assert.deepStrictEqual(after, before);
});
