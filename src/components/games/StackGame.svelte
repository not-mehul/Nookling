<script lang="ts">
  // Pebble stack: a pebble slides back and forth; tap to drop it on the stack.
  // What hangs over the edge falls off, so the pebbles get narrower.
  import { onMount } from 'svelte';
  import { STACK_GOAL, overlap } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import { chirp, note } from '../../platform/sound';
  import { loop } from './loop';

  let { onfinish }: { onfinish: (hits: number, total: number) => void } = $props();
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
    moving = { x: dir > 0 ? 0 : 1 - rest.w, w: rest.w };
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
      const speed = 0.00035 + (stack.length - 1) * 0.00003;
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
  .pebble {
    position: absolute;
    border-radius: 999px;
    background: var(--pet-fur-shade);
    border: 1px solid var(--border-soft);
  }
  .pebble:nth-child(odd) {
    background: var(--pet-fur-sage);
  }
  .pebble.is-moving {
    background: var(--pet-fur-cream);
  }
</style>
