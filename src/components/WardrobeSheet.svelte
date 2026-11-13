<script lang="ts">
  // The wardrobe: tap to put something on, tap again to take it off.
  import Sheet from './ui/Sheet.svelte';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import Pet from '../pet/Pet.svelte';
  import type { Form, Stage } from '../pet/types';
  import { chirp } from '../platform/sound';
  import { petState } from '../state/pet.svelte';
  import { worldState } from '../state/world.svelte';
  import { tally } from '../world/progress';
  import { seasonAt } from '../world/treasures';
  import { CLOTHES, SLOTS, available, type Clothes } from '../world/wardrobe';

  let { name, stage, form, onclose }: { name: string; stage: Stage; form: Form | null; onclose: () => void } = $props();
  const now = Date.now();
  const season = seasonAt(now);
  const counts = $derived(tally(worldState.world, petState.pet, now));
  const wardrobe = $derived(worldState.world.wardrobe);

  function why(c: Clothes): string {
    if (c.season) return t(`wardrobe.season.${c.season}` as MessageKey);
    return c.unlock ? t(`unlock.${c.unlock.by}` as MessageKey, { count: c.unlock.n }) : '';
  }
  async function put(c: Clothes) {
    await worldState.wear(c.id);
    chirp(wardrobe.wearing[c.slot] === c.id ? 'happy' : 'boop');
  }
</script>

<Sheet title={t('wardrobe.title', { name })} {onclose}>
  <div class="mirror"><Pet {stage} {form} expression="happy" outfit={wardrobe.wearing} label={t('wardrobe.mirror', { name })} /></div>
  {#each SLOTS as slot (slot)}
    <h3 class="t-field-label">{t(`wardrobe.slot.${slot}` as MessageKey)}</h3>
    <ul class="clothes">
      {#each CLOTHES.filter((c) => c.slot === slot) as c (c.id)}
        {@const ok = available(c, wardrobe, counts, season)}
        {@const on = wardrobe.wearing[slot] === c.id}
        <li>
          <button type="button" class="item dd-pressable" class:is-on={on} data-clothes={c.id} disabled={!ok} aria-pressed={on} onclick={() => put(c)}>
            <span class="name">{t(`clothes.${c.id}` as MessageKey)}</span>
            {#if !ok}<span class="t-hint">{why(c)}</span>{:else if c.season}<span class="t-hint">{t(`wardrobe.found.${c.season}` as MessageKey)}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/each}
</Sheet>

<style>
  .mirror {
    width: min(50%, 180px);
    margin: 0 auto var(--space-3);
  }
  h3 {
    margin: var(--space-3) 0 var(--space-2);
  }
  .clothes {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: var(--space-2);
  }
  .item {
    width: 100%;
    min-height: 3.25rem;
    display: grid;
    gap: 2px;
    align-content: center;
    padding: var(--space-2) var(--space-3);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item.is-on {
    border-color: var(--accent-bright);
    background: var(--panel-bg);
  }
  .item:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .name {
    font-size: 0.875rem;
    color: var(--text-heading);
  }
  .t-hint {
    font-size: 0.6875rem;
  }
</style>
