<script lang="ts">
  // Hide and seek: it hides behind one of the nook's things. Find it.
  import { onMount } from 'svelte';
  import { SEEK_ROUNDS, SEEK_SPOTS, hidingSpot, type SeekSpot } from '../../domain/games';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';

  let { stage, form, onfinish }: { stage: Stage; form: Form | null; onfinish: (hits: number, total: number) => void } = $props();

  let round = $state(0);
  let hits = $state(0);
  let spot = $state<SeekSpot>('cushion');
  let phase = $state<'hiding' | 'seeking' | 'found' | 'missed'>('hiding');
  let picked = $state<SeekSpot | null>(null);

  function next() {
    if (round >= SEEK_ROUNDS) return onfinish(hits, SEEK_ROUNDS);
    round += 1;
    spot = hidingSpot(Math.random, spot);
    picked = null;
    phase = 'hiding';
    setTimeout(() => (phase = 'seeking'), 900);
  }

  function look(s: SeekSpot) {
    if (phase !== 'seeking') return;
    picked = s;
    if (s === spot) {
      hits += 1;
      phase = 'found';
      chirp('giggle');
    } else {
      phase = 'missed';
      chirp('boop');
    }
    setTimeout(next, 1200);
  }

  onMount(next);
  import PixelIcon from '../../pixel/PixelIcon.svelte';
  import { spotArt } from '../../world/art/games-art';
</script>

<div class="game-head">
  <span class="t-data">{t('game.round', { round, of: SEEK_ROUNDS })}</span>
  <span class="t-data">{t('game.found', { hits })}</span>
</div>
<p class="seek-line" aria-live="polite">{t(`game.seek.${phase}` as MessageKey)}</p>
<div class="spots">
  {#each SEEK_SPOTS as s (s)}
    <button type="button" class="spot" class:is-wrong={phase === 'missed' && picked === s} data-spot={s} disabled={phase !== 'seeking'} aria-label={t(`game.spot.${s}` as MessageKey)} onclick={() => look(s)}>
      {#if (phase === 'found' || phase === 'missed') && s === spot}
        <span class="peek"><Pet {stage} {form} expression={phase === 'found' ? 'happy' : 'surprised'} live={false} label="" /></span>
      {/if}
      <PixelIcon art={spotArt(s)} half={30} px={30} size={0} class="spot-art" />
    </button>
  {/each}
</div>

<style>
  .game-head {
    display: flex;
    justify-content: space-between;
  }
  .seek-line {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.125rem;
    color: var(--text-heading);
    text-align: center;
    margin: var(--space-4) 0;
  }
  .spots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }
  .spot {
    position: relative;
    aspect-ratio: 1;
    min-height: 64px;
    padding: var(--space-2);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    cursor: pointer;
  }
  .spot:disabled {
    cursor: default;
  }
  .spot.is-wrong {
    animation: no 320ms ease-in-out;
  }
  @keyframes no {
    25% {
      translate: -4px 0;
    }
    75% {
      translate: 4px 0;
    }
  }
  .peek {
    position: absolute;
    left: 15%;
    right: 15%;
    top: -40%;
  }
  .spot :global(.spot-art) {
    width: 100%;
    height: 100%;
  }
  @media (prefers-reduced-motion: reduce) {
    .spot.is-wrong {
      animation: none;
    }
  }
</style>
