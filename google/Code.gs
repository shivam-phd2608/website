/**
 * =====================================================================================
 * TriBloom Farms · dashboard backend (Google Apps Script + Google Sheets)
 * -------------------------------------------------------------------------------------
 * The Google Sheet this script is attached to IS the database. Every kind of record
 * gets its own tab (Harvest, Packing, Sales, Expenses ...). One row = one record.
 * The dashboard (app.tribloom.in) talks to this script over the internet.
 *
 * First-time setup (details in the README):
 *   1. Change FIRST_PASSWORD below to a strong password.
 *   2. Choose the function "setupTriBloom" in the toolbar and click Run (allow access).
 *   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *
 * You can open, filter and correct data directly in the tabs. Grey rows 1–2 are
 * headers: please don't edit them. Tabs starting with "_" are private (logins).
 * =====================================================================================
 */

const CONFIG = {
  ADMIN_EMAIL: 'shivam.phd@gmail.com',
  ADMIN_NAME: 'Shivam Sharma',
  FIRST_PASSWORD: 'Change-This-Password-1', // used only by setupTriBloom(); change it before running
  SESSION_DAYS: 30,
  MAX_FAILED_LOGINS: 5, // then the email is locked for 15 minutes
};

/** Record types the dashboard may store, and the tab name each one uses. */
const TABS = {
  settings: 'Settings',
  users: 'Team',
  partners: 'Partners',
  polyhouses: 'Polyhouses',
  varieties: 'Varieties',
  farms: 'Farms & packhouses',
  auctionCentres: 'Markets',
  stemLengthCategories: 'Stem lengths',
  bunchSizes: 'Bunch sizes',
  buyers: 'Buyers',
  harvestBatches: 'Harvest',
  dispatch1Records: 'To packhouse',
  gradings: 'Grading',
  packingBatches: 'Packing',
  dispatch2Records: 'To market',
  auctionRealizations: 'Sales',
  expenses: 'Expenses',
  contributions: 'Capital in',
  commitments: 'Commitments',
  reimbursements: 'Reimbursements',
  auditLogs: 'Activity log',
  harvests: 'Old harvests',
  dispatches: 'Old dispatches',
  sales: 'Old invoices',
  payments: 'Old payments',
};
const ADMIN_ONLY = { users: true, settings: true };
const AUTH_TAB = '_logins';
const SESSIONS_TAB = '_sessions';
const DELETED_TAB = '_deleted';
const FIXED_COLS = ['id', 'updated_at', 'updated_by'];

// ------------------------------------------------------------------------------------
// Setup (run once from the editor)
// ------------------------------------------------------------------------------------

function setupTriBloom() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (c) { collectionSheet_(c); });
  privateSheet_(AUTH_TAB, ['email', 'salt', 'hash', 'updated_at']);
  privateSheet_(SESSIONS_TAB, ['token_hash', 'email', 'created_at', 'expires_at']);
  privateSheet_(DELETED_TAB, ['collection', 'id', 'deleted_at', 'deleted_by']);

  const email = normEmail_(CONFIG.ADMIN_EMAIL);
  const existing = readCollection_('users').filter(function (u) { return normEmail_(u.email) === email; });
  if (existing.length === 0) {
    writeRecords_('users', [{
      id: 'usr-admin',
      email: email,
      fullName: CONFIG.ADMIN_NAME,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    }], 'setup');
  }
  if (!findAuth_(email)) {
    checkFirstPassword_();
    setPasswordFor_(email, CONFIG.FIRST_PASSWORD);
  }
  // Tidy the default empty tab Google creates
  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  return 'TriBloom is ready. Admin login: ' + email;
}

/**
 * Forgot the admin password? Put a new one in FIRST_PASSWORD at the top, choose
 * "resetAdminPassword" in the toolbar and click Run. Then sign in with it.
 */
function resetAdminPassword() {
  checkFirstPassword_();
  const email = normEmail_(CONFIG.ADMIN_EMAIL);
  setPasswordFor_(email, CONFIG.FIRST_PASSWORD);
  CacheService.getScriptCache().remove('fail:' + email);
  const msg = 'Admin password reset for ' + email + '. Sign in with the FIRST_PASSWORD value.';
  Logger.log(msg);
  return msg;
}

function checkFirstPassword_() {
  const p = CONFIG.FIRST_PASSWORD || '';
  if (p.length < 8 || p === 'Change-This-Password-1') {
    throw new Error('First change FIRST_PASSWORD at the top of the script to your own password (8+ characters), then press Save and Run again.');
  }
}

// ------------------------------------------------------------------------------------
// Web endpoints
// ------------------------------------------------------------------------------------

function doGet() {
  return json_({ ok: true, app: 'TriBloom dashboard API', time: new Date().toISOString() });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Bad request' });
  }
  try {
    if (req.action === 'login') return json_(login_(req.email, req.password));

    const me = authenticate_(req.token);
    if (!me) return json_({ ok: false, error: 'SESSION_EXPIRED' });

    switch (req.action) {
      case 'me':
        return json_({ ok: true, user: me });
      case 'load':
        return json_(loadAll_());
      case 'changes':
        return json_(changesSince_(req.since));
      case 'save':
        return json_(save_(me, req.upserts || [], req.deletes || []));
      case 'logout':
        endSession_(req.token);
        return json_({ ok: true });
      case 'changePassword':
        return json_(changePassword_(me, req.current, req.next));
      case 'setPassword':
        if (me.role !== 'admin') return json_({ ok: false, error: 'Only an admin can set passwords for others.' });
        if (!req.password || String(req.password).length < 8) return json_({ ok: false, error: 'Use at least 8 characters.' });
        setPasswordFor_(normEmail_(req.email), String(req.password));
        endAllSessionsFor_(normEmail_(req.email));
        return json_({ ok: true });
      default:
        return json_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------------------------
// Logins and sessions
// ------------------------------------------------------------------------------------

function login_(email, password) {
  email = normEmail_(email);
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  const cache = CacheService.getScriptCache();
  const failKey = 'fail:' + email;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= CONFIG.MAX_FAILED_LOGINS) return { ok: false, error: 'Too many wrong attempts. Try again in 15 minutes.' };

  const auth = findAuth_(email);
  const profile = findProfile_(email);
  if (!auth || hash_(auth.salt, String(password)) !== auth.hash) {
    cache.put(failKey, String(fails + 1), 15 * 60);
    return { ok: false, error: 'Wrong email or password.' };
  }
  if (!profile) return { ok: false, error: 'Your login works, but you are not on the TriBloom team list. Ask the admin to add you.' };
  if (profile.isActive === false) return { ok: false, error: 'This account has been switched off. Please contact the admin.' };

  cache.remove(failKey);
  const token = Utilities.getUuid() + Utilities.getUuid();
  const now = new Date();
  const expires = new Date(now.getTime() + CONFIG.SESSION_DAYS * 86400000);
  appendPrivate_(SESSIONS_TAB, [sha_(token), email, now.toISOString(), expires.toISOString()]);
  return { ok: true, token: token, user: profile };
}

/** Returns the signed-in team member's profile, or null. */
function authenticate_(token) {
  if (!token) return null;
  const th = sha_(String(token));
  const cache = CacheService.getScriptCache();
  let email = cache.get('s:' + th);
  if (!email) {
    const rows = privateRows_(SESSIONS_TAB);
    const now = new Date().toISOString();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === th && String(rows[i][3]) > now) { email = rows[i][1]; break; }
    }
    if (!email) return null;
    cache.put('s:' + th, email, 600);
  }
  const profile = findProfile_(email);
  if (!profile || profile.isActive === false) return null;
  return profile;
}

function endSession_(token) {
  const th = sha_(String(token || ''));
  CacheService.getScriptCache().remove('s:' + th);
  deletePrivateWhere_(SESSIONS_TAB, function (r) { return r[0] === th || String(r[3]) < new Date().toISOString(); });
}

function endAllSessionsFor_(email) {
  const rows = privateRows_(SESSIONS_TAB);
  const cache = CacheService.getScriptCache();
  rows.forEach(function (r) { if (r[1] === email) cache.remove('s:' + r[0]); });
  deletePrivateWhere_(SESSIONS_TAB, function (r) { return r[1] === email; });
}

function changePassword_(me, current, next) {
  const email = normEmail_(me.email);
  const auth = findAuth_(email);
  if (!auth || hash_(auth.salt, String(current || '')) !== auth.hash) return { ok: false, error: 'Your current password is not correct.' };
  if (!next || String(next).length < 8) return { ok: false, error: 'Use at least 8 characters for the new password.' };
  setPasswordFor_(email, String(next));
  return { ok: true };
}

function setPasswordFor_(email, password) {
  const salt = Utilities.getUuid();
  const hash = hash_(salt, password);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    deletePrivateWhere_(AUTH_TAB, function (r) { return r[0] === email; });
    appendPrivate_(AUTH_TAB, [email, salt, hash, new Date().toISOString()]);
  } finally {
    lock.releaseLock();
  }
}

function findAuth_(email) {
  const rows = privateRows_(AUTH_TAB);
  for (let i = 0; i < rows.length; i++) if (rows[i][0] === email) return { salt: rows[i][1], hash: rows[i][2] };
  return null;
}

function findProfile_(email) {
  email = normEmail_(email);
  const users = readCollection_('users');
  for (let i = 0; i < users.length; i++) if (normEmail_(users[i].email) === email) return users[i];
  return null;
}

function normEmail_(e) {
  return String(e || '').trim().toLowerCase();
}

function sha_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/** Salted, repeated SHA-256 so stored passwords cannot simply be read back. */
function hash_(salt, password) {
  let h = sha_(salt + ':' + password);
  for (let i = 0; i < 500; i++) h = sha_(salt + h);
  return h;
}

// ------------------------------------------------------------------------------------
// Reading and writing records
// ------------------------------------------------------------------------------------

function loadAll_() {
  const records = [];
  Object.keys(TABS).forEach(function (c) {
    readCollection_(c).forEach(function (data) { records.push({ collection: c, id: String(data.id), data: data }); });
  });
  return { ok: true, records: records, serverTime: new Date().toISOString() };
}

/** Everything changed after `since` (ISO time), for live updates between devices. */
function changesSince_(since) {
  const serverTime = new Date().toISOString();
  since = String(since || '');
  const props = PropertiesService.getScriptProperties().getProperties();
  const rows = [];
  Object.keys(TABS).forEach(function (c) {
    const last = props['changed:' + c] || '';
    if (!since || last > since) {
      readCollectionWithMeta_(c).forEach(function (r) {
        if (!since || r.updatedAt > since) rows.push({ collection: c, id: String(r.data.id), data: r.data });
      });
    }
  });
  const deleted = [];
  if (!since || (props['changed:_deleted'] || '') > since) {
    privateRows_(DELETED_TAB).forEach(function (r) {
      if (!since || String(r[2]) > since) deleted.push({ collection: r[0], id: String(r[1]) });
    });
  }
  return { ok: true, rows: rows, deleted: deleted, serverTime: serverTime };
}

function save_(me, upserts, deletes) {
  if (me.role === 'viewer') return { ok: false, error: 'Viewers cannot make changes.' };
  const byCol = {};
  upserts.forEach(function (u) {
    if (!TABS[u.collection]) throw new Error('Unknown record type: ' + u.collection);
    if (ADMIN_ONLY[u.collection] && me.role !== 'admin') throw new Error('Only an admin can change ' + TABS[u.collection] + '.');
    if (!u.data || u.id === undefined || u.id === null) throw new Error('Record without id');
    u.data.id = u.collection === 'settings' ? 'main' : String(u.id);
    (byCol[u.collection] = byCol[u.collection] || []).push(u.data);
  });
  deletes.forEach(function (d) {
    if (!TABS[d.collection]) throw new Error('Unknown record type: ' + d.collection);
    if (ADMIN_ONLY[d.collection] && me.role !== 'admin') throw new Error('Only an admin can change ' + TABS[d.collection] + '.');
  });

  const who = me.fullName || me.email;
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    Object.keys(byCol).forEach(function (c) { writeRecords_(c, byCol[c], who); });
    if (deletes.length) {
      const now = new Date().toISOString();
      const byColDel = {};
      deletes.forEach(function (d) { (byColDel[d.collection] = byColDel[d.collection] || {})[String(d.id)] = true; });
      Object.keys(byColDel).forEach(function (c) {
        const sh = collectionSheet_(c);
        const last = sh.getLastRow();
        if (last < 3) return;
        const ids = sh.getRange(3, 1, last - 2, 1).getValues();
        for (let i = ids.length - 1; i >= 0; i--) {
          if (byColDel[c][String(ids[i][0])]) sh.deleteRow(i + 3);
        }
        Object.keys(byColDel[c]).forEach(function (id) { appendPrivate_(DELETED_TAB, [c, id, now, who]); });
      });
      PropertiesService.getScriptProperties().setProperty('changed:_deleted', now);
    }
  } finally {
    lock.releaseLock();
  }
  return { ok: true, serverTime: new Date().toISOString() };
}

// ------------------------------------------------------------------------------------
// Sheet layout: row 1 = field names, row 2 (hidden) = field types, data from row 3.
// All cells are stored as plain text so Google Sheets never changes dates or numbers.
// ------------------------------------------------------------------------------------

function collectionSheet_(collection) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = TABS[collection];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // Plain-text cells everywhere, so Google never turns "2026-11-18" or "007" into something else
    sh.getRange(1, 1, sh.getMaxRows(), 40).setNumberFormat('@');
    const head = sh.getRange(1, 1, 2, FIXED_COLS.length);
    head.setNumberFormat('@');
    head.setValues([FIXED_COLS, ['string', 'string', 'string']]);
    sh.setFrozenRows(1);
    sh.hideRows(2);
    sh.getRange(1, 1, 1, FIXED_COLS.length).setFontWeight('bold').setBackground('#e8f0e6');
  }
  return sh;
}

function privateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function headerInfo_(sh) {
  const width = Math.max(sh.getLastColumn(), FIXED_COLS.length);
  const rows = sh.getRange(1, 1, 2, width).getValues();
  return { names: rows[0].map(String), types: rows[1].map(String) };
}

function typeOf_(v) {
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'string') return 'string';
  return 'json';
}

function encode_(v, type) {
  if (v === undefined || v === null) return '';
  if (type === 'json') return JSON.stringify(v);
  if (type === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function decode_(cell, type) {
  if (cell === '' || cell === null || cell === undefined) return undefined;
  if (Object.prototype.toString.call(cell) === '[object Date]') {
    // A date typed by hand into a cell that Google turned into a date
    const d = cell;
    const iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return iso;
  }
  const s = String(cell);
  if (type === 'number') {
    const n = Number(s);
    return isNaN(n) ? s : n;
  }
  if (type === 'boolean') return s.toLowerCase() === 'true';
  if (type === 'json') {
    try { return JSON.parse(s); } catch (e) { return s; }
  }
  return s;
}

function rowToRecord_(row, names, types) {
  const data = {};
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (!name || name === 'updated_at' || name === 'updated_by') continue;
    const v = name === 'id' ? String(row[i]) : decode_(row[i], types[i]);
    if (v !== undefined) data[name] = v;
  }
  return data;
}

function readCollection_(collection) {
  return readCollectionWithMeta_(collection).map(function (r) { return r.data; });
}

function readCollectionWithMeta_(collection) {
  const sh = collectionSheet_(collection);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const h = headerInfo_(sh);
  const values = sh.getRange(3, 1, last - 2, h.names.length).getValues();
  const iUpd = h.names.indexOf('updated_at');
  const out = [];
  values.forEach(function (row) {
    if (row[0] === '' || row[0] === null) return;
    out.push({ data: rowToRecord_(row, h.names, h.types), updatedAt: String(row[iUpd] || '') });
  });
  return out;
}

/** Insert or update records (matched by id). Adds new columns for new fields. */
function writeRecords_(collection, records, who) {
  const sh = collectionSheet_(collection);
  const h = headerInfo_(sh);
  const names = h.names.slice();
  const types = h.types.slice();

  // New fields → new columns; a field whose type changes becomes a JSON column
  records.forEach(function (rec) {
    Object.keys(rec).forEach(function (k) {
      if (FIXED_COLS.indexOf(k) !== -1 || rec[k] === undefined || rec[k] === null || rec[k] === '') return;
      const t = typeOf_(rec[k]);
      const i = names.indexOf(k);
      if (i === -1) {
        names.push(k);
        types.push(t);
      } else if (types[i] !== t && types[i] !== 'json') {
        types[i] = 'json';
      }
    });
  });
  if (names.length !== h.names.length || types.join() !== h.types.join()) {
    const head = sh.getRange(1, 1, 2, names.length);
    head.setNumberFormat('@');
    head.setValues([names, types]);
    sh.getRange(1, 1, 1, names.length).setFontWeight('bold').setBackground('#e8f0e6');
  }

  const last = sh.getLastRow();
  const idRows = {};
  if (last >= 3) {
    sh.getRange(3, 1, last - 2, 1).getValues().forEach(function (r, i) { idRows[String(r[0])] = i + 3; });
  }

  const now = new Date().toISOString();
  const toRow = function (rec) {
    return names.map(function (n, i) {
      if (n === 'id') return String(rec.id);
      if (n === 'updated_at') return now;
      if (n === 'updated_by') return who || '';
      return encode_(rec[n], types[i]);
    });
  };

  const appends = [];
  records.forEach(function (rec) {
    const r = idRows[String(rec.id)];
    if (r) {
      const range = sh.getRange(r, 1, 1, names.length);
      range.setNumberFormat('@');
      range.setValues([toRow(rec)]);
    } else {
      appends.push(toRow(rec));
    }
  });
  if (appends.length) {
    const start = Math.max(sh.getLastRow(), 2) + 1;
    const range = sh.getRange(start, 1, appends.length, names.length);
    range.setNumberFormat('@');
    range.setValues(appends);
  }
  PropertiesService.getScriptProperties().setProperty('changed:' + collection, now);
}

function privateRows_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().map(function (r) { return r.map(String); });
}

function appendPrivate_(name, row) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const range = sh.getRange(sh.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row.map(String)]);
}

function deletePrivateWhere_(name, test) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  for (let i = rows.length - 1; i >= 0; i--) if (test(rows[i].map(String))) sh.deleteRow(i + 2);
}

// ------------------------------------------------------------------------------------
// Hand edits in the Sheet: stamp the row so open dashboards pick up the change.
// ------------------------------------------------------------------------------------

function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    const name = sh.getName();
    const collection = Object.keys(TABS).filter(function (c) { return TABS[c] === name; })[0];
    if (!collection || e.range.getRow() < 3) return;
    const now = new Date().toISOString();
    for (let r = e.range.getRow(); r < e.range.getRow() + e.range.getNumRows(); r++) {
      const cells = sh.getRange(r, 2, 1, 2);
      cells.setNumberFormat('@');
      cells.setValues([[now, 'edited in Sheet']]);
    }
    PropertiesService.getScriptProperties().setProperty('changed:' + collection, now);
  } catch (err) {
    // never block a hand edit
  }
}
