<script lang="ts">
  // Play: pick one of three short games. Each lifts Mood and costs Energy.
  import Sheet from './ui/Sheet.svelte';
  import CatchGame from './games/CatchGame.svelte';
  import EchoGame from './games/EchoGame.svelte';
  import SeekGame from './games/SeekGame.svelte';
  import { GAMES, score, type Game } from '../domain/games';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import type { Form, Stage } from '../pet/types';

  let { name, stage, form, onresult, onclose }: { name: string; stage: Stage; form: Form | null; onresult: (game: Game, score: number) => void; onclose: () => void } = $props();
  let game = $state<Game | null>(null);

  function finish(hits: number, total: number) {
    if (!game) return;
    onresult(game, score(game, { hits, total }));
  }
</script>

<Sheet title={game ? t(`game.${game}` as MessageKey) : t('game.title', { name })} {onclose}>
  {#if !game}
    <ul class="games">
      {#each GAMES as g (g)}
        <li>
          <button type="button" class="game-card dd-pressable" data-game={g} onclick={() => (game = g)}>
            <span class="t-card-title">{t(`game.${g}` as MessageKey)}</span>
            <span class="t-hint">{t(`game.${g}.about` as MessageKey)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if game === 'catch'}
    <CatchGame {stage} {form} onfinish={finish} />
  {:else if game === 'seek'}
    <SeekGame {stage} {form} onfinish={finish} />
  {:else}
    <EchoGame {stage} {form} onfinish={finish} />
  {/if}
</Sheet>

<style>
  .games {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .game-card {
    width: 100%;
    display: grid;
    gap: var(--space-1);
    padding: var(--space-4);
    text-align: left;
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
</style>
