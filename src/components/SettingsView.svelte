<script lang="ts">
  import { Switch } from 'dusk-dawn';
  import type { ThemeSetting } from '../domain/settings';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { petState } from '../state/pet.svelte';
  import { settings } from '../state/settings.svelte';
  import { ui } from '../state/ui.svelte';

  const pet = $derived(petState.pet);
  let newName = $derived(petState.pet?.name ?? '');

  async function rename(e: SubmitEvent) {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === pet?.name) return;
    await petState.rename(newName);
    ui.notify(t('settings.renamed', { name: newName.trim() }), 'success');
  }

  const THEMES: { value: ThemeSetting; key: MessageKey }[] = [
    { value: 'system', key: 'settings.themeSystem' },
    { value: 'dark', key: 'settings.themeDusk' },
    { value: 'light', key: 'settings.themeDawn' },
  ];
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
    </div>
  {/if}
  <div class="panel">
    <div class="section-head"><h2>{t('settings.day')}</h2></div>
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
    <div class="switches">
      <Switch id="switchGentle" checked={settings.current.gentle} label={t('settings.gentle')} hint={t('settings.gentleHint')} onchange={(on) => settings.update({ gentle: on })} />
    </div>
  </div>
  <div class="panel">
    <div class="section-head"><h2>{t('settings.senses')}</h2></div>
    <div class="switches">
      <Switch id="switchSound" checked={settings.current.sound} label={t('settings.sound')} hint={t('settings.soundHint')} onchange={(on) => settings.update({ sound: on })} />
      <Switch id="switchHaptics" checked={settings.current.haptics} label={t('settings.haptics')} hint={t('settings.hapticsHint')} onchange={(on) => settings.update({ haptics: on })} />
    </div>
  </div>
  <div class="panel">
    <div class="section-head"><h2>{t('settings.about')}</h2></div>
    <p class="t-hint">Nookling · {t('settings.version', { version: __APP_VERSION__ })}</p>
    <p class="t-hint"><b>{t('settings.private')}</b> {t('settings.privateText')}</p>
    <p class="t-hint">{t('settings.credit')}</p>
  </div>
</div>

<style>
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
</style>
