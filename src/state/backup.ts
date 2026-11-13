// A quiet weekly backup: on a phone, when the last one is a week old, a copy
// goes to Documents/Nookling without a word. No reminders, no warnings and
// nothing to tick off; the last four weekly copies are kept.

import { BACKUP_PREFIX, buildBackupZip } from "../lib/backup";
import {
  datedName,
  deleteOutput,
  isNative,
  listOutputs,
  saveFile,
} from "../platform/output";
import { petState } from "./pet.svelte";
import { settings } from "./settings.svelte";
import { worldState } from "./world.svelte";

const WEEK = 7 * 24 * 60 * 60 * 1000;
export const WEEKLY_PREFIX = `${BACKUP_PREFIX}-weekly`;
const KEEP = 4;

/** True when the newest backup, made by hand or by itself, is a week old or there is none. */
export function weeklyDue(
  lastBackupAt: string | undefined,
  now = Date.now(),
): boolean {
  return !lastBackupAt || now - Date.parse(lastBackupAt) >= WEEK;
}

/** The weekly copies to delete: all but the newest four (the names sort by date). */
export function weeklyToPrune(names: readonly string[], keep = KEEP): string[] {
  return names
    .filter((n) => n.startsWith(`${WEEKLY_PREFIX}-`) && n.endsWith(".zip"))
    .sort()
    .reverse()
    .slice(keep);
}

let running = false;

export async function backUpQuietlyIfDue(now = new Date()): Promise<void> {
  if (
    !isNative ||
    running ||
    !settings.current.autoBackup ||
    !weeklyDue(settings.current.lastBackupAt, now.getTime())
  )
    return;
  running = true;
  try {
    const all = await petState.everything();
    if (!all) return;
    const bytes = await buildBackupZip(
      all.pet,
      all.log,
      settings.current,
      all.photos,
      now,
      worldState.world,
    );
    await saveFile(
      {
        name: datedName(WEEKLY_PREFIX, "zip", now),
        data: bytes,
        mime: "application/zip",
      },
      { share: false },
    );
    settings.update({ lastBackupAt: now.toISOString() });
    for (const name of weeklyToPrune(await listOutputs("Nookling")))
      await deleteOutput("Nookling", name).catch(() => undefined);
  } catch (err) {
    // Quiet means quiet: it tries again next time.
    console.warn("Weekly backup failed:", err);
  } finally {
    running = false;
  }
}
