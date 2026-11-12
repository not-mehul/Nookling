<script lang="ts">
  import type { ThemeSetting } from '../domain/settings';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { settings } from '../state/settings.svelte';

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
</style>
