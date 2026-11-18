// ========================================================================================
// TriBloom cloud sync (Google Sheets via Google Apps Script)
// ----------------------------------------------------------------------------------------
// The dashboard keeps working with in-memory arrays (harvest batches, expenses ...).
// This module sends only the records that were added, changed or removed to the
// TriBloom Apps Script web app, which stores them in the Google Sheet. Changes made on
// other devices (or typed directly into the Sheet) are fetched every 20 seconds.
//
// When NEXT_PUBLIC_API_URL is not set, the app runs in "demo mode" and keeps data in
// this browser only (localStorage).
// ========================================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const isCloudMode = Boolean(API_URL);

const TOKEN_KEY = "tribloom_session";
const POLL_MS = 20000;

/** Collections stored as arrays of records with an `id` field. */
export const ARRAY_COLLECTIONS = [
  "users",
  "partners",
  "varieties",
  "polyhouses",
  "buyers",
  "farms",
  "auctionCentres",
  "stemLengthCategories",
  "bunchSizes",
  "harvestBatches",
  "dispatch1Records",
  "gradings",
  "packingBatches",
  "dispatch2Records",
  "auctionRealizations",
  "auditLogs",
  "expenses",
  "contributions",
  "commitments",
  "reimbursements",
  "harvests",
  "dispatches",
  "sales",
  "payments",
] as const;

/** Collections stored as a single object (one row with id "main"). */
export const OBJECT_COLLECTIONS = ["settings"] as const;

const isArrayCollection = (c: string) => (ARRAY_COLLECTIONS as readonly string[]).includes(c);
const isObjectCollection = (c: string) => (OBJECT_COLLECTIONS as readonly string[]).includes(c);
export const isSyncedCollection = (c: string) => isArrayCollection(c) || isObjectCollection(c);

export interface FarmRecordRow {
  collection: string;
  id: string;
  data: Record<string, unknown>;
}

// ----------------------------------------------------------------------------------------
// Session token (kept in this browser so people stay signed in)
// ----------------------------------------------------------------------------------------

function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function setToken(t: string) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private window: stays signed in only for this tab
  }
}
export const hasSavedSession = () => Boolean(getToken());

let expiredHandler: (() => void) | null = null;
export function onSessionExpired(fn: () => void) {
  expiredHandler = fn;
}

// ----------------------------------------------------------------------------------------
// Calling the Apps Script web app
// ----------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  if (!isCloudMode) throw new Error("Not connected to the cloud.");
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      // text/plain avoids a CORS pre-flight request, which Apps Script cannot answer
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: getToken(), ...payload }),
      redirect: "follow",
    });
  } catch {
    throw new Error("No internet connection, or the TriBloom server could not be reached.");
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("The TriBloom server sent an unexpected reply. Check the web app is deployed with access 'Anyone'.");
  }
  if (!json.ok) {
    if (json.error === "SESSION_EXPIRED") {
      setToken("");
      expiredHandler?.();
      throw new Error("Your session has ended. Please sign in again.");
    }
    throw new Error(json.error || "Something went wrong.");
  }
  return json;
}

export async function apiLogin(email: string, password: string) {
  const r = await call("login", { email, password });
  setToken(r.token);
  return r.user as Record<string, unknown>;
}

export async function apiMe() {
  const r = await call("me");
  return r.user as Record<string, unknown>;
}

export async function apiLogout() {
  try {
    await call("logout");
  } catch {
    // already signed out
  }
  setToken("");
  stopPolling();
  resetKnown();
}

export async function apiChangePassword(current: string, next: string) {
  await call("changePassword", { current, next });
}

/** Admin only: set or reset another team member's password. */
export async function apiSetPassword(email: string, password: string) {
  await call("setPassword", { email, password });
}

// ----------------------------------------------------------------------------------------
// What the server already has: collection -> id -> normalised JSON
// ----------------------------------------------------------------------------------------

/** Empty values are not stored in the Sheet, so ignore them when comparing. */
function norm(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) return JSON.stringify(data);
  const out: Record<string, unknown> = {};
  Object.keys(data as Record<string, unknown>)
    .sort()
    .forEach((k) => {
      const v = (data as Record<string, unknown>)[k];
      if (v === undefined || v === null || v === "") return;
      out[k] = typeof v === "number" || typeof v === "boolean" || typeof v === "string" ? v : JSON.parse(JSON.stringify(v));
    });
  return JSON.stringify(out);
}

const known = new Map<string, Map<string, string>>();
function knownFor(collection: string) {
  let m = known.get(collection);
  if (!m) {
    m = new Map();
    known.set(collection, m);
  }
  return m;
}
export function markKnown(collection: string, id: string, data: unknown | null) {
  const m = knownFor(collection);
  if (data === null) m.delete(id);
  else m.set(id, norm(data));
}
export function resetKnown() {
  known.clear();
}

/** Never send passwords to the database. */
function cleanForServer(collection: string, data: Record<string, unknown>) {
  if (collection === "users") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = data;
    return { ...rest, email: String(rest.email || "").trim().toLowerCase() };
  }
  if (collection === "settings") return { ...data, id: "main" };
  return data;
}

let lastServerTime = "";

function groupRows(rows: FarmRecordRow[]) {
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    if (isObjectCollection(r.collection)) out[r.collection] = r.data;
    else {
      const arr = (out[r.collection] as unknown[]) || [];
      arr.push(r.data);
      out[r.collection] = arr;
    }
  }
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (Array.isArray(v)) {
      const key = (x: unknown) => String((x as { createdAt?: string; timestamp?: string }).createdAt || (x as { timestamp?: string }).timestamp || "");
      v.sort((a, b) => (k === "auditLogs" ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))));
    }
  }
  return out;
}

/** Load every record from the Sheet. */
export async function loadAllRecords(): Promise<Record<string, unknown>> {
  const r = await call("load");
  resetKnown();
  const rows = (r.records || []) as FarmRecordRow[];
  rows.forEach((row) => markKnown(row.collection, row.id, row.data));
  lastServerTime = r.serverTime || new Date().toISOString();
  return groupRows(rows);
}

// ----------------------------------------------------------------------------------------
// Save status for the header badge
// ----------------------------------------------------------------------------------------

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "offline";
type StatusListener = (s: SyncStatus, message?: string) => void;
const listeners = new Set<StatusListener>();
export function onSyncStatus(fn: StatusListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit(s: SyncStatus, message?: string) {
  listeners.forEach((fn) => fn(s, message));
}

// Saves run one after another, in the order they were made
let queue: Promise<void> = Promise.resolve();
let pending = 0;

/** Send only the records that changed since the server last saw them. */
export function pushChanges(updated: Record<string, unknown>): Promise<void> {
  if (!isCloudMode) return Promise.resolve();

  const upserts: FarmRecordRow[] = [];
  const deletes: { collection: string; id: string }[] = [];
  for (const [collection, value] of Object.entries(updated)) {
    if (!isSyncedCollection(collection)) continue;
    const m = knownFor(collection);
    if (isObjectCollection(collection)) {
      if (!value || typeof value !== "object") continue;
      const data = cleanForServer(collection, value as Record<string, unknown>);
      if (m.get("main") !== norm(data)) upserts.push({ collection, id: "main", data });
      continue;
    }
    if (!Array.isArray(value)) continue;
    const seen = new Set<string>();
    for (const item of value as Record<string, unknown>[]) {
      if (!item || item.id === undefined || item.id === null) continue;
      const id = String(item.id);
      seen.add(id);
      const data = cleanForServer(collection, item);
      if (m.get(id) !== norm(data)) upserts.push({ collection, id, data });
    }
    for (const id of m.keys()) if (!seen.has(id)) deletes.push({ collection, id });
  }
  if (upserts.length === 0 && deletes.length === 0) return queue;

  // Mark as known right away so a quick second edit doesn't resend the same rows
  upserts.forEach((u) => markKnown(u.collection, u.id, u.data));
  deletes.forEach((d) => markKnown(d.collection, d.id, null));

  pending++;
  emit("saving");
  queue = queue.then(async () => {
    try {
      for (let i = 0; i < Math.max(upserts.length, 1); i += 200) {
        await call("save", { upserts: upserts.slice(i, i + 200), deletes: i === 0 ? deletes : [] });
      }
      pending--;
      if (pending === 0) emit("saved");
    } catch (e) {
      pending--;
      // Forget what we optimistically marked so the next save retries these rows
      upserts.forEach((u) => markKnown(u.collection, u.id, "__unsaved__"));
      deletes.forEach((d) => markKnown(d.collection, d.id, "__unsaved__"));
      emit("error", e instanceof Error ? e.message : String(e));
    }
  });
  return queue;
}

// ----------------------------------------------------------------------------------------
// Live updates: ask the server every 20 seconds what changed
// ----------------------------------------------------------------------------------------

export interface RemoteChange {
  collection: string;
  id: string;
  data: Record<string, unknown> | null; // null = deleted
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let polling = false;

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

export function subscribeToChanges(onChange: (c: RemoteChange) => void) {
  if (!isCloudMode) return () => {};
  stopPolling();

  const poll = async () => {
    if (polling || pending > 0 || document.visibilityState === "hidden") return;
    polling = true;
    try {
      // Ask with a one-minute overlap so a save that was still being written is not missed
      const since = lastServerTime ? new Date(new Date(lastServerTime).getTime() - 60000).toISOString() : "";
      const r = await call("changes", { since });
      lastServerTime = r.serverTime || lastServerTime;
      for (const row of (r.rows || []) as FarmRecordRow[]) {
        if (knownFor(row.collection).get(row.id) === norm(row.data)) continue;
        markKnown(row.collection, row.id, row.data);
        onChange({ collection: row.collection, id: row.id, data: row.data });
      }
      for (const d of (r.deleted || []) as { collection: string; id: string }[]) {
        if (!knownFor(d.collection).has(d.id)) continue;
        markKnown(d.collection, d.id, null);
        onChange({ collection: d.collection, id: d.id, data: null });
      }
      emit("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emit(/internet|reached/i.test(msg) ? "offline" : "error", msg);
    } finally {
      polling = false;
    }
  };

  pollTimer = setInterval(poll, POLL_MS);
  const onFocus = () => void poll();
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onFocus);
  return () => {
    stopPolling();
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onFocus);
  };
}
