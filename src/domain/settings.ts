// The person's preferences. Plain data and its validation; the reactive copy
// lives in src/state/settings.svelte.ts.

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeSetting;
  /** When the pet goes to bed and wakes up, as "HH:MM" local time. It sleeps when you do. */
  bedtime: string;
  wake: string;
  /** Reminders when a need runs low (src/platform/notify.ts). */
  reminders: boolean;
  /** Soft chirps when the pet reacts. */
  sound: boolean;
  /** A small buzz on boops, chomps and cuddles. */
  haptics: boolean;
  /** Every need falls at half speed. */
  gentle: boolean;
  /** When the last backup was written (ISO time). */
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  bedtime: '22:30',
  wake: '07:00',
  reminders: true,
  sound: true,
  haptics: true,
  gentle: false,
};

const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark'];
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Minutes after midnight for "HH:MM". */
export function clockMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Settings read back from storage, with anything unknown replaced by the default. */
export function normaliseSettings(value: unknown): Settings {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof Settings, unknown>>;
  const bool = (key: 'reminders' | 'sound' | 'haptics' | 'gentle') => (typeof v[key] === 'boolean' ? (v[key] as boolean) : DEFAULT_SETTINGS[key]);
  const clock = (key: 'bedtime' | 'wake') => (typeof v[key] === 'string' && CLOCK.test(v[key] as string) ? (v[key] as string) : DEFAULT_SETTINGS[key]);
  const settings: Settings = {
    theme: THEMES.includes(v.theme as ThemeSetting) ? (v.theme as ThemeSetting) : DEFAULT_SETTINGS.theme,
    bedtime: clock('bedtime'),
    wake: clock('wake'),
    reminders: bool('reminders'),
    sound: bool('sound'),
    haptics: bool('haptics'),
    gentle: bool('gentle'),
  };
  // Bedtime and wake time must differ, or the pet would never (or always) sleep.
  if (settings.bedtime === settings.wake) settings.wake = settings.bedtime === DEFAULT_SETTINGS.wake ? DEFAULT_SETTINGS.bedtime : DEFAULT_SETTINGS.wake;
  if (typeof v.lastBackupAt === 'string' && !Number.isNaN(Date.parse(v.lastBackupAt))) settings.lastBackupAt = v.lastBackupAt;
  return settings;
}
