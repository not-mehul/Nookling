import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, clockMinutes, normaliseSettings } from '../../src/domain/settings';

describe('settings', () => {
  it('fills in defaults for anything missing or wrong', () => {
    expect(normaliseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normaliseSettings({ theme: 'neon', bedtime: '25:00', sound: 'yes' })).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values', () => {
    const s = normaliseSettings({ theme: 'light', bedtime: '23:15', wake: '06:45', sound: false, gentle: true });
    expect(s).toMatchObject({ theme: 'light', bedtime: '23:15', wake: '06:45', sound: false, gentle: true });
  });

  it('never lets bedtime and wake time be the same', () => {
    const s = normaliseSettings({ bedtime: '07:00', wake: '07:00' });
    expect(s.bedtime).not.toBe(s.wake);
  });

  it('reads clock times as minutes after midnight', () => {
    expect(clockMinutes('00:00')).toBe(0);
    expect(clockMinutes('22:30')).toBe(1350);
  });
});
