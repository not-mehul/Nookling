<script lang="ts">
  // Echo: it shows a little sequence of moves; repeat it. One longer each round.
  import { onMount } from 'svelte';
  import { ECHO_MOVES, check, extend, type EchoMove } from '../../domain/games';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Pet from '../../pet/Pet.svelte';
  import type { Form, Stage } from '../../pet/types';
  import { chirp } from '../../platform/sound';

  let { stage, form, onfinish }: { stage: Stage; form: Form | null; onfinish: (hits: number, total: number) => void } = $props();

  let rig = $state<ReturnType<typeof Pet>>();
  let sequence = $state<EchoMove[]>([]);
  let answer = $state<EchoMove[]>([]);
  let showing = $state(true);
  /** The move being shown, in words too, so it works with reduced motion and screen readers. */
  let current = $state<EchoMove | null>(null);
  let rounds = $state(0);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function show() {
    showing = true;
    answer = [];
    await wait(600);
    for (const move of sequence) {
      current = move;
      chirp('boop');
      await rig?.react(move === 'wiggle' ? 'wiggle' : move);
      await wait(250);
      current = null;
      await wait(150);
    }
    showing = false;
  }

  async function press(move: EchoMove) {
    if (showing) return;
    answer = [...answer, move];
    void rig?.react(move === 'wiggle' ? 'wiggle' : move);
    const result = check(sequence, answer);
    if (result === 'wrong') {
      chirp('sad');
      showing = true;
      await wait(700);
      return onfinish(rounds, Math.max(1, rounds + 1));
    }
    if (result === 'done') {
      rounds += 1;
      chirp('happy');
      sequence = extend(sequence);
      await wait(500);
      await show();
    }
  }

  onMount(() => {
    sequence = extend(extend([]));
    void show();
  });
</script>

<div class="game-head">
  <span class="t-data">{t('game.rounds', { rounds })}</span>
</div>
<div class="stage-area">
  <Pet bind:this={rig} {stage} {form} expression={showing ? 'content' : 'happy'} live={false} label={t('game.echoHelp')} />
</div>
<p class="echo-line" aria-live="polite">{current ? t(`game.move.${current}` as MessageKey) : showing ? t('game.echoWatch') : t('game.echoYou')}</p>
<div class="moves">
  {#each ECHO_MOVES as move (move)}
    <button type="button" class="btn btn-secondary" data-move={move} disabled={showing} onclick={() => press(move)}>{t(`game.move.${move}` as MessageKey)}</button>
  {/each}
</div>

<style>
  .stage-area {
    width: min(60%, 200px);
    margin: var(--space-4) auto 0;
  }
  .echo-line {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.125rem;
    color: var(--text-heading);
    text-align: center;
    min-height: 1.6em;
    margin: var(--space-3) 0;
  }
  .moves {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
  }
</style>
