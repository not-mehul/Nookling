<script lang="ts">
  // The Nook: the pet in its room, its needs, and the care buttons.
  import { WavyProgress } from 'dusk-dawn';
  import { onMount } from 'svelte';
  import Adopt from './Adopt.svelte';
  import FoodIcon from './FoodIcon.svelte';
  import FoodSheet from './FoodSheet.svelte';
  import NeedMeter from './NeedMeter.svelte';
  import Icon from './ui/Icon.svelte';
  import type { Food } from '../domain/foods';
  import { NEEDS, type PetEvent, type Refusal } from '../domain/pet';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { cheer } from '../lib/delight';
  import Pet from '../pet/Pet.svelte';
  import { NEED_WORDS, glowFor, grubbiness, restingFace, status, summarise } from '../pet/behaviour';
  import type { Expression, Reaction } from '../pet/types';
  import { petState, type CareResult } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';

  const pet = $derived(petState.pet);
  const name = $derived(pet?.name ?? '');

  let rig = $state<ReturnType<typeof Pet>>();
  let frame = $state<HTMLElement>();
  /** A face held for a moment over the resting one, after a touch or a meal. */
  let held = $state<Expression | null>(null);
  let chomp = $state(false);
  let look = $state({ x: 0, y: 0 });
  let foodOpen = $state(false);
  let flying = $state<Food | null>(null);
  let welcome = $state('');
  let busy = $state(false);

  const face = $derived(pet ? (held ?? restingFace(pet)) : 'content');
  const statusLine = $derived(pet ? t(`status.${status(pet)}` as MessageKey, { name }) : '');
  let heldTimer: ReturnType<typeof setTimeout> | undefined;

  function hold(expression: Expression, ms = 1400) {
    clearTimeout(heldTimer);
    held = expression;
    heldTimer = setTimeout(() => (held = null), ms);
  }

  function move(kind: Reaction) {
    void rig?.react(kind);
  }

  function refused(why: Refusal) {
    ui.notify(t(`refuse.${why}` as MessageKey, { name }), 'info');
    if (why === 'full') {
      hold('grumpy', 900);
      move('shiver');
    }
  }

  async function care(task: () => Promise<CareResult>, done: MessageKey, after?: () => void) {
    if (busy) return;
    busy = true;
    try {
      const result = await task();
      if (!result.ok) return refused(result.why);
      after?.();
      ui.notify(t(done, { name }), 'success');
    } finally {
      busy = false;
    }
  }

  // ── Touch: a tap is a boop; on the seedpod it is warmth.
  async function tapPet() {
    if (!pet) return;
    if (pet.stage === 'seedpod') {
      move('wobble');
      if (await petState.warm()) {
        cheer(frame, { count: 80 });
        ui.notify(t('pod.hatched', { name }), 'celebrate');
        hold('surprised', 1600);
      }
      return;
    }
    const result = await petState.stroke('boop');
    if (!result.ok) return;
    if (pet.asleep) return move('shiver');
    move('squish');
    hold('happy', 900);
  }

  // ── Feeding: the food flies to its mouth, three chomps, then it counts.
  async function pick(food: Food) {
    foodOpen = false;
    if (!pet || busy) return;
    busy = true;
    try {
      flying = food;
      held = 'eating';
      chomp = false;
      await wait(520);
      flying = null;
      for (let i = 0; i < 3; i++) {
        chomp = true;
        await wait(170);
        chomp = false;
        await wait(170);
      }
      const result = await petState.feed(food);
      held = null;
      if (!result.ok) return refused(result.why);
      hold('happy');
      move('bounce');
      ui.notify(t('done.fed', { name, food: food.name.toLowerCase() }), 'success');
    } finally {
      held = held === 'eating' ? null : held;
      busy = false;
    }
  }

  function wait(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── What happened while the app was closed, and as it happens.
  function tell(events: PetEvent[]) {
    for (const e of events) {
      if (e.kind === 'grew' && e.stage && e.stage !== 'sprout') {
        cheer(frame, { count: 90 });
        ui.notify(t(e.stage === 'grown' ? 'event.grew.grown' : 'event.grew.nookling', { name }), 'celebrate');
      } else if (e.kind === 'unwell') ui.notify(t('event.unwell', { name }), 'info');
      else if (e.kind === 'recovered') ui.notify(t('event.recovered', { name }), 'success');
    }
  }

  function welcomeLine(events: PetEvent[]): string {
    const parts = summarise(events).map(({ kind, count }) => t(`away.${kind}` as MessageKey, { count }));
    if (!parts.length) return '';
    const list = new Intl.ListFormat('en', { type: 'conjunction' }).format(parts);
    return t('welcome.line', { name, list });
  }

  onMount(() => {
    const away = petState.takeAway();
    welcome = welcomeLine(away);
    tell(away.filter((e) => e.kind === 'grew'));
    const stop = petState.onEvents(tell);

    // Idle beats: now and then it looks around.
    let timer: ReturnType<typeof setTimeout>;
    const beat = () => {
      timer = setTimeout(
        () => {
          if (pet && !pet.asleep && pet.stage !== 'seedpod' && !held) {
            look = { x: Math.random() * 2 - 1, y: Math.random() * 1.2 - 0.6 };
            setTimeout(() => (look = { x: 0, y: 0 }), 1600);
          }
          beat();
        },
        8000 + Math.random() * 12000,
      );
    };
    beat();
    return () => {
      stop();
      clearTimeout(timer);
      clearTimeout(heldTimer);
    };
  });
</script>

<div id="viewNook" role="tabpanel" aria-labelledby="tabNook">
  {#if !petState.ready}
    <!-- Loading the pet: a moment at most. -->
  {:else if !pet}
    <Adopt />
  {:else}
    <section class="panel room" class:is-night={pet.asleep} aria-label={t('tabs.nook')}>
      <div class="pet-frame" bind:this={frame}>
        <button type="button" class="pet-button" id="petButton" aria-label={pet.stage === 'seedpod' ? t('pod.label') : statusLine} onclick={tapPet}>
          <Pet
            bind:this={rig}
            stage={pet.stage}
            form={pet.form}
            expression={face}
            {look}
            {chomp}
            glow={glowFor(pet)}
            grubby={grubbiness(pet)}
            unwell={pet.unwell}
            label={statusLine}
          />
        </button>
        {#if flying}
          <div class="flying-food" aria-hidden="true"><FoodIcon food={flying} size={40} /></div>
        {/if}
        {#each [0, 1, 2].slice(0, pet.messes) as i (i)}
          <svg class="mess mess-{i}" viewBox="-12 -8 24 16" aria-hidden="true"><path d="M-10 6Q-10 -2 -4 -3Q-2 -8 3 -6Q9 -6 10 6Z" /></svg>
        {/each}
      </div>
      <p class="status-line" id="statusLine" aria-live="polite">{statusLine}</p>
      {#if welcome}<p class="t-hint welcome" id="welcomeLine">{welcome}</p>{/if}
      {#if pet.stage === 'seedpod'}
        <div class="warmth">
          <WavyProgress value={pet.warmth} label={t('pod.warmth')} />
          <p class="t-hint">{t('pod.hint')}</p>
        </div>
      {/if}
    </section>

    {#if pet.stage !== 'seedpod'}
      <section class="panel needs" aria-label={t('needs.label')}>
        {#each NEEDS as need (need)}
          <NeedMeter id="need-{need}" label={t(`need.${need}` as MessageKey)} value={pet.needs[need]} words={Object.fromEntries(Object.entries(NEED_WORDS[need]).map(([k, v]) => [k, t(v as MessageKey)])) as Record<'full' | 'fine' | 'low' | 'empty', string>} />
        {/each}
      </section>

      <div class="care">
        <button type="button" class="btn btn-secondary" id="btnFeed" disabled={busy} onclick={() => (pet.asleep ? refused('asleep') : (foodOpen = true))}>
          <Icon name="feed" size={18} />{t('care.feed')}
        </button>
        <button type="button" class="btn btn-secondary" id="btnPlay" disabled={busy} onclick={() => care(() => petState.play('toss', 0.5), 'done.played', () => (hold('happy'), move('hop')))}>
          <Icon name="play" size={18} />{t('care.play')}
        </button>
        <button type="button" class="btn btn-secondary" id="btnClean" disabled={busy} onclick={() => care(() => petState.clean(), 'done.cleaned', () => (hold('happy'), move('wiggle')))}>
          <Icon name="clean" size={18} />{t('care.clean')}
        </button>
        <button type="button" class="btn btn-secondary" id="btnLights" disabled={busy} onclick={() => care(() => petState.lights(), pet.asleep ? 'done.lightsOn' : 'done.lightsOff')}>
          <Icon name={pet.asleep ? 'sun' : 'moon'} size={18} />{t(pet.asleep ? 'care.lightsOn' : 'care.lightsOff')}
        </button>
        {#if pet.unwell}
          <button type="button" class="btn btn-primary" id="btnMedicine" disabled={busy} onclick={() => care(() => petState.medicine(), 'done.medicine', () => move('shiver'))}>
            <Icon name="medicine" size={18} />{t('care.medicine')}
          </button>
        {/if}
      </div>
    {/if}
  {/if}
</div>

{#if foodOpen && pet}
  <FoodSheet title={t('care.chooseFood', { name })} stage={pet.stage} tooSmall={t('refuse.not-yet', { name })} onpick={pick} onclose={() => (foodOpen = false)} />
{/if}

<style>
  .room {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-5) var(--space-4) var(--space-5);
    overflow: hidden;
    transition: background-color var(--spring-effects-slow-dur) var(--spring-effects-slow);
  }
  /* The room dims at bedtime, in both themes. */
  .room.is-night {
    background-color: rgba(var(--shadow-rgb), calc(0.35 * var(--shadow-strength)));
  }
  .pet-frame {
    position: relative;
    width: min(100%, 340px);
  }
  .pet-button {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    border-radius: var(--corner-full);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .flying-food {
    position: absolute;
    left: 50%;
    bottom: 0;
    translate: -50% 0;
    animation: to-mouth 520ms cubic-bezier(0.3, 0.7, 0.4, 1) forwards;
    pointer-events: none;
  }
  @keyframes to-mouth {
    to {
      bottom: 34%;
      scale: 0.5;
      opacity: 0.4;
    }
  }
  .mess {
    position: absolute;
    bottom: 4%;
    width: 30px;
    fill: var(--pet-fur-shade);
    stroke: var(--pet-outline);
    stroke-width: 1.2;
  }
  .mess-0 {
    left: 2%;
  }
  .mess-1 {
    right: 4%;
  }
  .mess-2 {
    left: 18%;
    bottom: 0;
  }
  .status-line {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.25rem;
    line-height: 1.3;
    color: var(--text-heading);
    text-align: center;
  }
  .welcome {
    text-align: center;
    max-width: 30rem;
  }
  .warmth {
    width: min(100%, 18rem);
    display: grid;
    gap: var(--space-2);
    text-align: center;
  }
  .needs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4) var(--space-5);
    padding: var(--space-5);
  }
  .care {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }
  .care .btn {
    width: 100%;
    justify-content: center;
    gap: var(--space-2);
  }
  @media (min-width: 640px) {
    .care {
      grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flying-food {
      animation: none;
      opacity: 0;
    }
  }
</style>
