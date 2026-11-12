// ============================================================
// Backups: a .zip holding nookling.json (the pet, its care log and
// the settings) and photos/<id>.png. Restoring replaces everything;
// there is one pet, so there is nothing to merge.
// ============================================================

import { strFromU8, strToU8, unzip, zip, type AsyncZippable, type Unzipped } from 'fflate';
import type { LogEntry, Photo } from '../data/db';
import { NEEDS, newPet, TRAITS, type Pet } from '../domain/pet';
import { normaliseSettings, type Settings } from '../domain/settings';

export const BACKUP_VERSION = 1;
export const BACKUP_PREFIX = 'nookling-backup';

export interface BackupData {
  pet: Pet;
  log: LogEntry[];
  settings: Settings | null;
  photos: Photo[];
}

const STAGES = ['seedpod', 'sprout', 'nookling', 'grown'];
const FORMS = ['lamplighter', 'gardener', 'dreamer', 'scamp'];
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const unit = (v: unknown, fallback: number) => Math.min(1, Math.max(0, num(v, fallback)));
const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** A pet from a backup, with anything missing or out of range set to a safe value. */
export function normalisePet(raw: unknown): Pet | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || !STAGES.includes(r.stage as string)) return null;
  const createdAt = num(r.createdAt, Date.now());
  const base = newPet(r.id, r.name.slice(0, 24), createdAt, []);
  const needs = { ...base.needs };
  const rn = (r.needs ?? {}) as Record<string, unknown>;
  for (const n of NEEDS) needs[n] = unit(rn[n], needs[n]);
  const rc = (r.care ?? {}) as Record<string, unknown>;
  const care = {
    attention: Math.max(0, num(rc.attention, 0)),
    foods: Array.isArray(rc.foods) ? rc.foods.filter((f): f is string => typeof f === 'string') : [],
    rest: Math.max(0, num(rc.rest, 0)),
    neglect: Math.max(0, num(rc.neglect, 0)),
  };
  return {
    ...base,
    hatchedAt: time(r.hatchedAt),
    warmth: unit(r.warmth, 0),
    stage: r.stage as Pet['stage'],
    form: FORMS.includes(r.form as string) ? (r.form as Pet['form']) : null,
    traits: Array.isArray(r.traits) ? (r.traits.filter((t) => TRAITS.includes(t)) as Pet['traits']).slice(0, 2) : [],
    needs,
    health: unit(r.health, 1),
    bond: Math.max(0, num(r.bond, 0)),
    unwell: r.unwell === true,
    asleep: r.asleep === true,
    sleepOverride: r.sleepOverride && typeof r.sleepOverride === 'object' ? (r.sleepOverride as Pet['sleepOverride']) : null,
    messes: Math.min(3, Math.max(0, Math.round(num(r.messes, 0)))),
    messAt: time(r.messAt),
    sluggishUntil: time(r.sluggishUntil),
    treats: Array.isArray(r.treats) ? r.treats.filter((x): x is number => typeof x === 'number') : [],
    awayUntil: time(r.awayUntil),
    care,
    asOf: num(r.asOf, createdAt),
  };
}

function normaliseLog(raw: unknown, petId: string): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is LogEntry => !!e && typeof e.id === 'string' && typeof e.kind === 'string' && typeof e.at === 'number')
    .map((e) => ({ id: e.id, petId, at: e.at, kind: e.kind, ...(typeof e.detail === 'string' ? { detail: e.detail } : {}) }));
}

export function buildJson(pet: Pet, log: LogEntry[], settings: Settings, photos: Photo[], now = new Date()): string {
  const { lastBackupAt: _, ...prefs } = settings;
  void _;
  return JSON.stringify(
    { app: 'nookling', version: BACKUP_VERSION, exportedAt: now.toISOString(), pet, log, settings: prefs, photos: photos.map((p) => ({ id: p.id, at: p.at })) },
    null,
    2,
  );
}

export async function buildBackupZip(pet: Pet, log: LogEntry[], settings: Settings, photos: Photo[], now = new Date()): Promise<Uint8Array> {
  const files: AsyncZippable = { 'nookling.json': strToU8(buildJson(pet, log, settings, photos, now)) };
  for (const p of photos) files[`photos/${p.id}.png`] = new Uint8Array(await p.image.arrayBuffer());
  // Pictures are already compressed: store them as they are.
  return new Promise((resolve, reject) => zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))));
}

function unzipped(bytes: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => unzip(bytes, (err, files) => (err ? reject(err) : resolve(files))));
}

export class NotABackup extends Error {
  constructor() {
    super('Not a Nookling backup');
  }
}

export async function parseBackup(bytes: Uint8Array): Promise<BackupData> {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new NotABackup();
  const files = await unzipped(bytes).catch(() => {
    throw new NotABackup();
  });
  const json = files['nookling.json'];
  if (!json) throw new NotABackup();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(strFromU8(json));
  } catch {
    throw new NotABackup();
  }
  if (data?.app !== 'nookling') throw new NotABackup();
  const pet = normalisePet(data.pet);
  if (!pet) throw new NotABackup();
  const photos: Photo[] = [];
  for (const p of Array.isArray(data.photos) ? data.photos : []) {
    const image = typeof p?.id === 'string' ? files[`photos/${p.id}.png`] : undefined;
    if (image) photos.push({ id: p.id, petId: pet.id, at: num(p.at, Date.now()), image: new Blob([image as BlobPart], { type: 'image/png' }) });
  }
  return {
    pet,
    log: normaliseLog(data.log, pet.id),
    settings: data.settings && typeof data.settings === 'object' ? normaliseSettings(data.settings) : null,
    photos,
  };
}
