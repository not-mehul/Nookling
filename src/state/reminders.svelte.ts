// Plans and hands over the reminders when the app goes to the background,
// and clears them when it comes back (the person is here now).

import { planReminders, type ReminderKind } from '../domain/reminders';
import { t } from '../i18n/index.svelte';
import { clearReminders, reminderPermission, scheduleReminders, type Permission } from '../platform/notify';
import { petState } from './pet.svelte';
import { settings } from './settings.svelte';

class RemindersState {
  permission = $state<Permission>('unavailable');

  async check(ask = false): Promise<void> {
    this.permission = await reminderPermission(ask);
  }

  /** On pause: the next two days of reminders. */
  async plan(now = Date.now()): Promise<void> {
    const pet = petState.pet;
    if (!pet || !settings.current.reminders) return clearReminders();
    const { bedtime, wake, gentle } = settings.current;
    const plan = planReminders(pet, now, { bedtime, wake, gentle });
    await scheduleReminders(
      plan.map((r) => ({ at: r.at, title: pet.name, body: body(r.kinds, pet.name) })),
      { name: t('remind.channel'), description: t('remind.channelHint') },
    );
  }

  /** On resume: they are here, so nothing needs announcing. */
  clear(): Promise<void> {
    return clearReminders();
  }
}

function body(kinds: ReminderKind[], name: string): string {
  if (kinds.length > 1) return t('remind.several', { name });
  return t(`remind.${kinds[0] ?? 'bored'}`, { name });
}

export const reminders = new RemindersState();
