<script lang="ts">
  // Quiet time: a calm corner. A window with the sky as it is now and the
  // weather, a soft sound to go with it, "breathe with me", and a bedtime
  // story made from three words you pick. Nothing to do, nothing to win.
  import { onDestroy } from 'svelte';
  import Sheet from './ui/Sheet.svelte';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import Pet from '../pet/Pet.svelte';
  import type { Expression, Form, Stage } from '../pet/types';
  import { ambient, chirp } from '../platform/sound';
  import { petState } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';
  import { STORY_WORDS, tell, type StoryPart, type StoryPick } from '../world/story';
  import { seasonAt } from '../world/treasures';
  import { BREATHE_IN_MS, BREATHE_OUT_MS, skyAt, soundFor, weatherAt } from '../world/weather';
  import Pixels from '../pixel/Pixels.svelte';
  import { WINDOW_GRID, weatherArt, windowArt } from '../world/art/window-art';

  let { name, stage, form, onclose }: { name: string; stage: Stage; form: Form | null; onclose: () => void } = $props();
  type Mode = 'window' | 'breathe' | 'story';
  let mode = $state<Mode>('window');
  const now = Date.now();
  const sky = skyAt(now);
  const weather = weatherAt(now);
  const season = seasonAt(now);
  const fallArt = weatherArt(weather);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Sound
  let stopSound: (() => void) | null = null;
  let listening = $state(false);
  function listen() {
    if (stopSound) {
      stopSound();
      stopSound = null;
      listening = false;
      return;
    }
    stopSound = ambient(soundFor(weather, sky));
    listening = true;
  }

  // ── Breathe with me
  let phase = $state<'in' | 'out' | null>(null);
  let breaths = $state(0);
  let breathTimer: ReturnType<typeof setTimeout> | undefined;
  function breathe() {
    if (phase) {
      clearTimeout(breathTimer);
      phase = null;
      return;
    }
    const cycle = (p: 'in' | 'out') => {
      phase = p;
      if (p === 'in') breaths += 1;
      breathTimer = setTimeout(() => cycle(p === 'in' ? 'out' : 'in'), p === 'in' ? BREATHE_IN_MS : BREATHE_OUT_MS);
    };
    cycle('in');
  }

  // ── Bedtime story
  let pick = $state<Partial<StoryPick>>({});
  let story = $state<string[] | null>(null);
  const ready = $derived(!!(pick.who && pick.where && pick.what));
  const PARTS: StoryPart[] = ['who', 'where', 'what'];
  function choose(part: StoryPart, word: string) {
    pick = { ...pick, [part]: word };
  }
  function read() {
    if (!ready) return;
    const p = pick as StoryPick;
    const words = { name, who: t(`story.who.${p.who}` as MessageKey), where: t(`story.where.${p.where}` as MessageKey), what: t(`story.what.${p.what}` as MessageKey) };
    story = tell(p, name).map(({ key, n }) => t(`${key}.${n}` as MessageKey, words));
    chirp('yawn');
  }
  async function tuckIn() {
    const pet = petState.pet;
    if (pet && !pet.asleep) await petState.lights();
    ui.notify(t('quiet.tuckedIn', { name }), 'success');
    onclose();
  }

  const face = $derived<Expression>(mode === 'story' && story ? 'sleepy' : mode === 'breathe' ? (phase === 'out' ? 'content' : 'happy') : sky === 'night' ? 'sleepy' : 'content');

  onDestroy(() => {
    stopSound?.();
    clearTimeout(breathTimer);
  });
</script>

<Sheet title={t('quiet.title')} {onclose}>
  <div class="segmented modes" role="radiogroup" aria-label={t('quiet.title')}>
    {#each ['window', 'breathe', 'story'] as const as m (m)}
      <button type="button" role="radio" aria-checked={mode === m} data-quiet={m} onclick={() => (mode = m)}>{t(`quiet.${m}` as MessageKey)}</button>
    {/each}
  </div>

  {#if mode === 'window'}
    <div class="window" data-sky={sky} data-weather={weather} id="quietWindow">
      <svg viewBox="0 0 300 220" role="img" aria-label={t('quiet.view', { sky: t(`sky.${sky}` as MessageKey), weather: t(`weather.${weather}` as MessageKey) })}>
        <defs><clipPath id="quietPane"><rect x="20" y="14" width="260" height="176" /></clipPath></defs>
        <Pixels art={windowArt(sky, season, weather)} grid={WINDOW_GRID} />
        {#if fallArt}
          <g clip-path="url(#quietPane)"><g class="fall fall-{weather}"><Pixels art={fallArt} grid={WINDOW_GRID} /></g></g>
        {/if}
      </svg>
      <div class="sitter"><Pet {stage} {form} expression={face} label="" /></div>
    </div>
    <p class="game-line" id="quietLine">{t(`quiet.line.${weather}` as MessageKey, { name, sky: t(`sky.${sky}` as MessageKey).toLowerCase() })}</p>
    <button type="button" class="btn btn-secondary btn-block" id="btnListen" aria-pressed={listening} onclick={listen}>{t(listening ? 'quiet.hush' : 'quiet.listen')}</button>
  {:else if mode === 'breathe'}
    <div class="breather" class:is-in={phase === 'in'} class:is-out={phase === 'out'} class:is-still={reduced}>
      <div class="lungs"><Pet {stage} {form} expression={face} label="" /></div>
    </div>
    <p class="game-line" id="breatheLine" aria-live="polite">{phase ? t(`quiet.breathe.${phase}`) : t('quiet.breathe.start', { name })}</p>
    {#if breaths > 1}<p class="t-hint center">{t('quiet.breaths', { count: breaths - 1 })}</p>{/if}
    <button type="button" class="btn btn-secondary btn-block" id="btnBreathe" onclick={breathe}>{t(phase ? 'quiet.breathe.stop' : 'quiet.breathe.go')}</button>
  {:else if story}
    <div class="story" id="storyText">
      {#each story as para, i (i)}<p>{para}</p>{/each}
    </div>
    <div class="row">
      <button type="button" class="btn btn-primary" id="btnTuckIn" onclick={tuckIn}>{t('quiet.tuckIn', { name })}</button>
      <button type="button" class="btn btn-muted" onclick={() => ((story = null), (pick = {}))}>{t('quiet.another')}</button>
    </div>
  {:else}
    <p class="t-hint">{t('quiet.storyHint', { name })}</p>
    {#each PARTS as part (part)}
      <h3 class="t-field-label">{t(`story.part.${part}` as MessageKey)}</h3>
      <div class="chips" role="radiogroup" aria-label={t(`story.part.${part}` as MessageKey)}>
        {#each STORY_WORDS[part] as word (word)}
          <button type="button" class="chip-btn" role="radio" aria-checked={pick[part] === word} data-word="{part}:{word}" onclick={() => choose(part, word)}>{t(`story.${part}.${word}` as MessageKey)}</button>
        {/each}
      </div>
    {/each}
    <button type="button" class="btn btn-primary btn-block" id="btnTell" disabled={!ready} onclick={read}>{t('quiet.tell')}</button>
  {/if}
</Sheet>

<style>
  .modes {
    margin-bottom: var(--space-3);
  }
  .window {
    position: relative;
  }
  .window svg {
    display: block;
    width: 100%;
  }
  .fall {
    animation: fall 0.9s steps(4, end) infinite;
  }
  .fall-snow {
    animation-duration: 5s;
    animation-timing-function: steps(10, end);
  }
  @keyframes fall {
    from {
      translate: 0 -12px;
    }
    to {
      translate: 0 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fall {
      animation: none;
    }
  }
  .sitter {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 34%;
    translate: -50% 12%;
  }
  .breather {
    display: grid;
    place-items: center;
    min-height: 260px;
  }
  .lungs {
    width: min(60%, 220px);
    transition: scale 4s ease-in-out;
  }
  .is-in .lungs {
    scale: 1.18;
  }
  .is-out .lungs {
    scale: 0.92;
    transition-duration: 6s;
  }
  .is-still .lungs {
    scale: 1;
  }
  .center {
    text-align: center;
  }
  .story p {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    line-height: 1.6;
    margin-bottom: var(--space-3);
    color: var(--text-body);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  h3 {
    margin: var(--space-3) 0 var(--space-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  .chip-btn {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--corner-full);
    border: 1px solid var(--border-soft);
    background: var(--panel-bg-faint);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .chip-btn[aria-checked='true'] {
    border-color: var(--accent-bright);
    background: var(--accent-bright);
    color: var(--on-accent);
  }
  #btnTell,
  #btnListen,
  #btnBreathe {
    margin-top: var(--space-3);
  }
</style>
