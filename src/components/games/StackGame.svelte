<script lang="ts">
  // Pebble stack: a pebble slides back and forth; tap to drop it on the stack.
  // What hangs over the edge falls off, so the pebbles get narrower.
  import { onMount } from 'svelte';
  import { CALM_PACE, STACK_GOAL, overlap } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import { chirp, note } from '../../platform/sound';
  import { loop } from './loop';

  let { calm = false, onfinish }: { calm?: boolean; onfinish: (hits: number, total: number) => void } = $props();
  interface Pebble {
    x: number;
    w: number;
  }
  const ROW = 1 / (STACK_GOAL + 3);
  let stack = $state<Pebble[]>([{ x: 0.3, w: 0.4 }]);
  let moving = $state<Pebble>({ x: 0, w: 0.4 });
  let dir = 1;
  let done = $state(false);
  let hits = $derived(stack.length - 1);

  function drop() {
    if (done) return;
    const below = stack[stack.length - 1]!;
    const rest = overlap(moving.x, moving.w, below.x, below.w);
    if (!rest && calm) {
      // Calm play: a miss just slides round again.
      chirp('boop');
      return;
    }
    if (!rest) {
      done = true;
      chirp('splash');
      setTimeout(() => onfinish(hits, STACK_GOAL), 700);
      return;
    }
    stack.push(rest);
    note(stack.length);
    if (stack.length - 1 >= STACK_GOAL) {
      done = true;
      chirp('happy');
      setTimeout(() => onfinish(hits, STACK_GOAL), 700);
      return;
    }
    // Calm play: the pebbles never get too narrow to land.
    const w = calm ? Math.max(rest.w, 0.15) : rest.w;
    moving = { x: dir > 0 ? 0 : 1 - w, w };
  }
  /** Calm play ends when you say. */
  function enough() {
    if (done) return;
    done = true;
    onfinish(hits, STACK_GOAL);
  }
  function key(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      drop();
    }
  }

  onMount(() =>
    loop((dt) => {
      if (done) return false;
      const speed = (0.00035 + (stack.length - 1) * 0.00003) * (calm ? CALM_PACE : 1);
      moving.x += dir * speed * dt;
      if (moving.x + moving.w >= 1) {
        moving.x = 1 - moving.w;
        dir = -1;
      } else if (moving.x <= 0) {
        moving.x = 0;
        dir = 1;
      }
    }),
  );
</script>

<div class="game-head">
  <span class="t-data">{t('game.stacked', { hits, of: STACK_GOAL })}</span>
  {#if calm}<button type="button" class="btn btn-muted calm-done" id="calmDone" onclick={enough}>{t('game.calmDone')}</button>{/if}
</div>
<div class="game-field" id="stackField" role="button" tabindex="0" aria-label={t('game.stack.drop')} onpointerdown={drop} onkeydown={key}>
  {#each stack as p, i (i)}
    <span class="pebble" style:left="{p.x * 100}%" style:width="{p.w * 100}%" style:bottom="{i * ROW * 100}%" style:height="{ROW * 100}%"></span>
  {/each}
  {#if !done}
    <span class="pebble is-moving" style:left="{moving.x * 100}%" style:width="{moving.w * 100}%" style:bottom="{stack.length * ROW * 100 + 4}%" style:height="{ROW * 100}%"></span>
  {/if}
</div>
<p class="t-hint">{t('game.stack.about')}</p>

<style>
  /* Pixel blocks: stepped corners, a lit top and a shaded base. */
  .pebble {
    --c: var(--pet-fur-shade);
    position: absolute;
    background: var(--c);
    clip-path: polygon(0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px));
    box-shadow:
      inset 0 3px 0 color-mix(in oklab, var(--c) 58%, var(--pet-eye)),
      inset 0 -4px 0 color-mix(in oklab, var(--c) 70%, var(--pet-mouth)),
      inset 0 0 0 1.5px color-mix(in oklab, var(--c) 40%, var(--pet-pupil));
  }
  .pebble:nth-child(odd) {
    --c: var(--pet-fur-sage);
  }
  .pebble.is-moving {
    --c: var(--pet-fur-cream);
  }
</style>
