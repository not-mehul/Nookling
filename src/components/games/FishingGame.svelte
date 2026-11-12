<script lang="ts">
  // Puddle fishing: cast, wait for the float to dip, and tap while it's under.
  import { BITE_MS, FISHING_CASTS, whatBit, type Catch } from '../../domain/games';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';

  let { stage, form, onfinish }: { stage: Stage; form: Form | null; onfinish: (hits: number, total: number) => void } = $props();
  let cast = $state(0);
  let hits = $state(0);
  let phase = $state<'ready' | 'waiting' | 'bite' | 'caught' | 'missed'>('ready');
  let got = $state<Catch | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bag = $state<Catch[]>([]);

  function tap() {
    if (phase === 'ready' || phase === 'caught' || phase === 'missed') {
      if (cast >= FISHING_CASTS) return onfinish(hits, FISHING_CASTS);
      cast += 1;
      got = null;
      phase = 'waiting';
      chirp('splash');
      timer = setTimeout(bite, 1200 + Math.random() * 2800);
    } else if (phase === 'bite') {
      clearTimeout(timer);
      hits += 1;
      got = whatBit();
      bag.push(got);
      phase = 'caught';
      chirp('happy');
    } else {
      // Too soon: the float wasn't under yet. It swims off.
      clearTimeout(timer);
      phase = 'missed';
      chirp('boop');
    }
  }
  function bite() {
    phase = 'bite';
    chirp('pop');
    timer = setTimeout(() => {
      phase = 'missed';
    }, BITE_MS);
  }
  $effect(() => () => clearTimeout(timer));
</script>

<div class="game-head">
  <span class="t-data">{t('game.round', { round: cast, of: FISHING_CASTS })}</span>
  <span class="t-data">{t('game.landed', { hits })}</span>
</div>
<button type="button" class="game-field pond" id="fishingField" data-phase={phase} onclick={tap} aria-label={t(`game.fishing.${phase}` as MessageKey)}>
  <svg viewBox="0 0 100 133" aria-hidden="true">
    <ellipse cx="50" cy="92" rx="44" ry="20" class="water" />
    <ellipse cx="50" cy="92" rx="30" ry="12" class="ripple" />
    <path d="M22 30Q52 10 64 86" class="line" />
    <g class="float" class:is-under={phase === 'bite'} class:is-bob={phase === 'waiting'}>
      <circle cx="64" cy="86" r="4" class="float-top" />
      <path d="M60 87H68" class="line" />
    </g>
  </svg>
  <span class="fisher"><Pet {stage} {form} expression={phase === 'caught' ? 'happy' : phase === 'bite' ? 'surprised' : 'content'} live={false} label="" /></span>
</button>
<p class="game-line" aria-live="polite">
  {got ? t(`game.fishing.got.${got}` as MessageKey) : t(`game.fishing.${phase}` as MessageKey)}
</p>
<p class="t-hint">{bag.length ? bag.map((c) => t(`game.fishing.short.${c}` as MessageKey)).join(' · ') : t('game.fishing.about')}</p>

<style>
  .pond {
    display: block;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .water {
    fill: rgba(var(--pet-glow-rgb), 0.14);
    stroke: var(--border-soft);
  }
  .ripple {
    fill: none;
    stroke: var(--border-soft);
    stroke-dasharray: 3 4;
  }
  .line {
    fill: none;
    stroke: var(--text-faint);
    stroke-width: 0.6;
  }
  .float-top {
    fill: var(--pet-food-berry);
  }
  .float {
    transition: translate 120ms ease-out;
  }
  .float.is-under {
    translate: 0 4px;
  }
  .float.is-bob {
    animation: bob 1.6s ease-in-out infinite;
  }
  @keyframes bob {
    50% {
      translate: 0 1px;
    }
  }
  .fisher {
    position: absolute;
    left: 4%;
    top: 8%;
    width: 30%;
  }
  @media (prefers-reduced-motion: reduce) {
    .float.is-bob {
      animation: none;
    }
  }
</style>
