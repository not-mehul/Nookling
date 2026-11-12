<script lang="ts">
  // First launch: name the pet, then a seedpod appears in the nook.
  import Icon from './ui/Icon.svelte';
  import { t } from '../i18n/index.svelte';
  import { petState } from '../state/pet.svelte';
  import { siblingEgg } from '../lib/delight';

  let name = $state('');
  let busy = $state(false);

  async function start(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    await petState.adopt(name || t('adopt.placeholder'));
    siblingEgg(name);
    busy = false;
  }
</script>

<div class="empty-state adopt">
  <Icon name="egg" size={40} stroke={1.25} />
  <p class="empty-title">{t('adopt.title')}</p>
  <p class="empty-text">{t('adopt.text')}</p>
  <form class="adopt-form" onsubmit={start}>
    <label class="field">
      <span class="t-field-label">{t('adopt.name')}</span>
      <input class="input" id="petName" maxlength="24" autocomplete="off" enterkeyhint="go" placeholder={t('adopt.placeholder')} bind:value={name} />
      <span class="field-hint">{t('adopt.nameHint')}</span>
    </label>
    <button type="submit" class="btn btn-primary btn-block" id="btnAdopt" disabled={busy}>{t('adopt.start')}</button>
  </form>
</div>

<style>
  .adopt-form {
    display: grid;
    gap: var(--space-4);
    width: min(100%, 22rem);
    margin: var(--space-5) auto 0;
    text-align: left;
  }
</style>
