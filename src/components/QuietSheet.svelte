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

  let { name, stage, form, onclose }: { name: string; stage: Stage; form: Form | null; onclose: () => void } = $props();
  type Mode = 'window' | 'breathe' | 'story';
  let mode = $state<Mode>('window');
  const now = Date.now();
  const sky = skyAt(now);
  const weather = weatherAt(now);
  const season = seasonAt(now);
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
        <rect class="sky" x="20" y="14" width="260" height="176" rx="6" />
        {#if sky === 'night'}
          {#each [[60, 40], [120, 62], [200, 36], [240, 80], [90, 100], [170, 90]] as [x, y] (`${x}${y}`)}<circle class="star" cx={x} cy={y} r="1.8" />{/each}
          <circle class="moon" cx="226" cy="54" r="16" />
        {:else}
          <circle class="sun" cx={sky === 'dawn' ? 70 : sky === 'dusk' ? 230 : 210} cy={sky === 'day' ? 50 : 140} r="20" />
        {/if}
        <path class="hill" d="M20 160Q90 120 160 150Q220 170 280 140V190H20Z" />
        {#if season !== 'winter'}
          <path class="trunk" d="M70 150V126M232 150V130" />
          <path class="tree tree-{season}" d="M70 128m-14 0a14 18 0 1 0 28 0a14 18 0 1 0 -28 0M232 130m-10 0a10 13 0 1 0 20 0a10 13 0 1 0 -20 0" />
        {/if}
        {#if season === 'winter'}<path class="snowcap" d="M20 160Q90 120 160 150Q220 170 280 140V150Q220 178 160 158Q90 130 20 168Z" />{/if}
        {#if weather === 'cloudy' || weather === 'rain'}
          <g class="clouds"><ellipse cx="90" cy="54" rx="40" ry="14" /><ellipse cx="200" cy="70" rx="46" ry="16" /></g>
        {/if}
        {#if weather === 'rain'}
          <g class="rain">{#each Array.from({ length: 24 }, (_, i) => i) as i (i)}<path d="M{30 + ((i * 37) % 250)} {20 + ((i * 53) % 150)}l-4 12" />{/each}</g>
        {:else if weather === 'snow'}
          <g class="snow">{#each Array.from({ length: 24 }, (_, i) => i) as i (i)}<circle cx={30 + ((i * 37) % 250)} cy={20 + ((i * 53) % 150)} r="2" />{/each}</g>
        {:else if weather === 'mist'}
          <g class="mist"><rect x="20" y="110" width="260" height="20" /><rect x="20" y="140" width="260" height="26" /></g>
        {/if}
        <path class="frame" d="M20 14H280V190H20ZM150 14V190M20 102H280" />
        <rect class="sill" x="8" y="188" width="284" height="14" rx="4" />
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
  .sky {
    fill: var(--pet-fur-sage);
    opacity: 0.55;
  }
  [data-sky='dawn'] .sky {
    fill: var(--pet-food-honey);
    opacity: 0.45;
  }
  [data-sky='dusk'] .sky {
    fill: var(--pet-fur-rust);
    opacity: 0.5;
  }
  [data-sky='night'] .sky {
    fill: var(--pet-pupil);
    opacity: 0.9;
  }
  .sun {
    fill: var(--pet-food-honey);
  }
  .moon,
  .star {
    fill: var(--pet-fur-cream);
  }
  .hill {
    fill: var(--pet-food-leaf);
    opacity: 0.7;
  }
  .snowcap {
    fill: var(--pet-fur-cream);
  }
  .trunk {
    stroke: var(--pet-food-crust);
    stroke-width: 4;
  }
  .tree {
    fill: var(--pet-food-leaf);
  }
  .tree-autumn {
    fill: var(--pet-fur-rust);
  }
  .tree-spring {
    fill: var(--pet-food-berry);
    fill-opacity: 0.7;
  }
  .clouds ellipse {
    fill: var(--pet-fur-cream);
    opacity: 0.85;
  }
  .rain path {
    stroke: var(--pet-fur-cream);
    stroke-width: 1.5;
    stroke-linecap: round;
    animation: fall 0.9s linear infinite;
  }
  .snow circle {
    fill: var(--pet-fur-cream);
    animation: fall 5s linear infinite;
  }
  .mist rect {
    fill: var(--pet-fur-cream);
    opacity: 0.35;
  }
  @keyframes fall {
    from {
      translate: 0 -12px;
    }
    to {
      translate: 0 12px;
    }
  }
  .frame {
    fill: none;
    stroke: var(--pet-food-crust);
    stroke-width: 7;
    stroke-linejoin: round;
  }
  .sill {
    fill: var(--pet-food-crust);
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
  @media (prefers-reduced-motion: reduce) {
    .rain path,
    .snow circle {
      animation: none;
    }
  }
</style>
