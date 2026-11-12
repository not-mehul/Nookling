<script lang="ts">
  // Tricks: pick one, then swipe its pattern on the pad. Three good lessons
  // and it knows it; after that it shows off now and then by itself.
  import Sheet from './ui/Sheet.svelte';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import Pet from '../pet/Pet.svelte';
  import type { Expression, Form, Stage } from '../pet/types';
  import { buzz } from '../platform/haptics';
  import { chirp } from '../platform/sound';
  import { worldState } from '../state/world.svelte';
  import { ui } from '../state/ui.svelte';
  import { LEARN_AFTER, TRICKS, follows, swipeOf, type Swipe, type Trick } from '../world/tricks';

  let { name, stage, form, onclose }: { name: string; stage: Stage; form: Form | null; onclose: () => void } = $props();
  let rig = $state<ReturnType<typeof Pet>>();
  let trick = $state<Trick | null>(null);
  let swipes = $state<Swipe[]>([]);
  let face = $state<Expression>('content');
  let line = $state('');
  let from: { x: number; y: number } | null = null;
  const ARROW: Record<Swipe, string> = { up: '↑', down: '↓', left: '←', right: '→' };
  const KEYS: Record<string, Swipe> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const lessons = (id: string) => worldState.world.tricks[id] ?? 0;

  function choose(next: Trick) {
    trick = next;
    swipes = [];
    line = lessons(next.id) >= LEARN_AFTER ? t('tricks.knows', { name }) : t('tricks.show');
  }

  async function swiped(s: Swipe) {
    if (!trick) return;
    swipes = [...swipes, s];
    buzz('tick');
    const how = follows(trick.pattern, swipes);
    if (how === 'more') return;
    swipes = [];
    if (how === 'wrong') {
      face = 'surprised';
      line = t('tricks.confused', { name });
      chirp('boop');
      setTimeout(() => (face = 'content'), 700);
      return;
    }
    const learned = await worldState.lesson(trick.id);
    face = 'happy';
    chirp('happy');
    await rig?.react(trick.move);
    setTimeout(() => (face = 'content'), 600);
    const n = lessons(trick.id);
    line = learned ? t('tricks.learned', { name, trick: t(`trick.${trick.id}` as MessageKey) }) : n >= LEARN_AFTER ? t('tricks.again', { name }) : t('tricks.progress', { left: LEARN_AFTER - n });
    if (learned) ui.notify(line, 'celebrate');
  }

  function down(e: PointerEvent) {
    from = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function up(e: PointerEvent) {
    if (!from) return;
    const s = swipeOf(e.clientX - from.x, e.clientY - from.y);
    from = null;
    if (s) void swiped(s);
  }
  function key(e: KeyboardEvent) {
    const s = KEYS[e.key];
    if (!s) return;
    e.preventDefault();
    void swiped(s);
  }
</script>

<Sheet title={trick ? t(`trick.${trick.id}` as MessageKey) : t('tricks.title', { name })} {onclose}>
  {#if !trick}
    <p class="t-hint">{t('tricks.about', { name })}</p>
    <ul class="tricks">
      {#each TRICKS as tr (tr.id)}
        {@const n = lessons(tr.id)}
        <li>
          <button type="button" class="trick dd-pressable" data-trick={tr.id} onclick={() => choose(tr)}>
            <span class="t-card-title">{t(`trick.${tr.id}` as MessageKey)}</span>
            <span class="t-data pattern" aria-hidden="true">{tr.pattern.map((p) => ARROW[p]).join(' ')}</span>
            <span class="t-hint">{n >= LEARN_AFTER ? t('tricks.known') : t('tricks.lessons', { n, of: LEARN_AFTER })}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="stage"><Pet bind:this={rig} {stage} {form} expression={face} label="" /></div>
    <p class="t-data pattern big" aria-label={t('tricks.patternLabel', { pattern: trick.pattern.map((p) => t(`tricks.dir.${p}` as MessageKey)).join(', ') })}>
      {#each trick.pattern as p, i (i)}<span class:is-done={i < swipes.length}>{ARROW[p]}</span>{/each}
    </p>
    <div class="pad" id="trickPad" role="button" tabindex="0" aria-label={t('tricks.pad')} onpointerdown={down} onpointerup={up} onpointercancel={() => (from = null)} onkeydown={key}>
      {t('tricks.swipe')}
    </div>
    <p class="game-line" id="trickLine" aria-live="polite">{line}</p>
    <button type="button" class="btn btn-muted" onclick={() => (trick = null)}>{t('tricks.back')}</button>
  {/if}
</Sheet>

<style>
  .tricks {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .trick {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-1) var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-align: left;
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .trick .t-hint {
    grid-column: 1 / -1;
  }
  .pattern {
    letter-spacing: 0.2em;
  }
  .big {
    text-align: center;
    font-size: 1.5rem;
    color: var(--text-faint);
  }
  .big .is-done {
    color: var(--accent-bright);
  }
  .stage {
    width: min(48%, 180px);
    margin: 0 auto;
  }
  .pad {
    display: grid;
    place-items: center;
    height: 140px;
    border: 2px dashed var(--border-soft);
    border-radius: var(--corner-lg);
    color: var(--text-faint);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
