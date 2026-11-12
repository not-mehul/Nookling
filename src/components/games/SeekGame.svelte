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
      <svg viewBox="-30 -30 60 60" aria-hidden="true">
        {#if s === 'cushion'}
          <path d="M-26 6Q-28 -14 -10 -14H10Q28 -14 26 6Q28 22 10 22H-10Q-28 22 -26 6Z" class="thing" />
          <path d="M-14 -4H14M-14 10H14" class="seam" />
        {:else if s === 'basket'}
          <path d="M-24 -6H24L18 22H-18Z" class="thing" />
          <path d="M-18 -6Q0 -30 18 -6" class="seam" />
          <path d="M-20 4H20M-19 13H19" class="seam" />
        {:else if s === 'teapot'}
          <ellipse cx="0" cy="6" rx="18" ry="15" class="thing" />
          <path d="M16 0Q28 -4 26 -14M-18 2Q-28 4 -24 14" class="seam" />
          <circle cx="0" cy="-11" r="4" class="thing" />
        {:else}
          <rect x="-24" y="-16" width="14" height="38" rx="2" class="thing" />
          <rect x="-8" y="-22" width="14" height="44" rx="2" class="thing" />
          <rect x="8" y="-12" width="16" height="34" rx="2" class="thing" transform="rotate(8 16 5)" />
        {/if}
      </svg>
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
  .thing {
    fill: var(--pet-fur-shade);
    stroke: var(--pet-outline);
    stroke-width: 2;
  }
  .seam {
    fill: none;
    stroke: var(--pet-outline);
    stroke-width: 2;
    stroke-linecap: round;
  }
  @media (prefers-reduced-motion: reduce) {
    .spot.is-wrong {
      animation: none;
    }
  }
</style>
