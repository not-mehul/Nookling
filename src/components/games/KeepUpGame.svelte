<script lang="ts">
  // Keep it up: it bounces like a ball. Tap it to send it back up.
  import { onMount } from 'svelte';
  import { BOUNCE, CALM_PACE, GRAVITY, KEEPUP_GOAL, KEEPUP_MS } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';
  import { loop } from './loop';

  let { stage, form, calm = false, onfinish }: { stage: Stage; form: Form | null; calm?: boolean; onfinish: (hits: number, total: number) => void } = $props();
  let x = $state(0.5);
  let y = $state(0.3);
  let vx = 0;
  let vy = 0;
  let hits = $state(0);
  let left = $state(KEEPUP_MS);
  let started = $state(false);
  let face = $state<'happy' | 'surprised' | 'dizzy'>('happy');

  /** Calm play ends when you say. */
  function enough() {
    started = true;
    left = 0;
  }

  function bounce(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    const tapX = (e.clientX - box.left) / box.width;
    started = true;
    vy = BOUNCE * (calm ? CALM_PACE : 1);
    vx = (x - tapX) * 0.0012;
    hits += 1;
    face = 'surprised';
    setTimeout(() => (face = 'happy'), 200);
    chirp('boop');
  }

  onMount(() =>
    loop((dt) => {
      if (!started) return;
      if (!calm) left = Math.max(0, left - dt);
      vy += GRAVITY * dt * (calm ? CALM_PACE * CALM_PACE : 1);
      y += vy * dt;
      x += vx * dt;
      if (x < 0.12 || x > 0.88) {
        vx = -vx;
        x = Math.min(0.88, Math.max(0.12, x));
      }
      if (y < 0.1) {
        y = 0.1;
        vy = Math.abs(vy) * 0.3;
      }
      // Calm play: the floor is soft, and it bounces back up by itself.
      if (calm && y >= 0.86 && left > 0) {
        y = 0.86;
        vy = BOUNCE * CALM_PACE;
        face = 'surprised';
        setTimeout(() => (face = 'happy'), 200);
        return;
      }
      if (y >= 0.86 || left <= 0) {
        face = 'dizzy';
        chirp(left <= 0 ? 'happy' : 'splash');
        setTimeout(() => onfinish(hits, KEEPUP_GOAL), 500);
        return false;
      }
    }),
  );
</script>

<div class="game-head">
  <span class="t-data">{t('game.bounces', { hits })}</span>
  {#if calm}<button type="button" class="btn btn-muted calm-done" id="calmDone" onclick={enough}>{t('game.calmDone')}</button>{:else}<span class="t-data">{Math.ceil(left / 1000)}s</span>{/if}
</div>
<div class="game-field">
  <button type="button" class="ball" style:left="{x * 100}%" style:top="{y * 100}%" aria-label={t('game.keepup.tap')} onpointerdown={bounce}>
    <Pet {stage} {form} expression={face} live={false} label="" />
  </button>
  <div class="floor" aria-hidden="true"></div>
</div>
<p class="game-line" aria-live="polite">{started ? '' : t('game.keepup.start')}</p>

<style>
  .ball {
    position: absolute;
    width: 26%;
    translate: -50% -50%;
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .floor {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 8%;
    background: var(--pet-food-leaf);
    opacity: 0.35;
  }
</style>
