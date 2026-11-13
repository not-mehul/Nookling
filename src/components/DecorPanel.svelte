<script lang="ts">
  // Decorating: everything the nook can have. Earned things go out with a
  // tap and away with another; the rest say how to earn them.
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { petState } from '../state/pet.svelte';
  import { worldState } from '../state/world.svelte';
  import DecorArt from '../world/art/DecorArt.svelte';
  import { DECOR, type Decor } from '../world/decor';
  import { tally, unlocked } from '../world/progress';

  let { ondone }: { ondone: () => void } = $props();
  const counts = $derived(tally(worldState.world, petState.pet, Date.now()));

  function toggle(d: Decor) {
    void worldState.arrange(d.id, worldState.world.decor[d.id] ? null : d.at);
  }
</script>

<section class="panel decorating" id="decorPanel" aria-labelledby="decorTitle">
  <div class="section-head">
    <h2 id="decorTitle">{t('decor.title')}</h2>
    <button type="button" class="btn btn-primary" id="btnDecorDone" onclick={ondone}>{t('decor.done')}</button>
  </div>
  <p class="t-hint">{t('decor.hint')}</p>
  <ul class="things">
    {#each DECOR as d (d.id)}
      {@const ok = unlocked(d.unlock, counts)}
      {@const isOut = !!worldState.world.decor[d.id]}
      <li>
        <button type="button" class="thing dd-pressable" class:is-out={isOut} data-decor-option={d.id} disabled={!ok} aria-pressed={isOut} onclick={() => toggle(d)}>
          <span class="art" class:is-locked={!ok}><DecorArt id={d.id} /></span>
          <span class="name">{t(`decor.${d.id}` as MessageKey)}</span>
          <span class="t-hint">{ok ? (isOut ? t('decor.out') : t('decor.put')) : t(`unlock.${d.unlock.by}` as MessageKey, { count: d.unlock.n })}</span>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .decorating {
    margin-bottom: var(--space-5);
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .things {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: var(--space-2);
  }
  .thing {
    width: 100%;
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: inherit;
    font: inherit;
    text-align: center;
    cursor: pointer;
  }
  .thing.is-out {
    border-color: var(--accent-bright);
  }
  .thing:disabled {
    cursor: default;
  }
  .art {
    width: 56px;
  }
  .art.is-locked {
    filter: grayscale(1);
    opacity: 0.35;
  }
  .name {
    font-size: 0.8125rem;
    color: var(--text-heading);
  }
  .t-hint {
    font-size: 0.6875rem;
  }
</style>
