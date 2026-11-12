// Reminders as local notifications, scheduled ahead of time (src/domain/
// reminders.ts plans them). Each time the app goes to the background the
// whole set is replaced, so a reminder never outlives the state it was
// planned from. Tapping one opens the Nook. Nothing on the web.

import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './output';

const CHANNEL = 'pet-needs';
/** Reminder ids live in this range, so clearing them never touches anything else. */
const FIRST_ID = 1000;
const LAST_ID = 1099;

export type Permission = 'granted' | 'denied' | 'unavailable';

let channelReady = false;

async function ensureChannel(name: string, description: string): Promise<void> {
  if (channelReady) return;
  await LocalNotifications.createChannel({ id: CHANNEL, name, description, importance: 3, visibility: 1 }).catch(() => undefined);
  channelReady = true;
}

/** Whether reminders can be shown; asks once when `ask` is true. */
export async function reminderPermission(ask: boolean): Promise<Permission> {
  if (!isNative) return 'unavailable';
  try {
    let { display } = await LocalNotifications.checkPermissions();
    if (ask && (display === 'prompt' || display === 'prompt-with-rationale')) ({ display } = await LocalNotifications.requestPermissions());
    return display === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function clearReminders(): Promise<void> {
  if (!isNative) return;
  const { notifications } = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
  const ours = notifications.filter((n) => n.id >= FIRST_ID && n.id <= LAST_ID).map((n) => ({ id: n.id }));
  if (ours.length) await LocalNotifications.cancel({ notifications: ours }).catch(() => undefined);
}

/** Replaces every scheduled reminder with these. */
export async function scheduleReminders(reminders: { at: number; title: string; body: string }[], channel: { name: string; description: string }): Promise<void> {
  if (!isNative) return;
  await clearReminders();
  if (!reminders.length || (await reminderPermission(false)) !== 'granted') return;
  await ensureChannel(channel.name, channel.description);
  await LocalNotifications.schedule({
    notifications: reminders.slice(0, LAST_ID - FIRST_ID + 1).map((r, i) => ({
      id: FIRST_ID + i,
      title: r.title,
      body: r.body,
      channelId: CHANNEL,
      smallIcon: 'ic_stat_nookling',
      schedule: { at: new Date(r.at), allowWhileIdle: true },
    })),
  }).catch((err) => console.warn('Could not schedule reminders:', err));
}
