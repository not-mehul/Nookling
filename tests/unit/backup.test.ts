import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { buildBackupZip, normalisePet, parseBackup } from '../../src/lib/backup';
import { DEFAULT_SETTINGS } from '../../src/domain/settings';
import { newPet } from '../../src/domain/pet';

const NOW = new Date(2026, 10, 12, 12, 0).getTime();

describe('backups', () => {
  it('round-trips the pet, its log, its settings and its pictures', async () => {
    const pet = { ...newPet('p1', 'Pip', NOW, ['shy']), stage: 'sprout' as const, hatchedAt: NOW };
    const log = [{ id: 'l1', petId: 'p1', at: NOW, kind: 'hatched' }];
    const image = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
    const settings = { ...DEFAULT_SETTINGS, bedtime: '23:00', lastBackupAt: new Date(NOW).toISOString() };
    const bytes = await buildBackupZip(pet, log, settings, [{ id: 'ph1', petId: 'p1', at: NOW, image }]);

    const back = await parseBackup(bytes);
    expect(back.pet).toEqual(pet);
    expect(back.log).toEqual(log);
    expect(back.settings?.bedtime).toBe('23:00');
    expect(back.settings?.lastBackupAt).toBeUndefined();
    expect(back.photos).toHaveLength(1);
    expect(new Uint8Array(await back.photos[0]!.image.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
  });

  it('refuses anything that is not a Nookling backup', async () => {
    await expect(parseBackup(strToU8('{"app":"nookling"}'))).rejects.toThrow('Not a Nookling backup');
    await expect(parseBackup(zipSync({ 'mise.json': strToU8('{}') }))).rejects.toThrow();
    await expect(parseBackup(zipSync({ 'nookling.json': strToU8('{"app":"nookling","pet":{"name":"x"}}') }))).rejects.toThrow();
  });

  it('mends a pet with odd values', () => {
    const pet = normalisePet({ id: 'p', name: 'Odd', stage: 'grown', form: 'pirate', needs: { fullness: 7, mood: 'lots' }, messes: 12, traits: ['shy', 'loud'] });
    expect(pet?.form).toBeNull();
    expect(pet?.needs.fullness).toBe(1);
    expect(pet?.needs.mood).toBeGreaterThan(0);
    expect(pet?.messes).toBe(3);
    expect(pet?.traits).toEqual(['shy']);
  });
});
