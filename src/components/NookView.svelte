<script lang="ts">
  // The Nook: the pet in its room, its needs, and the care buttons.
  import { WavyProgress } from 'dusk-dawn';
  import { onMount } from 'svelte';
  import Adopt from './Adopt.svelte';
  import FoodIcon from './FoodIcon.svelte';
  import NeedMeter from './NeedMeter.svelte';
  import PlaySheet from './PlaySheet.svelte';
  import ChatBubble from './ChatBubble.svelte';
  import FidgetSheet from './FidgetSheet.svelte';
  import TricksSheet from './TricksSheet.svelte';
  import { nextQuestion, recollection, type Question } from '../world/chat';
  import { known } from '../world/tricks';
  import type { Game } from '../domain/games';
  import Icon from './ui/Icon.svelte';
  import { canHave, pantry, type Food } from '../domain/foods';
  import DecorLayer from './DecorLayer.svelte';
  import DecorPanel from './DecorPanel.svelte';
  import WardrobeSheet from './WardrobeSheet.svelte';
  import { DECOR } from '../world/decor';
  import { grownFoods } from '../world/garden';
  import { NEEDS, type PetEvent, type Refusal } from '../domain/pet';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { cheer, hatchEgg } from '../lib/delight';
  import { isBirthday, siblingProp } from '../domain/delights';
  import type { Prop } from '../pet/types';
  import { snapshot } from '../lib/snapshot';
  import Pet from '../pet/Pet.svelte';
  import { petGestures } from '../pet/gestures';
  import { buzz } from '../platform/haptics';
  import { chirp } from '../platform/sound';
  import { NEED_WORDS, drowsy, glowFor, grubbiness, idleBeat, restingFace, status, summarise } from '../pet/behaviour';
  import { settings } from '../state/settings.svelte';
  import type { Expression, Reaction } from '../pet/types';
  import { petState, type CareResult } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';
  import { worldState } from '../state/world.svelte';
  import GiftBundle from '../world/art/GiftBundle.svelte';
  import TreasureIcon from '../world/art/TreasureIcon.svelte';
  import { treasureById, type Treasure } from '../world/treasures';

  const pet = $derived(petState.pet);
  const name = $derived(pet?.name ?? '');

  let rig = $state<ReturnType<typeof Pet>>();
  let frame = $state<HTMLElement>();
  /** A face held for a moment over the resting one, after a touch or a meal. */
  let held = $state<Expression | null>(null);
  let chomp = $state(false);
  let look = $state({ x: 0, y: 0 });
  /** The food tray under the pet, open after Feed. */
  let trayOpen = $state(false);
  let flying = $state<Food | null>(null);
  /** A food being dragged to the pet, and where the finger is. */
  let dragging = $state<{ food: Food; x: number; y: number } | null>(null);
  let cuddling = $state(false);
  let playOpen = $state(false);
  let fidgetOpen = $state(false);
  let wardrobeOpen = $state(false);
  let decorating = $state(false);
  const foods = $derived(pantry(grownFoods(worldState.world.garden)));
  let tricksOpen = $state(false);
  /** Its question in a picture bubble, until you reply. */
  let asking = $state.raw<Question | null>(null);
  /** Something it says, over the status line for a few seconds. */
  let saying = $state('');
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  let bubbles = $state<{ id: number; x: number; y: number }[]>([]);
  /** Turned away after too much tickling, until then. */
  let sulkUntil = 0;
  let welcome = $state('');
  let busy = $state(false);

  /** Ticks each minute, so it gets drowsy before bedtime with the app left open. */
  let clock = $state(Date.now());
  const sleepyHour = $derived(drowsy(clock, settings.current));
  const moment = $derived(pet && pet.stage !== 'seedpod' && !pet.asleep ? worldState.moment : null);
  const face = $derived(pet ? (held ?? moment?.expression ?? restingFace(pet, sleepyHour)) : 'content');
  /** The find just opened, shown until the next one or a tap. */
  let opened = $state<{ treasure: Treasure; isNew: boolean } | null>(null);
  const gifts = $derived(pet && pet.stage !== 'seedpod' && !pet.awayUntil ? worldState.world.waiting.length : 0);
  const wear = $derived.by(() => {
    const out: Prop[] = [];
    const sibling = pet && pet.stage !== 'seedpod' ? siblingProp(pet.name) : null;
    if (sibling) out.push(sibling);
    if (pet && isBirthday(pet, clock)) out.push('cake');
    return out;
  });
  const statusLine = $derived(pet ? (saying ? saying : moment ? t(`moment.${moment.id}` as MessageKey, { name }) : t(`status.${status(pet)}` as MessageKey, { name })) : '');

  // A moment lasts until it notices you: a tap, or a few seconds.
  $effect(() => {
    if (!moment) return;
    const timer = setTimeout(() => notice(), 6000);
    return () => clearTimeout(timer);
  });
  function notice() {
    if (!worldState.moment) return;
    worldState.noticed();
    hold('surprised', 500);
    setTimeout(() => (hold('happy', 1000), move('hop'), chirp('boop')), 450);
  }

  async function openGift() {
    worldState.noticed();
    const got = await worldState.receive();
    if (!got) return;
    const treasure = treasureById(got.find.treasureId);
    if (!treasure) return;
    opened = { treasure, isNew: got.isNew };
    hold('happy', 1800);
    move('bounce');
    chirp('happy');
    buzz('light');
    if (got.isNew) cheer(frame, { count: 50 });
    ui.notify(t(got.isNew ? 'gift.new' : 'gift.again', { name, treasure: treasure.name.toLowerCase() }), got.isNew ? 'celebrate' : 'success');
  }
  let heldTimer: ReturnType<typeof setTimeout> | undefined;

  function hold(expression: Expression, ms = 1400) {
    clearTimeout(heldTimer);
    held = expression;
    heldTimer = setTimeout(() => (held = null), ms);
  }

  function move(kind: Reaction) {
    void rig?.react(kind);
  }

  function say(line: string, ms = 4500) {
    clearTimeout(sayTimer);
    saying = line;
    sayTimer = setTimeout(() => (saying = ''), ms);
  }

  // ── Chat: it asks; you answer; it remembers.
  function chat() {
    if (!pet) return;
    if (pet.asleep) return refused('asleep');
    if (asking) return (asking = null);
    const q = nextQuestion(worldState.world.chat);
    if (q) {
      asking = q;
      hold('surprised', 600);
      chirp('boop');
      return;
    }
    // It has asked everything: it brings something up instead.
    const told = recollection(worldState.world.chat);
    if (told) say(t(`chat.${told[0]}.${told[1]}.recall` as MessageKey, { name }));
    hold('happy', 1200);
    chirp('happy');
  }
  async function reply(r: number) {
    const q = asking;
    if (!q) return;
    asking = null;
    await worldState.answer(q.id, r);
    say(t(`chat.${q.id}.${r}.said` as MessageKey, { name }));
    hold('happy', 1400);
    move('hop');
    chirp('happy');
  }

  // ── Give the phone a shake and it wobbles, dizzy.
  let lastShake = 0;
  function shaken(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity ?? e.acceleration;
    if (!a || !pet || pet.stage === 'seedpod' || pet.awayUntil) return;
    const force = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
    const now = Date.now();
    if (force < 24 || now - lastShake < 1500) return;
    lastShake = now;
    if (pet.asleep) return move('shiver');
    move('wobble');
    hold('dizzy', 1600);
    chirp('giggle');
    buzz('medium');
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
      buzz('light');
      if (await petState.warm()) {
        chirp('hatch');
        cheer(frame, { count: 80 });
        ui.notify(t('pod.hatched', { name }), 'celebrate');
        hold('surprised', 1600);
      }
      return;
    }
    if (worldState.moment) return notice();
    if (Date.now() < sulkUntil) return;
    const result = await petState.stroke('boop');
    if (!result.ok) return;
    buzz('light');
    if (pet.asleep) return move('shiver');
    chirp('boop');
    move('squish');
    hold('happy', 900);
  }

  async function tickle(taps: number) {
    if (!pet || pet.stage === 'seedpod' || pet.asleep || Date.now() < sulkUntil) return tapPet();
    if (taps > 12) {
      // Enough. It turns away for a few seconds.
      sulkUntil = Date.now() + 4000;
      chirp('sad');
      hold('grumpy', 4000);
      look = { x: 1, y: 0.2 };
      setTimeout(() => (look = { x: 0, y: 0 }), 4000);
      return;
    }
    await petState.stroke('boop');
    chirp('giggle');
    buzz('tick');
    hold('happy', 1100);
    move('wiggle');
  }

  async function strokeIt() {
    if (!pet || pet.stage === 'seedpod' || Date.now() < sulkUntil) return;
    const result = await petState.stroke('stroke');
    if (!result.ok) return;
    if (!pet.asleep) {
      hold('happy', 1600);
      chirp('purr');
    }
    move('nuzzle');
  }

  async function cuddle(holding: boolean) {
    if (!pet || pet.stage === 'seedpod') return;
    cuddling = holding;
    if (holding) {
      buzz('medium');
      clearTimeout(heldTimer);
      held = pet.asleep ? null : 'happy';
      if (!pet.asleep) chirp('happy');
      return;
    }
    held = null;
    await petState.stroke('cuddle');
  }

  async function scrub(x = 0, y = 0) {
    if (!pet || pet.stage === 'seedpod') return;
    addBubbles(x, y);
    const result = await petState.clean();
    if (!result.ok) return;
    hold('happy');
    move('wiggle');
    chirp('happy');
    ui.notify(t('done.cleaned', { name }), 'success');
  }

  let bubbleId = 0;
  function addBubbles(x: number, y: number) {
    const box = frame?.getBoundingClientRect();
    if (!box) return;
    const fresh = Array.from({ length: 6 }, () => ({
      id: ++bubbleId,
      x: (x ? x - box.left : box.width / 2) + (Math.random() * 60 - 30),
      y: (y ? y - box.top : box.height / 2) + (Math.random() * 40 - 20),
    }));
    bubbles = [...bubbles, ...fresh];
    setTimeout(() => (bubbles = bubbles.filter((b) => !fresh.includes(b))), 900);
  }
  let lastPointer = { x: 0, y: 0 };

  /** Its eyes follow a finger anywhere in the room. */
  function follow(e: PointerEvent) {
    lastPointer = { x: e.clientX, y: e.clientY };
    if (!pet || pet.asleep || pet.stage === 'seedpod' || held === 'grumpy') return;
    const box = frame?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height * 0.45;
    const dx = (e.clientX - cx) / (box.width / 2);
    const dy = (e.clientY - cy) / (box.height / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    look = { x: dx / len, y: dy / len };
  }

  // ── Dragging food from the tray to its mouth.
  function grab(e: PointerEvent, food: Food) {
    if (e.button !== 0 || !canHave(food, pet?.stage ?? 'sprout')) return;
    const start = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
      moved = true;
      dragging = { food, x: ev.clientX, y: ev.clientY };
      // It opens its mouth as the food comes near.
      const box = frame?.getBoundingClientRect();
      if (box && !busy) {
        const near = Math.hypot(ev.clientX - (box.left + box.width / 2), ev.clientY - (box.top + box.height / 2)) < box.width * 0.6;
        held = near ? 'eating' : null;
        chomp = false;
      }
    };
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      dragging = null;
      if (!moved) return; // a tap: the click handler feeds it
      held = null;
      const box = frame?.getBoundingClientRect();
      if (box && ev.clientX > box.left && ev.clientX < box.right && ev.clientY > box.top && ev.clientY < box.bottom) void pick(food, true);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  }

  // ── Feeding: the food flies to its mouth, three chomps, then it counts.
  async function pick(food: Food, dropped = false) {
    if (!pet || busy) return;
    if (pet.asleep) return refused('asleep');
    if (pet.needs.fullness > 0.95) return refused('full');
    busy = true;
    try {
      held = 'eating';
      chomp = false;
      if (!dropped) {
        flying = food;
        await wait(520);
        flying = null;
      }
      for (let i = 0; i < 3; i++) {
        chomp = true;
        chirp('chomp');
        buzz('light');
        await wait(170);
        chomp = false;
        await wait(170);
      }
      const result = await petState.feed(food);
      held = null;
      if (!result.ok) return refused(result.why);
      hold('happy');
      move('bounce');
      chirp('happy');
      ui.notify(t('done.fed', { name, food: food.name.toLowerCase() }), 'success');
    } finally {
      held = held === 'eating' ? null : held;
      busy = false;
    }
  }

  function idle(kind: ReturnType<typeof idleBeat>) {
    // Now and then, instead, it gets up to something.
    const roll = Math.random();
    if (roll < 0.12) return worldState.catchMoment();
    const tricks = known(worldState.world.tricks);
    if (roll < 0.22 && tricks.length) {
      const trick = tricks[Math.floor(Math.random() * tricks.length)]!;
      hold('happy', 1200);
      say(t('tricks.showsOff', { name, trick: t(`trick.${trick.id}` as MessageKey).toLowerCase() }), 3000);
      return move(trick.move);
    }
    const things = DECOR.filter((d) => worldState.world.decor[d.id]);
    if (roll < 0.36 && things.length) {
      const d = things[Math.floor(Math.random() * things.length)]!;
      const at = worldState.world.decor[d.id]!;
      look = { x: (at.x - 0.5) * 2, y: (at.y - 0.5) * 1.2 };
      setTimeout(() => (look = { x: 0, y: 0 }), 2000);
      say(t(`decor.${d.id}.use` as MessageKey, { name }), 3500);
      hold('happy', 1200);
      return move(d.use);
    }
    if (roll < 0.42) {
      const told = recollection(worldState.world.chat);
      if (told) return say(t(`chat.${told[0]}.${told[1]}.recall` as MessageKey, { name }));
    }
    switch (kind) {
      case 'look':
        look = { x: Math.random() * 2 - 1, y: Math.random() * 1.2 - 0.6 };
        setTimeout(() => (look = { x: 0, y: 0 }), 1600);
        return;
      case 'hop':
        return move('hop');
      case 'yawn':
        hold('sleepy', 1400);
        return chirp('yawn');
      case 'spin':
        return move('spin');
      case 'chirp':
        hold('happy', 700);
        return chirp('boop');
      case 'ruffle':
        return move('shiver');
      case 'peek':
        look = { x: -1, y: 0.4 };
        hold('surprised', 1200);
        setTimeout(() => (look = { x: 0, y: 0 }), 1200);
        return;
    }
  }

  let snapping = $state(false);
  async function picture() {
    const svg = rig?.element();
    if (!svg || !pet || snapping) return;
    snapping = true;
    try {
      const caption = t('nook.pictureCaption', { stage: t(`stage.${pet.stage}` as MessageKey), date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) });
      await petState.addPhoto(await snapshot(svg, name, caption));
      chirp('happy');
      ui.notify(t('nook.pictureTaken'), 'success');
    } finally {
      snapping = false;
    }
  }

  async function played(game: Game, score: number) {
    playOpen = false;
    const record = await worldState.played(game, score);
    const result = await petState.play(game, record.score);
    if (!result.ok) return refused(result.why);
    hold('happy');
    move('hop');
    chirp('happy');
    const verdict = t(score >= 0.8 ? 'game.result.great' : score >= 0.4 ? 'game.result.good' : 'game.result.ok');
    const extra = record.daily ? ` ${t('game.dailyThanks')}` : record.best ? ` ${t('game.newBest')}` : '';
    ui.notify(t('game.done', { name, result: verdict }) + extra, record.daily || record.best ? 'celebrate' : 'success');
  }

  function wait(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── What happened while the app was closed, and as it happens.
  function tell(events: PetEvent[]) {
    for (const e of events) {
      if (e.kind === 'grew' && e.stage && e.stage !== 'sprout') {
        cheer(frame, { count: 90 });
        chirp('hatch');
        const form = petState.pet?.form;
        ui.notify(e.stage === 'grown' && form ? t(`event.grew.${form}` as MessageKey, { name }) : t('event.grew.nookling', { name }), 'celebrate');
      } else if (e.kind === 'unwell') ui.notify(t('event.unwell', { name }), 'info');
      else if (e.kind === 'recovered') ui.notify(t('event.recovered', { name }), 'success');
      else if (e.kind === 'good-day') {
        cheer(frame, { count: 70 });
        chirp('happy');
        ui.notify(t('event.good-day', { name }), 'celebrate');
      }
    }
  }

  function welcomeLine(events: PetEvent[]): string {
    // Cozy: coming back opens with joy, never a list of what went wrong.
    if (settings.current.style === 'cozy') {
      if (!events.length) return '';
      const tidied = events.some((e) => e.kind === 'tidied');
      return t('welcome.missed', { name }) + (tidied ? ` ${t('welcome.tidied')}` : '');
    }
    const parts = summarise(events).map(({ kind, count }) => t(`away.${kind}` as MessageKey, { count }));
    if (!parts.length) return '';
    const list = new Intl.ListFormat('en', { type: 'conjunction' }).format(parts);
    return t('welcome.line', { name, list });
  }

  // Easter eggs from the header, acted out here.
  $effect(() => {
    const trick = ui.trick;
    if (!trick || !pet || pet.stage === 'seedpod' || pet.asleep) return;
    ui.trick = null;
    if (trick.kind === 'konami') {
      hold('happy', 1800);
      move('somersault');
      chirp('giggle');
      cheer(frame, { shapes: ['soft-burst', 'clover-4'], glyphs: ['✦', '✧'], count: 70 });
    } else {
      hold('surprised', 500);
      setTimeout(() => (hold('happy', 900), move('wobble'), chirp('boop')), 450);
    }
  });

  // Its hatch day, a year or more on: a cake, and an egg the first time.
  $effect(() => {
    if (!pet || !wear.includes('cake')) return;
    const today = new Date(clock).toDateString();
    try {
      if (localStorage.getItem('nookling.birthday') === today) return;
      localStorage.setItem('nookling.birthday', today);
    } catch {
      // No storage: the cake is still there.
    }
    const years = new Date(clock).getFullYear() - new Date(pet.hatchedAt ?? clock).getFullYear();
    cheer(frame, { count: 80 });
    hatchEgg('birthday', t('egg.birthday', { name, count: years }));
  });

  // "Give" in the Pantry lands here.
  $effect(() => {
    const food = ui.pendingFood;
    if (!food || !pet || pet.stage === 'seedpod') return;
    ui.pendingFood = null;
    setTimeout(() => void pick(food), 250);
  });

  onMount(() => {
    const away = petState.takeAway();
    welcome = welcomeLine(away);
    tell(away.filter((e) => e.kind === 'grew' || e.kind === 'good-day'));
    const stop = petState.onEvents(tell);

    // Idle beats: now and then it does a little something, picked by its traits.
    let timer: ReturnType<typeof setTimeout>;
    const beat = () => {
      timer = setTimeout(
        () => {
          const p = petState.pet;
          if (p && !p.asleep && !p.awayUntil && p.stage !== 'seedpod' && !held && !busy && !document.hidden) idle(idleBeat(p.traits));
          beat();
        },
        8000 + Math.random() * 12000,
      );
    };
    beat();
    const minute = setInterval(() => (clock = Date.now()), 60_000);
    window.addEventListener('devicemotion', shaken);
    return () => {
      window.removeEventListener('devicemotion', shaken);
      clearTimeout(sayTimer);
      clearInterval(minute);
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
    <section class="panel room" class:is-night={pet.asleep} aria-label={t('tabs.nook')} onpointermove={follow} onpointerleave={() => (look = { x: 0, y: 0 })}>
      {#if !pet.awayUntil && pet.stage !== 'seedpod'}
        <div class="room-tools">
          <button type="button" class="btn-icon" id="btnDecorate" aria-pressed={decorating} aria-label={t('decor.title')} title={t('decor.title')} onclick={() => (decorating = !decorating)}>
            <Icon name="brush" size={20} />
          </button>
          <button type="button" class="btn-icon" id="btnWardrobe" aria-label={t('wardrobe.open')} title={t('wardrobe.open')} onclick={() => (wardrobeOpen = true)}>
            <Icon name="shirt" size={20} />
          </button>
        </div>
      {/if}
      {#if !pet.awayUntil}
        <button type="button" class="btn-icon snap" id="btnPicture" disabled={snapping} aria-label={t('nook.picture')} title={t('nook.picture')} onclick={picture}>
          <Icon name="camera" size={20} />
        </button>
      {/if}
      <div class="scene">
      <DecorLayer editing={decorating} night={pet.asleep} />
      <div class="pet-frame" bind:this={frame}>
        <button
          type="button"
          class="pet-button"
          class:is-cuddled={cuddling}
          id="petButton"
          aria-label={pet.stage === 'seedpod' ? t('pod.label') : statusLine}
          use:petGestures={{ ontap: tapPet, ontickle: tickle, onstroke: strokeIt, oncuddle: cuddle, onscrub: () => scrub(lastPointer.x, lastPointer.y) }}
        >
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
            {wear}
            outfit={pet.stage === 'seedpod' ? {} : worldState.world.wardrobe.wearing}
            moment={moment?.prop ?? null}
          />
        </button>
        {#if flying}
          <div class="flying-food" aria-hidden="true"><FoodIcon food={flying} size={40} /></div>
        {/if}
        {#each bubbles as b (b.id)}
          <span class="bubble" style:left="{b.x}px" style:top="{b.y}px" aria-hidden="true"></span>
        {/each}
        {#each [0, 1, 2].slice(0, pet.messes) as i (i)}
          <svg class="mess mess-{i}" viewBox="-12 -8 24 16" aria-hidden="true"><path d="M-10 6Q-10 -2 -4 -3Q-2 -8 3 -6Q9 -6 10 6Z" /></svg>
        {/each}
      </div>
      </div>
      {#if gifts}
        <button type="button" class="gift-button dd-pressable" id="btnGift" aria-label={t('gift.open', { name })} onclick={openGift}>
          <GiftBundle size={52} />
          {#if gifts > 1}<span class="gift-count t-data">{gifts}</span>{/if}
        </button>
      {/if}
      <p class="status-line" id="statusLine" aria-live="polite">{statusLine}</p>
      {#if opened}
        <button type="button" class="found" id="foundCard" onclick={() => (opened = null)} aria-label={t('gift.close')}>
          <TreasureIcon treasure={opened.treasure} size={44} />
          <span class="found-text">
            <span class="found-name">{opened.treasure.name}{#if opened.isNew}<span class="found-new t-data"> · {t('gift.newBadge')}</span>{/if}</span>
            <span class="t-hint">{opened.treasure.note}</span>
          </span>
        </button>
      {/if}
      {#if asking}<ChatBubble question={asking} {name} onreply={reply} />{/if}
      {#if welcome}<p class="t-hint welcome" id="welcomeLine">{welcome}</p>{/if}
      {#if trayOpen && pet.stage !== 'seedpod'}
        <div class="tray" id="foodTray">
          <p class="t-hint">{t('tray.hint', { name })}</p>
          <ul class="tray-list">
            {#each foods as food (food.id)}
              {@const ok = canHave(food, pet.stage)}
              <li>
                <button
                  type="button"
                  class="tray-food dd-pressable"
                  data-food={food.id}
                  disabled={!ok || busy}
                  aria-label={ok ? t('tray.give', { food: food.name }) : `${food.name}. ${t('refuse.not-yet', { name })}`}
                  onpointerdown={(e) => grab(e, food)}
                  onclick={() => pick(food)}
                >
                  <FoodIcon {food} size={40} />
                  <span class="tray-name">{food.name}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if pet.stage === 'seedpod'}
        <div class="warmth">
          <WavyProgress value={pet.warmth} label={t('pod.warmth')} />
          <p class="t-hint">{t('pod.hint')}</p>
        </div>
      {/if}
    </section>

    {#if decorating}
      <DecorPanel ondone={() => (decorating = false)} />
    {:else if pet.awayUntil}
      <button type="button" class="btn btn-primary btn-block" id="btnComeBackNook" onclick={() => petState.comeBack()}>{t('care.comeBack', { name })}</button>
    {:else if pet.stage !== 'seedpod'}
      <section class="panel needs" aria-label={t('needs.label')}>
        {#each NEEDS as need (need)}
          <NeedMeter id="need-{need}" label={t(`need.${need}` as MessageKey)} value={pet.needs[need]} words={Object.fromEntries(Object.entries(NEED_WORDS[need]).map(([k, v]) => [k, t(v as MessageKey)])) as Record<'full' | 'fine' | 'low' | 'empty', string>} />
        {/each}
      </section>

      <div class="care">
        <button type="button" class="btn btn-secondary" id="btnFeed" disabled={busy} aria-expanded={trayOpen} aria-controls="foodTray" onclick={() => (pet.asleep ? refused('asleep') : (trayOpen = !trayOpen))}>
          <Icon name="feed" size={18} />{t('care.feed')}
        </button>
        <button type="button" class="btn btn-secondary" id="btnPlay" disabled={busy} onclick={() => (pet.asleep ? refused('asleep') : pet.needs.energy < 0.1 ? refused('too-tired') : (playOpen = true))}>
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
      <div class="fun" aria-label={t('fun.label', { name })} role="group">
        <button type="button" class="btn btn-muted" id="btnChat" aria-expanded={!!asking} onclick={chat}><Icon name="chat" size={16} />{t('fun.chat')}</button>
        <button type="button" class="btn btn-muted" id="btnTricks" onclick={() => (pet.asleep ? refused('asleep') : (tricksOpen = true))}><Icon name="wand" size={16} />{t('fun.tricks')}</button>
        <button type="button" class="btn btn-muted" id="btnFidget" onclick={() => (pet.asleep ? refused('asleep') : (fidgetOpen = true))}><Icon name="hand" size={16} />{t('fun.fidget')}</button>
      </div>
    {/if}
  {/if}
</div>

{#if playOpen && pet}
  <PlaySheet {name} stage={pet.stage} form={pet.form} onresult={played} onclose={() => (playOpen = false)} />
{/if}

{#if wardrobeOpen && pet}
  <WardrobeSheet {name} stage={pet.stage} form={pet.form} onclose={() => (wardrobeOpen = false)} />
{/if}

{#if fidgetOpen && pet}
  <FidgetSheet {name} stage={pet.stage} form={pet.form} onclose={() => (fidgetOpen = false)} />
{/if}

{#if tricksOpen && pet}
  <TricksSheet {name} stage={pet.stage} form={pet.form} onclose={() => (tricksOpen = false)} />
{/if}

{#if dragging}
  <div class="drag-food" style:left="{dragging.x}px" style:top="{dragging.y}px" aria-hidden="true"><FoodIcon food={dragging.food} size={48} /></div>
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
  .gift-button {
    position: absolute;
    right: var(--space-3);
    top: 30%;
    z-index: 1;
    padding: var(--space-1);
    background: none;
    border: 0;
    cursor: pointer;
    animation: nudge 2.4s ease-in-out infinite;
  }
  @keyframes nudge {
    0%,
    80%,
    100% {
      rotate: 0deg;
    }
    85% {
      rotate: -8deg;
    }
    90% {
      rotate: 8deg;
    }
    95% {
      rotate: -4deg;
    }
  }
  .gift-count {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--accent-bright);
    color: var(--on-accent);
    font-size: 0.75rem;
  }
  .found {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    width: 100%;
    max-width: 360px;
    padding: var(--space-3);
    text-align: left;
    color: inherit;
    font: inherit;
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    cursor: pointer;
  }
  .found-text {
    display: grid;
    gap: 2px;
  }
  .found-name {
    color: var(--text-heading);
    font-weight: 600;
  }
  .found-new {
    color: var(--accent-bright);
  }
  @media (prefers-reduced-motion: reduce) {
    .gift-button {
      animation: none;
    }
  }
  /* Above the nook's things (DecorLayer). */
  .status-line,
  .welcome,
  .tray,
  .warmth,
  .found {
    position: relative;
    z-index: 1;
  }
  .room-tools {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    z-index: 3;
    display: flex;
    gap: var(--space-1);
  }
  .snap {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    z-index: 1;
  }
  .scene {
    position: relative;
    width: 100%;
    display: grid;
    justify-items: center;
    padding: var(--space-4) 0 var(--space-2);
  }
  .pet-frame {
    position: relative;
    z-index: 1;
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
  .pet-button.is-cuddled :global(.rig) {
    animation: sway 1.4s ease-in-out infinite;
  }
  @keyframes sway {
    0%,
    100% {
      transform: translateY(-10px) rotate(-4deg);
    }
    50% {
      transform: translateY(-12px) rotate(4deg);
    }
  }
  .bubble {
    position: absolute;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    border-radius: 50%;
    border: 1.5px solid var(--pet-outline);
    background: rgba(var(--cream-rgb), 0.15);
    pointer-events: none;
    animation: bubble 900ms ease-out forwards;
  }
  @keyframes bubble {
    to {
      translate: 0 -30px;
      scale: 1.4;
      opacity: 0;
    }
  }
  .tray {
    width: 100%;
    display: grid;
    gap: var(--space-2);
    text-align: center;
  }
  .tray-list {
    list-style: none;
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    scrollbar-width: none;
    padding: var(--space-1) var(--space-1) var(--space-2);
  }
  .tray-food {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    width: 76px;
    min-height: 84px;
    padding: var(--space-2) var(--space-1);
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: var(--text-body);
    font: inherit;
    cursor: grab;
    touch-action: none;
  }
  .tray-food:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .tray-name {
    font-size: 0.6875rem;
    line-height: 1.2;
  }
  .drag-food {
    position: fixed;
    z-index: 50;
    translate: -50% -60%;
    pointer-events: none;
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
  .fun {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
    margin: calc(-1 * var(--space-3)) 0 var(--space-5);
  }
  .fun .btn {
    width: 100%;
    justify-content: center;
    gap: var(--space-1);
    font-size: 0.875rem;
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
    .pet-button.is-cuddled :global(.rig),
    .bubble {
      animation: none;
    }
    .flying-food {
      animation: none;
      opacity: 0;
    }
  }
</style>
