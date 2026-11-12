<script lang="ts">
  // The garden, at the top of the Pantry: three plots that grow in real time.
  // Ripe plants wait as long as it takes; nothing wilts.
  import { foodById } from '../domain/foods';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { chirp } from '../platform/sound';
  import { ui } from '../state/ui.svelte';
  import { worldState } from '../state/world.svelte';
  import PlantArt from '../world/art/PlantArt.svelte';
  import { growth, seedById, seedsFor, type SeedId } from '../world/garden';

  let now = $state(Date.now());
  let choosing = $state<number | null>(null);
  const garden = $derived(worldState.world.garden);
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(timer);
  });

  function until(ms: number): string {
    const mins = Math.max(1, Math.ceil(ms / 60_000));
    return mins < 60 ? t('garden.inMinutes', { count: mins }) : t('garden.inHours', { count: Math.max(1, Math.round(mins / 60)) });
  }
  async function sow(plot: number, seed: SeedId) {
    choosing = null;
    await worldState.plant(plot, seed);
    now = Date.now();
    chirp('pop');
  }
  async function pick(plot: number) {
    const got = await worldState.harvest(plot);
    now = Date.now();
    if (!got) return;
    const food = foodById(seedById(got.seed)?.food ?? '');
    chirp('happy');
    ui.notify(got.first && food ? t('garden.firstHarvest', { food: food.name }) : t('garden.harvested', { food: food?.name ?? '' }), got.first ? 'celebrate' : 'success');
  }
</script>

<section class="panel" id="gardenPanel" aria-labelledby="gardenTitle">
  <div class="section-head"><h2 id="gardenTitle">{t('garden.title')}</h2></div>
  <p class="t-hint">{t('garden.hint')}</p>
  <ul class="plots">
    {#each garden.plots as plot, i (i)}
      <li class="plot" data-plot={i}>
        {#if plot}
          {@const g = growth(plot, now)}
          <PlantArt seed={plot.seed} stage={g.stage} />
          <span class="name">{t(`seed.${plot.seed}` as MessageKey)}</span>
          {#if g.stage === 'ripe'}
            <button type="button" class="btn btn-secondary" data-harvest={i} onclick={() => pick(i)}>{t('garden.harvest')}</button>
          {:else}
            <span class="t-hint">{t('garden.ready', { when: until(g.ripeAt - now) })}</span>
          {/if}
        {:else if choosing === i}
          <div class="seeds" role="group" aria-label={t('garden.choose')}>
            {#each seedsFor(garden) as s (s.id)}
              <button type="button" class="btn btn-muted seed" data-seed={s.id} onclick={() => sow(i, s.id)}>{t(`seed.${s.id}` as MessageKey)}</button>
            {/each}
          </div>
        {:else}
          <span class="soil" aria-hidden="true"></span>
          <button type="button" class="btn btn-muted" data-sow={i} onclick={() => (choosing = i)}>{t('garden.plant')}</button>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .plots {
    margin-top: var(--space-3);
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
  }
  .plot {
    display: grid;
    justify-items: center;
    align-content: end;
    gap: var(--space-1);
    min-height: 9rem;
    padding: var(--space-2);
    text-align: center;
    border-radius: var(--corner-lg);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
  }
  .plot .btn {
    width: 100%;
    min-width: 0;
    padding-inline: var(--space-1);
    letter-spacing: 0.04em;
    justify-content: center;
    font-size: 0.8125rem;
  }
  .soil {
    width: 70%;
    height: 14px;
    margin-bottom: var(--space-2);
    border-radius: 50%;
    background: var(--pet-food-crust);
    opacity: 0.6;
  }
  .name {
    font-size: 0.8125rem;
    color: var(--text-heading);
  }
  .seeds {
    display: grid;
    gap: var(--space-1);
    width: 100%;
  }
  .seed {
    padding-block: var(--space-1);
  }
  .t-hint {
    font-size: 0.6875rem;
  }
</style>
