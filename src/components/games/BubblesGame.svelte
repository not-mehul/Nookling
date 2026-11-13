<script lang="ts">
  // Bubbles: they drift up from the pet; pop them before they float away.
  import { onMount } from 'svelte';
  import { BUBBLES_MS, CALM_PACE } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';
  import { loop } from './loop';

  let { stage, form, calm = false, onfinish }: { stage: Stage; form: Form | null; calm?: boolean; onfinish: (hits: number, total: number) => void } = $props();
  interface Bubble {
    id: number;
    x: number;
    y: number;
    r: number;
    drift: number;
    popped: boolean;
  }
  let bubbles = $state<Bubble[]>([]);
  let hits = $state(0);
  let total = 0;
  let left = $state(BUBBLES_MS);

  /** Calm play ends when you say. */
  function enough() {
    left = 0;
    bubbles = [];
  }

  function pop(b: Bubble) {
    if (b.popped) return;
    b.popped = true;
    hits += 1;
    chirp('pop');
    setTimeout(() => (bubbles = bubbles.filter((x) => x.id !== b.id)), 180);
  }

  onMount(() => {
    let id = 0;
    let spawn = 0;
    return loop((dt, now) => {
      if (!calm) left = Math.max(0, left - dt);
      spawn -= dt;
      if (spawn <= 0 && left > 1200) {
        total += 1;
        bubbles.push({ id: ++id, x: 0.3 + Math.random() * 0.4, y: 0.78, r: 0.05 + Math.random() * 0.04, drift: Math.random() * 2 - 1, popped: false });
        spawn = 380 + Math.random() * 380;
      }
      for (const b of bubbles) {
        if (b.popped) continue;
        b.y -= 0.00016 * dt * (calm ? CALM_PACE : 1);
        b.x += Math.sin(now / 500 + b.id) * 0.0002 * dt * b.drift;
      }
      bubbles = bubbles.filter((b) => b.y > -0.1);
      if (left <= 0 && !bubbles.some((b) => !b.popped)) {
        onfinish(hits, Math.max(1, total));
        return false;
      }
    });
  });
  import PixelIcon from '../../pixel/PixelIcon.svelte';
  import { BUBBLE_ART } from '../../world/art/games-art';
</script>

<div class="game-head">
  <span class="t-data">{t('game.popped', { hits })}</span>
  {#if calm}<button type="button" class="btn btn-muted calm-done" id="calmDone" onclick={enough}>{t('game.calmDone')}</button>{:else}<span class="t-data">{Math.ceil(left / 1000)}s</span>{/if}
</div>
<div class="game-field">
  <div class="blower"><Pet {stage} {form} expression="happy" live={false} label="" /></div>
  {#each bubbles as b (b.id)}
    <button
      type="button"
      class="bubble"
      class:is-popped={b.popped}
      style:left="{b.x * 100}%"
      style:top="{b.y * 100}%"
      style:width="{b.r * 200}%"
      aria-label={t('game.popOne')}
      onpointerdown={() => pop(b)}><PixelIcon art={BUBBLE_ART} half={10} px={20} size={0} class="fill" /></button>
  {/each}
</div>
<p class="t-hint">{t('game.bubbles.about')}</p>

<style>
  .blower {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 34%;
    translate: -50% 12%;
  }
  .bubble {
    position: absolute;
    aspect-ratio: 1;
    translate: -50% -50%;
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
    transition:
      scale 160ms steps(3, end),
      opacity 160ms steps(3, end);
  }
  .bubble :global(.fill) {
    width: 100%;
    height: 100%;
  }
  .bubble.is-popped {
    scale: 1.5;
    opacity: 0;
  }
</style>
