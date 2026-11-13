<script lang="ts">
  import { Switch } from 'dusk-dawn';
  import type { ThemeSetting } from '../domain/settings';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { eggsFound, siblingEgg, EGGS } from '../lib/delight';
  import { BACKUP_PREFIX, buildBackupZip, parseBackup, type BackupData } from '../lib/backup';
  import { datedName, isNative, saveFile } from '../platform/output';
  import Sheet from './ui/Sheet.svelte';
  import { petState } from '../state/pet.svelte';
  import { worldState } from '../state/world.svelte';
  import { newWorld } from '../world/world';
  import { reminders } from '../state/reminders.svelte';
  import { settings } from '../state/settings.svelte';
  import { ui } from '../state/ui.svelte';

  const pet = $derived(petState.pet);
  let newName = $derived(petState.pet?.name ?? '');

  let awayDays = $state(3);

  async function setReminders(on: boolean) {
    settings.update({ reminders: on });
    if (on) await reminders.check(true);
  }

  async function leave() {
    await petState.goAway(awayDays);
    ui.notify(t('settings.awayLeft', { name: pet?.name ?? '' }), 'info');
  }

  async function rename(e: SubmitEvent) {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === pet?.name) return;
    await petState.rename(newName);
    ui.notify(t('settings.renamed', { name: newName.trim() }), 'success');
    siblingEgg(newName);
  }

  let pending = $state.raw<BackupData | null>(null);
  let picker = $state<HTMLInputElement>();
  let saving = $state(false);

  async function backup() {
    const all = await petState.everything();
    if (!all || saving) return;
    saving = true;
    try {
      const now = new Date();
      const bytes = await buildBackupZip(all.pet, all.log, settings.current, all.photos, now, worldState.world);
      const { savedTo } = await saveFile({ name: datedName(BACKUP_PREFIX, 'zip', now, true), data: bytes, mime: 'application/zip' });
      settings.update({ lastBackupAt: now.toISOString() });
      ui.notify(t('settings.backedUp', { where: savedTo ?? t('settings.backup') }), 'success');
    } catch (err) {
      console.error(err);
      ui.notify(t('settings.backupFailed'), 'error');
    } finally {
      saving = false;
    }
  }

  async function chosen(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      pending = await parseBackup(new Uint8Array(await file.arrayBuffer()));
    } catch {
      ui.notify(t('settings.notBackup'), 'error');
    }
  }

  async function restore() {
    const data = pending;
    pending = null;
    if (!data) return;
    await petState.restore(data);
    await worldState.save(data.world ?? newWorld(Date.now()));
    if (data.settings) settings.update({ ...data.settings, lastBackupAt: settings.current.lastBackupAt });
    ui.notify(t('settings.restored', { name: data.pet.name }), 'success');
  }

  const THEMES: { value: ThemeSetting; key: MessageKey }[] = [
    { value: 'system', key: 'settings.themeSystem' },
    { value: 'dark', key: 'settings.themeDusk' },
    { value: 'light', key: 'settings.themeDawn' },
  ];
  import { COATS, coatOf, pickCoat } from '../pet/coats';
</script>

<div id="viewSettings" role="tabpanel" aria-labelledby="tabSettings">
  <div class="panel">
    <div class="section-head"><h2>{t('settings.appearance')}</h2></div>
    <div class="setting-row">
      <span class="t-field-label" id="themeLabel">{t('settings.theme')}</span>
      <div class="segmented" role="radiogroup" aria-labelledby="themeLabel">
        {#each THEMES as opt (opt.value)}
          <button
            type="button"
            role="radio"
            aria-checked={settings.current.theme === opt.value}
            data-theme-option={opt.value}
            onclick={() => settings.update({ theme: opt.value })}
          >
            {t(opt.key)}
          </button>
        {/each}
      </div>
    </div>
  </div>
  {#if pet}
    <div class="panel">
      <div class="section-head"><h2>{t('settings.pet')}</h2></div>
      <form class="rename" onsubmit={rename}>
        <label class="field">
          <span class="t-field-label">{t('adopt.name')}</span>
          <input class="input" id="renameInput" maxlength="24" autocomplete="off" enterkeyhint="done" bind:value={newName} />
        </label>
        <button type="submit" class="btn btn-muted" id="btnRename" disabled={!newName.trim() || newName.trim() === pet.name}>{t('settings.rename')}</button>
      </form>
      <span class="t-field-label coat-label" id="coatLabel">{t('settings.coat')}</span>
      <div class="coats" role="radiogroup" aria-labelledby="coatLabel">
        {#each COATS as c (c.id)}
          <button
            type="button"
            role="radio"
            class="coat dd-pressable"
            data-coat={c.id}
            aria-checked={coatOf(pet) === c.id}
            aria-label={t(`coat.${c.id}` as MessageKey)}
            title={t(`coat.${c.id}` as MessageKey)}
            style:--swatch={c.colour}
            onclick={() => void petState.recolour(c.id)}
          ></button>
        {/each}
        <button type="button" class="btn btn-muted" id="btnCoatRandom" onclick={() => void petState.recolour(pickCoat())}>{t('settings.coatRandom')}</button>
      </div>
    </div>
  {/if}
  <div class="panel">
    <div class="section-head"><h2>{t('settings.day')}</h2></div>
    <div class="setting-row">
      <span class="t-field-label" id="styleLabel">{t('settings.style')}</span>
      <div class="segmented" role="radiogroup" aria-labelledby="styleLabel">
        {#each ['cozy', 'tamagotchi'] as const as style (style)}
          <button type="button" role="radio" aria-checked={settings.current.style === style} data-style-option={style} onclick={() => settings.update({ style })}>
            {t(`settings.style.${style}`)}
          </button>
        {/each}
      </div>
    </div>
    <p class="t-hint" id="styleHint">{t(`settings.style.${settings.current.style}Hint`)}</p>
    <div class="times">
      <label class="field">
        <span class="t-field-label">{t('settings.bedtime')}</span>
        <input class="input" type="time" id="bedtimeInput" value={settings.current.bedtime} onchange={(e) => settings.update({ bedtime: e.currentTarget.value })} />
      </label>
      <label class="field">
        <span class="t-field-label">{t('settings.wake')}</span>
        <input class="input" type="time" id="wakeInput" value={settings.current.wake} onchange={(e) => settings.update({ wake: e.currentTarget.value })} />
      </label>
    </div>
    <p class="t-hint">{t('settings.dayHint')}</p>
    {#if isNative && settings.current.reminders && reminders.permission === 'denied'}
      <div class="notice" role="status">
        <div class="notice-text">
          <p class="notice-title">{t('settings.remindersOff')}</p>
          <p class="notice-detail">{t('settings.remindersOffDetail')}</p>
        </div>
      </div>
    {/if}
    <div class="switches">
      {#if settings.current.style === 'cozy'}
        <Switch id="switchReminders" checked={settings.current.reminders} label={t('settings.invitations')} hint={t('settings.invitationsHint')} onchange={(on) => void setReminders(on)} />
      {:else}
        <Switch id="switchReminders" checked={settings.current.reminders} label={t('settings.reminders')} hint={t('settings.remindersHint')} onchange={(on) => void setReminders(on)} />
        <Switch id="switchGentle" checked={settings.current.gentle} label={t('settings.gentle')} hint={t('settings.gentleHint')} onchange={(on) => settings.update({ gentle: on })} />
      {/if}
    </div>
  </div>
  {#if pet && pet.stage !== 'seedpod'}
    <div class="panel">
      <div class="section-head"><h2>{t('settings.away')}</h2></div>
      {#if pet.awayUntil}
        <p class="t-hint">{t('settings.awayUntil', { date: new Date(pet.awayUntil).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) })}</p>
        <button type="button" class="btn btn-secondary" id="btnComeBack" onclick={() => petState.comeBack()}>{t('care.comeBack', { name: pet.name })}</button>
      {:else}
        <p class="t-hint">{t('settings.awayHint', { name: pet.name })}</p>
        <div class="rename">
          <label class="field">
            <span class="t-field-label">{t('settings.awayDays')}</span>
            <select class="select" id="awayDays" bind:value={awayDays}>
              {#each [1, 2, 3, 5, 7, 10, 14] as d (d)}<option value={d}>{t('time.days', { count: d })}</option>{/each}
            </select>
          </label>
          <button type="button" class="btn btn-muted" id="btnAway" onclick={leave}>{t('settings.awayStart')}</button>
        </div>
      {/if}
    </div>
  {/if}
  <div class="panel">
    <div class="section-head"><h2>{t('settings.senses')}</h2></div>
    <div class="switches">
      <Switch id="switchSound" checked={settings.current.sound} label={t('settings.sound')} hint={t('settings.soundHint')} onchange={(on) => settings.update({ sound: on })} />
      <Switch id="switchHaptics" checked={settings.current.haptics} label={t('settings.haptics')} hint={t('settings.hapticsHint')} onchange={(on) => settings.update({ haptics: on })} />
    </div>
  </div>
  <div class="panel" id="panelData">
    <div class="section-head"><h2>{t('settings.data')}</h2></div>
    <p class="t-hint">{t('settings.dataHint', { name: pet?.name ?? 'your nookling' })}</p>
    <p class="t-hint">{settings.current.lastBackupAt ? t('settings.lastBackup', { date: new Date(settings.current.lastBackupAt).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) }) : t('settings.neverBackedUp')}</p>
    <div class="data-actions">
      <button type="button" class="btn btn-secondary" id="btnBackup" disabled={!pet || saving} onclick={backup}>{t('settings.backup')}</button>
      <button type="button" class="btn btn-muted" id="btnRestore" onclick={() => picker?.click()}>{t('settings.restore')}</button>
      <input bind:this={picker} id="restoreFile" type="file" accept=".zip,application/zip" hidden onchange={chosen} />
    </div>
  </div>
  <div class="panel">
    <div class="section-head"><h2>{t('settings.about')}</h2></div>
    <p class="t-hint">Nookling · {t('settings.version', { version: __APP_VERSION__ })}</p>
    <p class="t-hint"><b>{t('settings.private')}</b> {t('settings.privateText')}</p>
    <p class="t-hint">{t('settings.credit')}</p>
    <p class="t-hint" id="eggCount">{t('settings.eggs', { found: eggsFound(), total: EGGS.length })}</p>
  </div>
</div>

{#if pending}
  {@const incoming = pending}
  <Sheet title={t('settings.restoreTitle', { name: incoming.pet.name })} onclose={() => (pending = null)}>
    <p class="t-hint">{t('settings.restoreText', { name: incoming.pet.name, current: pet?.name ?? 'nothing' })}</p>
    <div class="data-actions">
      <button type="button" class="btn btn-primary" id="btnRestoreConfirm" onclick={restore}>{t('settings.restoreConfirm')}</button>
      <button type="button" class="btn btn-muted" onclick={() => (pending = null)}>{t('settings.cancel')}</button>
    </div>
  </Sheet>
{/if}

<style>
  .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .t-hint {
    margin-bottom: 0.75rem;
  }
  .rename {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-3);
    align-items: end;
  }
  .times {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .coat-label {
    display: block;
    margin-top: var(--space-4);
  }
  .coats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  /* A square swatch with stepped corners, in the pixel idiom. */
  .coat {
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: var(--swatch);
    clip-path: polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px));
    box-shadow:
      inset 0 -6px 0 color-mix(in oklab, var(--swatch) 72%, var(--pet-mouth)),
      inset 0 6px 0 color-mix(in oklab, var(--swatch) 60%, var(--pet-eye));
    cursor: pointer;
  }
  .coat[aria-checked='true'] {
    box-shadow:
      inset 0 0 0 4px var(--accent-bright),
      inset 0 -10px 0 color-mix(in oklab, var(--swatch) 72%, var(--pet-mouth));
  }
</style>
