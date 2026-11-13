<script lang="ts">
  // Cozy's Nook shows the day's little moments instead of a needs chart:
  // what it ate, played and found today. Nothing to top up, nothing red.
  import { t } from '../i18n/index.svelte';
  import { logLine } from '../lib/logLine';
  import { petState } from '../state/pet.svelte';
  import { worldState } from '../state/world.svelte';
  import { treasureById } from '../world/treasures';

  let { name, now }: { name: string; now: number } = $props();
  const SHOWN = ['fed', 'played', 'cleaned', 'cuddled', 'medicine', 'tidied', 'grew', 'good-day'];
  const today = $derived(new Date(now).toDateString());
  const lines = $derived.by(() => {
    const out: { at: number; text: string }[] = [];
    for (const e of petState.log) {
      if (new Date(e.at).toDateString() !== today) continue;
      if (SHOWN.includes(e.kind)) out.push({ at: e.at, text: logLine(e, worldState.world) });
    }
    for (const [id, r] of Object.entries(worldState.world.treasures)) {
      const found = treasureById(id);
      if (found && new Date(r.first).toDateString() === today) out.push({ at: r.first, text: t('today.found', { treasure: found.name.toLowerCase() }) });
    }
    return out.sort((a, b) => b.at - a.at).slice(0, 5);
  });
  const time = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
</script>

<section class="panel today" id="todayPanel" aria-labelledby="todayTitle">
  <div class="section-head"><h2 id="todayTitle">{t('today.title', { name })}</h2></div>
  {#if lines.length}
    <ul>
      {#each lines as l (l.at + l.text)}<li><span class="t-data">{time(l.at)}</span> {l.text}</li>{/each}
    </ul>
  {:else}
    <p class="t-hint">{t('today.empty', { name })}</p>
  {/if}
</section>

<style>
  .today {
    padding: var(--space-5);
  }
  ul {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  li {
    display: flex;
    gap: var(--space-3);
    align-items: baseline;
  }
  li .t-data {
    flex: none;
    min-width: 4.5em;
    color: var(--text-faint);
  }
</style>
