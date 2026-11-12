<script lang="ts">
  // Catch: berries fall; move the pet under them. Drag, or use the arrow keys.
  import { onMount } from 'svelte';
  import { CATCH_MS, caught } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';

  let { stage, form, onfinish }: { stage: Stage; form: Form | null; onfinish: (hits: number, total: number) => void } = $props();

  interface Berry {
    id: number;
    x: number;
    y: number;
    speed: number;
  }
  let field = $state<HTMLDivElement>();
  let petX = $state(0.5);
  let berries = $state<Berry[]>([]);
  let hits = $state(0);
  let total = $state(0);
  let left = $state(CATCH_MS);
  let happy = $state(false);

  function aim(e: PointerEvent) {
    const box = field?.getBoundingClientRect();
    if (box) petX = Math.min(0.92, Math.max(0.08, (e.clientX - box.left) / box.width));
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') petX = Math.max(0.08, petX - 0.08);
    else if (e.key === 'ArrowRight') petX = Math.min(0.92, petX + 0.08);
    else return;
    e.preventDefault();
  }

  onMount(() => {
    let id = 0;
    let last = performance.now();
    let spawn = 0;
    let frame = requestAnimationFrame(function step(now) {
      const dt = Math.min(64, now - last);
      last = now;
      left = Math.max(0, left - dt);
      spawn -= dt;
      if (spawn <= 0 && left > 1500) {
        berries = [...berries, { id: ++id, x: 0.08 + Math.random() * 0.84, y: -0.05, speed: 0.00035 + Math.random() * 0.0002 }];
        spawn = 650 + Math.random() * 350;
      }
      const next: Berry[] = [];
      for (const b of berries) {
        const y = b.y + b.speed * dt;
        if (y >= 0.8) {
          total += 1;
          if (caught(b.x, petX)) {
            hits += 1;
            chirp('chomp');
            happy = true;
            setTimeout(() => (happy = false), 300);
          }
          continue;
        }
        next.push({ ...b, y });
      }
      berries = next;
      if (left <= 0 && !berries.length) return onfinish(hits, total);
      frame = requestAnimationFrame(step);
    });
    field?.focus();
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="game-head">
  <span class="t-data">{t('game.caught', { hits })}</span>
  <span class="t-data">{Math.ceil(left / 1000)}s</span>
</div>
<div class="field" bind:this={field} tabindex="0" role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(petX * 100)} aria-label={t('game.catchHelp')} onpointermove={aim} onpointerdown={aim} onkeydown={key}>
  {#each berries as b (b.id)}
    <span class="berry" style:left="{b.x * 100}%" style:top="{b.y * 100}%" aria-hidden="true"></span>
  {/each}
  <div class="catcher" style:left="{petX * 100}%">
    <Pet {stage} {form} expression={happy ? 'eating' : 'happy'} live={false} label={t('game.catchHelp')} />
  </div>
</div>
<p class="t-hint">{t('game.catchHelp')}</p>

<style>
  .game-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-2);
  }
  .field {
    position: relative;
    aspect-ratio: 3 / 4;
    max-height: 55dvh;
    width: 100%;
    overflow: hidden;
    border-radius: var(--corner-lg);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    touch-action: none;
  }
  .berry {
    position: absolute;
    width: 18px;
    height: 18px;
    margin-left: -9px;
    border-radius: 50%;
    background: var(--pet-food-berry);
    border: 1.5px solid var(--pet-outline);
  }
  .catcher {
    position: absolute;
    bottom: 0;
    width: 30%;
    translate: -50% 18%;
  }
</style>
