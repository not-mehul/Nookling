<script lang="ts">
  // Play: the arcade. Each game lifts Mood and costs a little Energy; one is
  // the game of the day, with a small extra, and nothing lost by skipping it.
  import Sheet from './ui/Sheet.svelte';
  import BubblesGame from './games/BubblesGame.svelte';
  import CatchGame from './games/CatchGame.svelte';
  import EchoGame from './games/EchoGame.svelte';
  import FishingGame from './games/FishingGame.svelte';
  import KeepUpGame from './games/KeepUpGame.svelte';
  import MatchGame from './games/MatchGame.svelte';
  import RhythmGame from './games/RhythmGame.svelte';
  import SeekGame from './games/SeekGame.svelte';
  import StackGame from './games/StackGame.svelte';
  import { GAMES, QUICK, gameOfDay, score, type Game } from '../domain/games';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import type { Form, Stage } from '../pet/types';
  import { settings } from '../state/settings.svelte';
  import { worldState } from '../state/world.svelte';
  import { Switch } from 'dusk-dawn';
  import { dayKey } from '../world/arcade';

  let { name, stage, form, onresult, onclose }: { name: string; stage: Stage; form: Form | null; onresult: (game: Game, score: number) => void; onclose: () => void } = $props();
  let game = $state<Game | null>(null);
  const now = Date.now();
  const daily = gameOfDay(now);
  const dailyDone = $derived(worldState.world.arcade.dailyOn === dayKey(now));
  const order = [daily, ...GAMES.filter((g) => g !== daily)];
  const calm = $derived(settings.current.calmPlay);

  function finish(hits: number, total: number) {
    if (!game) return;
    onresult(game, score(game, { hits, total }));
  }
</script>

<Sheet title={game ? t(`game.${game}` as MessageKey) : t('game.title', { name })} {onclose}>
  {#if !game}
    <div class="calm-switch">
      <Switch id="switchCalmPlay" checked={calm} label={t('game.calm')} hint={t('game.calmHint')} onchange={(on) => settings.update({ calmPlay: on })} />
    </div>
    <ul class="games">
      {#each order as g (g)}
        {@const best = worldState.world.arcade.best[g]}
        <li>
          <button type="button" class="game-card dd-pressable" class:is-daily={g === daily} data-game={g} onclick={() => (game = g)}>
            <span class="game-title">
              <span class="t-card-title">{t(`game.${g}` as MessageKey)}</span>
              {#if g === daily}<span class="badge t-data" id="dailyBadge">{t(dailyDone ? 'game.dailyDone' : 'game.daily')}</span>{/if}
            </span>
            <span class="t-hint">{t(`game.${g}.about` as MessageKey)}</span>
            <span class="t-hint meta">
              {calm && QUICK.has(g) ? t('game.calmMeta') : QUICK.has(g) ? t('game.quick') : t('game.unhurried')}{#if best !== undefined}&nbsp;· {t('game.best', { stars: '★'.repeat(Math.round(best * 3)) || '·' })}{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if game === 'catch'}
    <CatchGame {stage} {form} {calm} onfinish={finish} />
  {:else if game === 'seek'}
    <SeekGame {stage} {form} onfinish={finish} />
  {:else if game === 'echo'}
    <EchoGame {stage} {form} onfinish={finish} />
  {:else if game === 'bubbles'}
    <BubblesGame {stage} {form} {calm} onfinish={finish} />
  {:else if game === 'keepup'}
    <KeepUpGame {stage} {form} {calm} onfinish={finish} />
  {:else if game === 'match'}
    <MatchGame onfinish={finish} />
  {:else if game === 'fishing'}
    <FishingGame {stage} {form} {calm} onfinish={finish} />
  {:else if game === 'stack'}
    <StackGame {calm} onfinish={finish} />
  {:else}
    <RhythmGame {calm} onfinish={finish} />
  {/if}
</Sheet>

<style>
  .calm-switch {
    margin-bottom: var(--space-3);
  }
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
  .game-card.is-daily {
    border-color: var(--accent-bright);
  }
  .game-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .badge {
    padding: 0 var(--space-2);
    border-radius: var(--corner-full);
    background: var(--accent-bright);
    color: var(--on-accent);
    font-size: 0.75rem;
  }
  .meta {
    font-size: 0.75rem;
  }
</style>
