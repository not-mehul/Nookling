<script lang="ts">
  // Rhythm: notes fall down three lanes. Tap a lane as its note crosses the line.
  import { onMount } from 'svelte';
  import { CALM_PACE, RHYTHM_LANES, RHYTHM_MS, onBeat } from '../../domain/games';
  import { t } from '../../i18n/index.svelte';
  import { chirp, note } from '../../platform/sound';
  import { loop } from './loop';

  let { calm = false, onfinish }: { calm?: boolean; onfinish: (hits: number, total: number) => void } = $props();
  interface Note {
    id: number;
    lane: number;
    y: number;
    hit: boolean;
  }
  const LINE = 0.85;
  let notes = $state<Note[]>([]);
  let hits = $state(0);
  let total = 0;
  let left = $state(RHYTHM_MS);
  let flash = $state<number | null>(null);

  /** Calm play ends when you say. */
  function enough() {
    left = 0;
    notes = [];
  }

  function tap(lane: number) {
    const target = notes.find((n) => n.lane === lane && !n.hit && onBeat(n.y, LINE, calm ? 2 : 1));
    flash = lane;
    setTimeout(() => (flash = null), 120);
    if (target) {
      target.hit = true;
      hits += 1;
      note(lane * 2 + (hits % 2));
    } else chirp('boop');
  }
  function key(e: KeyboardEvent) {
    const lane = ['ArrowLeft', 'ArrowDown', 'ArrowRight'].indexOf(e.key);
    if (lane >= 0) {
      e.preventDefault();
      tap(lane);
    }
  }

  onMount(() => {
    let id = 0;
    let beat = 0;
    window.addEventListener('keydown', key);
    const stop = loop((dt) => {
      if (!calm) left = Math.max(0, left - dt);
      beat -= dt;
      if (beat <= 0 && left > 2500) {
        total += 1;
        notes.push({ id: ++id, lane: Math.floor(Math.random() * RHYTHM_LANES), y: -0.05, hit: false });
        beat = [500, 750, 1000][Math.floor(Math.random() * 3)]! / (calm ? CALM_PACE : 1);
      }
      for (const n of notes) n.y += 0.0004 * dt * (calm ? CALM_PACE : 1);
      notes = notes.filter((n) => n.y < 1.05 && !(n.hit && n.y > LINE + 0.1));
      if (left <= 0 && notes.length === 0) {
        onfinish(hits, Math.max(1, total));
        return false;
      }
    });
    return () => {
      stop();
      window.removeEventListener('keydown', key);
    };
  });
  import PixelIcon from '../../pixel/PixelIcon.svelte';
  import { noteArt } from '../../world/art/games-art';
</script>

<div class="game-head">
  <span class="t-data">{t('game.onBeat', { hits })}</span>
  {#if calm}<button type="button" class="btn btn-muted calm-done" id="calmDone" onclick={enough}>{t('game.calmDone')}</button>{:else}<span class="t-data">{Math.ceil(left / 1000)}s</span>{/if}
</div>
<div class="game-field lanes">
  <span class="beat-line" style:top="{LINE * 100}%" aria-hidden="true"></span>
  {#each notes as n (n.id)}
    <span class="note" class:is-hit={n.hit} style:left="{((n.lane + 0.5) / RHYTHM_LANES) * 100}%" style:top="{n.y * 100}%" aria-hidden="true"><PixelIcon art={noteArt(n.hit)} half={10} px={20} size={0} class="fill" /></span>
  {/each}
  {#each Array.from({ length: RHYTHM_LANES }, (_, i) => i) as lane (lane)}
    <button type="button" class="lane" class:is-flash={flash === lane} data-lane={lane} style:left="{(lane / RHYTHM_LANES) * 100}%" aria-label={t('game.rhythm.lane', { lane: lane + 1 })} onpointerdown={() => tap(lane)}></button>
  {/each}
</div>
<p class="t-hint">{t('game.rhythm.about')}</p>

<style>
  .lane {
    position: absolute;
    top: 0;
    bottom: 0;
    width: calc(100% / 3);
    padding: 0;
    background: transparent;
    border: 0;
    border-right: 1px dashed var(--border-soft);
    cursor: pointer;
  }
  .lane.is-flash {
    background: rgba(var(--pet-glow-rgb), 0.16);
  }
  .beat-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border-soft);
  }
  .note {
    position: absolute;
    width: 14%;
    aspect-ratio: 1;
    translate: -50% -50%;
    pointer-events: none;
  }
  .note :global(.fill) {
    width: 100%;
    height: 100%;
  }
  .note.is-hit {
    scale: 1.3;
    opacity: 0.6;
  }
</style>
