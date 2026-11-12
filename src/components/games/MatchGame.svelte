<script lang="ts">
  // Memory match: turn two cards; a pair of the same food stays face up.
  import { MATCH_PAIRS, deck } from '../../domain/games';
  import { FOODS, foodById } from '../../domain/foods';
  import { t } from '../../i18n/index.svelte';
  import { chirp } from '../../platform/sound';
  import FoodIcon from '../FoodIcon.svelte';

  let { onfinish }: { onfinish: (hits: number, total: number) => void } = $props();
  const ids = FOODS.map((f) => f.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, MATCH_PAIRS);
  let cards = $state(deck(ids).map((id, i) => ({ key: i, id, up: false, done: false })));
  let turns = $state(0);
  let open: number[] = [];
  let busy = false;

  function flip(i: number) {
    const card = cards[i]!;
    if (busy || card.up || card.done) return;
    card.up = true;
    open.push(i);
    chirp('pop');
    if (open.length < 2) return;
    turns += 1;
    const [a, b] = open.map((k) => cards[k]!);
    open = [];
    if (a!.id === b!.id) {
      a!.done = b!.done = true;
      chirp('happy');
      if (cards.every((c) => c.done)) setTimeout(() => onfinish(MATCH_PAIRS, turns), 600);
      return;
    }
    busy = true;
    setTimeout(() => {
      a!.up = b!.up = false;
      busy = false;
    }, 800);
  }
</script>

<div class="game-head">
  <span class="t-data">{t('game.turns', { turns })}</span>
  <span class="t-data">{t('game.pairs', { found: cards.filter((c) => c.done).length / 2, of: MATCH_PAIRS })}</span>
</div>
<div class="cards">
  {#each cards as card, i (card.key)}
    {@const food = foodById(card.id)}
    <button type="button" class="card" class:is-up={card.up || card.done} class:is-done={card.done} data-card={card.id} aria-label={card.up || card.done ? (food?.name ?? '') : t('game.match.hidden')} onclick={() => flip(i)}>
      {#if (card.up || card.done) && food}<FoodIcon {food} size={44} />{/if}
    </button>
  {/each}
</div>
<p class="t-hint">{t('game.match.about')}</p>

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }
  .card {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 4;
    padding: 0;
    border-radius: var(--corner-md);
    border: 1px solid var(--border-soft);
    background: repeating-linear-gradient(45deg, var(--panel-bg-faint) 0 6px, transparent 6px 12px), var(--pet-fur-shade);
    cursor: pointer;
    transition: transform 220ms ease;
  }
  .card.is-up {
    background: var(--panel-bg);
    transform: rotateY(180deg) scaleX(-1);
  }
  .card.is-done {
    opacity: 0.75;
  }
  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
  }
</style>
