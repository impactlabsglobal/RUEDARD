const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'db.json');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';

function readDb() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) {
  const temp = DB_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DB_FILE);
}
function makeId(prefix) { return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }
function makeChallenge() { return crypto.randomBytes(32).toString('base64url'); }
function issueSession(db, user, provider) {
  db.sessions ||= [];
  const session = { id: makeId('SES'), userId: user.id, provider, verified: true, twoFactorVerified: provider === 'password' || provider === 'registration' || provider === 'passkey', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() };
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions.push({ ...session, token });
  return { token, user, session };
}
function createUser(db, profile) {
  db.users ||= []; db.wallets ||= [];
  let user = db.users.find(item => profile.email && item.email.toLowerCase() === profile.email.toLowerCase() && item.role === profile.role);
  if (!user) {
    user = { id: makeId('USR'), name: profile.name, email: profile.email || '', role: profile.role, verified: true, twoFactorEnabled: true };
    db.users.push(user);
    if (user.role === 'owner' || user.role === 'fleet') db.wallets.push({ userId: user.id, currency: 'USD', available: user.role === 'fleet' ? 8420 : 1260, pending: user.role === 'fleet' ? 2150 : 480, lifetime: user.role === 'fleet' ? 38870 : 6840, withdrawn: user.role === 'fleet' ? 28300 : 5100 });
  }
  return user;
}
function parseClientData(value) {
  try { return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); } catch { return null; }
}
function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1024 * 1024) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}
function has(data, fields) {
  return fields.every(field => {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], data);
    return value !== undefined && value !== null && value !== '';
  });
}
function authenticated(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = (db.sessions || []).find(item => item.token === token && new Date(item.expiresAt) > new Date());
  if (!session) return null;
  return { session, user: (db.users || []).find(item => item.id === session.userId) };
}
function serveFile(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(ROOT, relative);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return sendJson(res, 404, { error: 'Not found' });
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300' });
  fs.createReadStream(file).pipe(res);
}
async function api(req, res, pathname) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method === 'GET' && pathname === '/api/health') return sendJson(res, 200, { ok: true, service: 'RuedaRD MVP', payments: 'sandbox' });
  if (req.method === 'GET' && pathname === '/api/vehicles') return sendJson(res, 200, { vehicles: [] });
  if (req.method === 'POST' && pathname === '/api/auth/demo') {
    const data = await readBody(req);
    if (!has(data, ['provider', 'profile.name', 'profile.role'])) return sendJson(res, 422, { error: 'Provider, name, and role are required' });
    const db = readDb();
    const user = createUser(db, data.profile); const result = issueSession(db, user, data.provider); writeDb(db);
    return sendJson(res, 201, result);
  }
  if (req.method === 'POST' && pathname === '/api/auth/2fa/start') {
    const data = await readBody(req);
    if (!has(data, ['provider', 'profile.name', 'profile.email', 'profile.role'])) return sendJson(res, 422, { error: 'Profile information is required' });
    const db = readDb(); db.authChallenges ||= [];
    const record = { id: makeId('OTP'), type: 'two_factor', provider: data.provider, profile: data.profile, codeHash: crypto.createHash('sha256').update('246810').digest('hex'), expiresAt: new Date(Date.now() + 5 * 60000).toISOString(), attempts: 0 };
    db.authChallenges.push(record); writeDb(db);
    return sendJson(res, 201, { challengeId: record.id, expiresIn: 300, delivery: 'demo' });
  }
  if (req.method === 'POST' && pathname === '/api/auth/2fa/verify') {
    const data = await readBody(req); const db = readDb(); db.authChallenges ||= [];
    const record = db.authChallenges.find(item => item.id === data.challengeId && item.type === 'two_factor');
    if (!record || new Date(record.expiresAt) <= new Date()) return sendJson(res, 401, { error: 'Expired verification challenge' });
    record.attempts += 1;
    const valid = crypto.createHash('sha256').update(String(data.code || '')).digest('hex') === record.codeHash;
    if (!valid || record.attempts > 5) { writeDb(db); return sendJson(res, 401, { error: 'Invalid verification code' }); }
    const user = createUser(db, record.profile); const result = issueSession(db, user, record.provider); db.authChallenges = db.authChallenges.filter(item => item.id !== record.id); writeDb(db);
    return sendJson(res, 200, result);
  }
  if (req.method === 'POST' && pathname === '/api/auth/passkey/register/options') {
    const db = readDb(); const auth = authenticated(req, db); if (!auth) return sendJson(res, 401, { error: 'Authentication required' });
    db.authChallenges ||= []; const challenge = makeChallenge();
    db.authChallenges.push({ id: makeId('PKR'), type: 'passkey_register', userId: auth.user.id, challenge, expiresAt: new Date(Date.now() + 5 * 60000).toISOString() }); writeDb(db);
    return sendJson(res, 200, { challenge, user: { id: Buffer.from(auth.user.id).toString('base64url'), name: auth.user.email || auth.user.id, displayName: auth.user.name } });
  }
  if (req.method === 'POST' && pathname === '/api/auth/passkey/register/complete') {
    const data = await readBody(req); const db = readDb(); const auth = authenticated(req, db); if (!auth) return sendJson(res, 401, { error: 'Authentication required' });
    const client = parseClientData(data.clientDataJSON); const challenge = (db.authChallenges || []).find(item => item.type === 'passkey_register' && item.userId === auth.user.id && client && item.challenge === client.challenge && new Date(item.expiresAt) > new Date());
    if (!challenge || !data.credentialId) return sendJson(res, 401, { error: 'Invalid passkey challenge' });
    db.passkeys ||= []; db.passkeys = db.passkeys.filter(item => item.credentialId !== data.credentialId); db.passkeys.push({ id: makeId('KEY'), userId: auth.user.id, credentialId: data.credentialId, createdAt: new Date().toISOString(), verificationLevel: 'mvp-client-data' });
    db.authChallenges = db.authChallenges.filter(item => item.id !== challenge.id); writeDb(db); return sendJson(res, 201, { registered: true });
  }
  if (req.method === 'POST' && pathname === '/api/auth/passkey/options') {
    const db = readDb(); db.passkeys ||= []; db.authChallenges ||= []; const challenge = makeChallenge();
    db.authChallenges.push({ id: makeId('PKA'), type: 'passkey_auth', challenge, expiresAt: new Date(Date.now() + 5 * 60000).toISOString() }); writeDb(db);
    return sendJson(res, 200, { challenge, allowCredentials: db.passkeys.map(item => item.credentialId) });
  }
  if (req.method === 'POST' && pathname === '/api/auth/passkey/verify') {
    const data = await readBody(req); const db = readDb(); const passkey = (db.passkeys || []).find(item => item.credentialId === data.credentialId); const client = parseClientData(data.clientDataJSON);
    const challenge = (db.authChallenges || []).find(item => item.type === 'passkey_auth' && client && item.challenge === client.challenge && new Date(item.expiresAt) > new Date());
    if (!passkey || !challenge || !data.signature || !data.authenticatorData) return sendJson(res, 401, { error: 'Invalid passkey response' });
    const user = db.users.find(item => item.id === passkey.userId); if (!user) return sendJson(res, 404, { error: 'Passkey user not found' });
    const result = issueSession(db, user, 'passkey'); db.authChallenges = db.authChallenges.filter(item => item.id !== challenge.id); passkey.lastUsedAt = new Date().toISOString(); writeDb(db); return sendJson(res, 200, result);
  }
  if (req.method === 'GET' && pathname === '/api/session') {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const db = readDb(); const session = (db.sessions || []).find(item => item.token === token);
    if (!session || new Date(session.expiresAt) <= new Date()) return sendJson(res, 401, { error: 'Invalid or expired session' });
    const user = db.users.find(item => item.id === session.userId);
    return sendJson(res, 200, { user, session: { ...session, token: undefined } });
  }
  if (req.method === 'GET' && pathname === '/api/account') {
    const db = readDb(); const auth = authenticated(req, db);
    if (!auth) return sendJson(res, 401, { error: 'Authentication required' });
    const userId = auth.user.id;
    const reservations = (db.reservations || []).filter(item => !item.userId || item.userId === userId);
    const contracts = (db.contracts || []).filter(item => reservations.some(reservation => reservation.id === item.reservationId));
    const withdrawals = (db.withdrawals || []).filter(item => item.userId === userId);
    const wallet = (db.wallets || []).find(item => item.userId === userId) || { userId, currency: 'USD', available: 0, pending: 0, lifetime: 0, withdrawn: 0 };
    return sendJson(res, 200, { user: auth.user, wallet, reservations, contracts, withdrawals });
  }
  if (req.method === 'POST' && pathname === '/api/owner-applications') {
    const data = await readBody(req);
    if (!has(data, ['owner.name', 'owner.phone', 'vehicle.make', 'vehicle.model', 'insurance.insurer', 'insurance.policyNumber', 'insurance.expiresAt'])) return sendJson(res, 422, { error: 'Missing owner, vehicle, or insurance information' });
    const db = readDb();
    const record = { id: makeId('OWN'), createdAt: new Date().toISOString(), ...data };
    db.ownerApplications.push(record); writeDb(db);
    return sendJson(res, 201, { id: record.id, status: record.status });
  }
  if (req.method === 'POST' && pathname === '/api/reservations') {
    const data = await readBody(req);
    if (!has(data, ['reference', 'vehicleId', 'start', 'end', 'days', 'total']) || data.contractAccepted !== true) return sendJson(res, 422, { error: 'Reservation details and contract acceptance are required' });
    const db = readDb();
    const record = { id: makeId('RES'), createdAt: new Date().toISOString(), status: 'pending_owner_acceptance', paymentState: 'authorized_hold', ...data };
    db.reservations.push(record);
    db.contracts.push({ id: makeId('CTR'), reservationId: record.id, reference: record.reference, acceptedAt: record.createdAt, signedBy: data.signedBy || 'Verified renter', signatureType: 'electronic', version: 'mvp-v2', hiddenTermsAllowed: false });
    writeDb(db);
    return sendJson(res, 201, { id: record.id, status: record.status });
  }
  if (req.method === 'POST' && pathname === '/api/reservations/decision') {
    const data = await readBody(req);
    if (!has(data, ['reference', 'accepted'])) return sendJson(res, 422, { error: 'Reference and decision are required' });
    const db = readDb(); const reservation = (db.reservations || []).find(item => item.reference === data.reference);
    if (!reservation) return sendJson(res, 404, { error: 'Reservation not found' });
    reservation.ownerDecisionAt = new Date().toISOString(); reservation.ownerAccepted = data.accepted === true;
    if (data.accepted === true) {
      reservation.status = 'confirmed'; reservation.paymentState = 'captured_sandbox';
      reservation.accounting = { rentalCaptured: reservation.total, ownerPayable: Number(data.ownerAmount || 0), platformFee: Number(data.platformFee || 0), securityDeposit: Number(reservation.securityDeposit || 0), depositIncludedInRevenue: false };
    } else { reservation.status = 'rejected'; reservation.paymentState = 'authorization_voided'; reservation.depositState = 'released'; }
    writeDb(db); return sendJson(res, 200, { reference: reservation.reference, status: reservation.status, paymentState: reservation.paymentState });
  }
  if (req.method === 'POST' && pathname === '/api/withdrawals') {
    const data = await readBody(req);
    if (!has(data, ['userId', 'role', 'amount', 'method', 'destination']) || Number(data.amount) < 25) return sendJson(res, 422, { error: 'Valid withdrawal details are required' });
    const db = readDb(); db.withdrawals ||= []; db.wallets ||= [];
    let wallet = db.wallets.find(item => item.userId === data.userId);
    if (!wallet) { wallet = { userId: data.userId, currency: 'USD', available: 0, pending: 0, lifetime: 0, withdrawn: 0 }; db.wallets.push(wallet); }
    if (Number(data.amount) > Number(wallet.available || 0) && data.userId !== 'demo') return sendJson(res, 409, { error: 'Insufficient available balance' });
    if (data.userId !== 'demo') { wallet.available -= Number(data.amount); wallet.withdrawn += Number(data.amount); }
    const record = { id: makeId('WDR'), userId: data.userId, role: data.role, amount: Number(data.amount), currency: 'USD', method: data.method, destinationMasked: String(data.destination).slice(-4).padStart(8, '*'), status: 'pending_review', requestedAt: new Date().toISOString() };
    db.withdrawals.push(record); writeDb(db);
    return sendJson(res, 201, record);
  }
  return sendJson(res, 404, { error: 'API route not found' });
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) await api(req, res, pathname); else serveFile(req, res);
  } catch (error) { sendJson(res, error.message === 'Body too large' ? 413 : 500, { error: error.message }); }
});
server.listen(PORT, HOST, () => console.log(`RuedaRD MVP running at http://${HOST}:${PORT}`));
