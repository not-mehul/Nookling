<script lang="ts">
  // The nookling (style.md §3.7 pet tokens, §11.2 living subject). One inline
  // SVG rig: fluff, eyes, mouth, cheeks and glow, every colour a token, so it
  // follows the theme with no redraw. It breathes and blinks while it is on
  // screen and the page is visible; under reduced motion it holds still poses.
  // One-off movements come from `react()`, on the Web Animations API.
  import { onMount } from 'svelte';
  import { BODY, EYE, ellipsePath, fluffPath, starPath } from './geometry';
  import { furToken, type Expression, type Form, type Prop, type Reaction, type Stage } from './types';
  import MomentPropArt from '../world/art/MomentProp.svelte';
  import type { MomentProp } from '../world/moments';
  import type { Outfit } from '../world/wardrobe';
  import ClothesArt from './ClothesArt.svelte';

  interface Props {
    stage?: Stage;
    form?: Form | null;
    expression?: Expression;
    /** Where the pupils look, each axis -1 to 1. */
    look?: { x: number; y: number };
    /** The mood glow, 0 to 1. */
    glow?: number;
    /** Dust and smudges, 0 to 1. */
    grubby?: number;
    /** While eating: the mouth shut on a bite. */
    chomp?: boolean;
    unwell?: boolean;
    /** Breathing and blinking. Off for still pictures (the character sheet, share cards). */
    live?: boolean;
    /** What a screen reader hears: the pet's status line. */
    label: string;
    /** What it wears or has beside it. */
    wear?: readonly Prop[];
    /** The thing it is caught with in a little moment (src/world/moments.ts). */
    moment?: MomentProp | null;
    /** Clothes from the wardrobe. */
    outfit?: Outfit;
  }

  let {
    stage = 'nookling',
    form = null,
    expression = 'content',
    look = { x: 0, y: 0 },
    glow = 0.5,
    grubby = 0,
    chomp = false,
    unwell = false,
    live = true,
    label,
    wear = [],
    moment = null,
    outfit = {},
  }: Props = $props();
  const BEHIND: readonly MomentProp[] = ['sunbeam', 'puddle', 'cloud'];

  const uid = `pet${Math.random().toString(36).slice(2, 8)}`;
  const body = fluffPath(BODY.r, BODY.bumps, BODY.depth, BODY.ruffle);
  const eyeClip = ellipsePath(0, 0, EYE.rx, EYE.ry);
  const SPECKS = [
    [-38, 30, 3.2],
    [44, 40, 2.6],
    [-20, 54, 2.2],
    [52, 8, 2.4],
    [-56, -14, 2.8],
    [16, 58, 3],
    [-48, 46, 2],
    [30, -50, 2.2],
  ] as const;

  const fur = $derived(`var(${furToken(stage, form, unwell)})`);
  const openEyes = $derived(expression !== 'happy' && expression !== 'asleep' && expression !== 'dizzy');
  const pupil = $derived(expression === 'surprised' ? 9 : expression === 'hungry' ? 15 : EYE.pupil);
  const gaze = $derived({
    x: clamp(look.x) * EYE.reach,
    y: clamp(look.y) * EYE.reach + (expression === 'sad' || expression === 'unwell' ? 4 : 0),
  });
  const specks = $derived(SPECKS.slice(0, Math.round(clamp(grubby, 0, 1) * SPECKS.length)));
  const scale = $derived(stage === 'sprout' ? 0.74 : 1);
  const glowLevel = $derived(clamp(glow, 0, 1) * (stage === 'grown' && form === 'lamplighter' ? 1 : 0.8));

  /** The lid line over each eye, as [outer, inner] heights from the eye's centre (negative is up). */
  const lid = $derived.by((): [number, number] | null => {
    switch (expression) {
      case 'sleepy':
        return [-2, -2];
      case 'sad':
        return [-8, -20];
      case 'unwell':
        return [-11, -13];
      case 'grumpy':
        return [-22, -9];
      default:
        return null;
    }
  });

  function clamp(n: number, lo = -1, hi = 1): number {
    return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));
  }

  /** The lid for one eye, `side` -1 for the left (its outer edge is on the left). */
  function lidPath(side: -1 | 1, [outer, inner]: [number, number]): string {
    const left = side < 0 ? outer : inner;
    const right = side < 0 ? inner : outer;
    const w = EYE.rx + 4;
    return `M${-w} ${-EYE.ry - 4}H${w}V${right}L${-w} ${left}Z`;
  }
  function lidEdge(side: -1 | 1, [outer, inner]: [number, number]): string {
    const left = side < 0 ? outer : inner;
    const right = side < 0 ? inner : outer;
    return `M${-EYE.rx} ${left}L${EYE.rx} ${right}`;
  }

  // ── Living: breathing runs in CSS; blinking is timed here. Both stop when
  //    the pet is off screen or the page is hidden, and under reduced motion.
  let svg: SVGSVGElement;
  let rig = $state<SVGGElement>();
  let visible = $state(true);
  let pageShown = $state(typeof document === 'undefined' || !document.hidden);
  let blinking = $state(false);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = $derived(live && visible && pageShown && !reduced);

  onMount(() => {
    const io = new IntersectionObserver(([entry]) => (visible = entry?.isIntersecting ?? true));
    io.observe(svg);
    const onVisibility = () => (pageShown = !document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  $effect(() => {
    if (!running || !openEyes) return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(
        () => {
          blinking = true;
          timer = setTimeout(() => {
            blinking = false;
            next();
          }, 130);
        },
        2000 + Math.random() * 4000,
      );
    };
    next();
    return () => {
      clearTimeout(timer);
      blinking = false;
    };
  });

  const MOVES: Record<Reaction, { frames: Record<string, string>[]; ms: number }> = {
    hop: { frames: [{ transform: 'none' }, { transform: 'translateY(4px) scale(1.06, 0.92)' }, { transform: 'translateY(-26px) scale(0.96, 1.05)' }, { transform: 'translateY(3px) scale(1.08, 0.9)' }, { transform: 'none' }], ms: 620 },
    bounce: { frames: [{ transform: 'none' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(2px) scale(1.04, 0.95)' }, { transform: 'translateY(-7px)' }, { transform: 'none' }], ms: 700 },
    squish: { frames: [{ transform: 'none' }, { transform: 'scale(1.1, 0.88)' }, { transform: 'scale(0.97, 1.03)' }, { transform: 'none' }], ms: 420 },
    wiggle: { frames: [{ transform: 'none' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(2deg)' }, { transform: 'none' }], ms: 600 },
    shiver: { frames: [{ transform: 'none' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }], ms: 360 },
    nuzzle: { frames: [{ transform: 'none' }, { transform: 'rotate(-5deg) scale(1.03, 0.98)' }, { transform: 'rotate(4deg) scale(1.03, 0.98)' }, { transform: 'none' }], ms: 900 },
    spin: { frames: [{ transform: 'none' }, { transform: 'rotate(180deg) scale(0.95)' }, { transform: 'rotate(360deg)' }], ms: 700 },
    somersault: { frames: [{ transform: 'none' }, { transform: 'translateY(6px) scale(1.08, 0.9)' }, { transform: 'translateY(-60px) rotate(-180deg)' }, { transform: 'translateY(-20px) rotate(-340deg)' }, { transform: 'translateY(4px) rotate(-360deg) scale(1.08, 0.9)' }, { transform: 'rotate(-360deg)' }], ms: 1100 },
    wobble: { frames: [{ transform: 'none' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], ms: 900 },
  };

  /** Plays a one-off movement. Does nothing under reduced motion: the status line says it instead. */
  export function react(kind: Reaction): Promise<void> {
    if (reduced || !rig?.animate) return Promise.resolve();
    const { frames, ms } = MOVES[kind];
    const anim = rig.animate(frames, { duration: ms, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' });
    return anim.finished.then(
      () => undefined,
      () => undefined,
    );
  }

  /** The pet's on-screen box, for aiming food and confetti. */
  export function element(): SVGSVGElement {
    return svg;
  }
</script>

<svg
  bind:this={svg}
  class="pet"
  class:is-running={running}
  class:is-asleep={expression === 'asleep'}
  class:is-blinking={blinking}
  viewBox="-120 -120 240 240"
  role="img"
  aria-label={label}
  style:--fur={fur}
>
  <defs>
    <radialGradient id="{uid}-glow">
      <stop offset="0%" style="stop-color: rgba(var(--pet-glow-rgb), 0.55)" />
      <stop offset="45%" style="stop-color: rgba(var(--pet-glow-rgb), 0.18)" />
      <stop offset="100%" style="stop-color: rgba(var(--pet-glow-rgb), 0)" />
    </radialGradient>
    <clipPath id="{uid}-eye"><path d={eyeClip} /></clipPath>
    <clipPath id="{uid}-body"><path d={body} /></clipPath>
  </defs>

  <circle class="glow" r="118" fill="url(#{uid}-glow)" opacity={glowLevel} />

  {#if moment && BEHIND.includes(moment)}<MomentPropArt prop={moment} />{/if}
  <g transform="translate(0 84) scale({scale}) translate(0 -84)">
    <ellipse class="shadow" cx="0" cy="88" rx="54" ry="8" />

    {#if stage === 'seedpod'}
      <g class="rig" bind:this={rig}>
        <g class="breath">
          <path class="pod" d="M0 -46C34 -46 52 -6 52 26C52 62 30 84 0 84C-30 84 -52 62 -52 26C-52 -6 -34 -46 0 -46Z" />
          <path class="pod-seam" d="M-50 18L-38 10L-28 20L-16 9L-4 19L8 8L20 19L32 9L42 18L51 12" />
          <circle class="pod-light" cx="-14" cy="44" r="4" />
          <circle class="pod-light" cx="14" cy="44" r="4" />
        </g>
      </g>
    {:else}
      <g class="rig" bind:this={rig}>
        <g class="breath">
          {#if stage === 'grown' && form === 'scamp'}
            <path class="fur" d="M-16 -64Q-20 -84 -6 -92Q-10 -80 -2 -72Q2 -90 18 -94Q8 -84 12 -68Z" />
          {/if}
          {#if stage === 'grown' && form === 'gardener'}
            <path class="stem" d="M0 -72Q-3 -88 3 -98" />
            <path class="leaf" d="M3 -96Q18 -108 28 -96Q16 -86 3 -96Z" />
            <path class="leaf" d="M1 -88Q-14 -98 -22 -86Q-10 -78 1 -88Z" />
          {/if}

          <path class="fur body" d={body} />
          <g clip-path="url(#{uid}-body)">
            <!-- Soft tufts inside the edge, so the fluff reads as fluff. -->
            <path class="tuft" d="M-44 -46q6 -8 14 -9M-30 -58q7 -6 15 -5M40 -48q-6 -8 -14 -9M-58 4q-3 8 0 16M58 4q3 8 0 16" />
            {#each specks as [x, y, r] (`${x},${y}`)}
              <circle class="speck" cx={x} cy={y} {r} />
            {/each}
            {#if grubby > 0.5}
              <ellipse class="smudge" cx="30" cy="48" rx="14" ry="7" />
            {/if}
          </g>

          <ellipse class="cheek" cx="-50" cy="22" rx="11" ry="6.5" />
          <ellipse class="cheek" cx="50" cy="22" rx="11" ry="6.5" />

          {#each [-1, 1] as const as side (side)}
            <g transform="translate({side * EYE.x} {EYE.y})">
              {#if openEyes}
                <g class="eye">
                  <ellipse class="eye-white" rx={EYE.rx} ry={EYE.ry} />
                  <g clip-path="url(#{uid}-eye)">
                    <g class="pupil" style:transform="translate({gaze.x}px, {gaze.y}px)">
                      <circle class="pupil-dot" r={pupil} />
                      <circle class="shine" cx={-pupil * 0.38} cy={-pupil * 0.45} r={pupil * 0.34} />
                      <circle class="shine" cx={pupil * 0.36} cy={pupil * 0.34} r={pupil * 0.15} />
                    </g>
                    {#if lid}
                      <path class="lid" d={lidPath(side, lid)} />
                    {/if}
                  </g>
                  {#if lid}<path class="lid-edge" d={lidEdge(side, lid)} />{/if}
                  <ellipse class="eye-rim" rx={EYE.rx} ry={EYE.ry} />
                </g>
              {:else if expression === 'happy'}
                <path class="eye-arc" d="M-15 6Q0 -16 15 6" />
              {:else if expression === 'dizzy'}
                <path class="eye-arc" d="M-11 -11L11 11M11 -11L-11 11" />
              {:else}
                <path class="eye-arc" d="M-16 -2Q0 11 16 -2" />
              {/if}
            </g>
          {/each}

          {#if expression === 'happy'}
            <path class="mouth" d="M-16 22Q0 27 16 22Q13 46 0 46Q-13 46 -16 22Z" />
            <ellipse class="tongue" cx="0" cy="40" rx="7.5" ry="4.5" />
          {:else if expression === 'eating'}
            {#if chomp}
              <path class="mouth-line" d="M-12 32Q-6 37 0 32Q6 37 12 32" />
            {:else}
              <ellipse class="mouth" cx="0" cy="34" rx="12" ry="11" />
              <ellipse class="tongue" cx="0" cy="40" rx="6.5" ry="3.5" />
            {/if}
          {:else if expression === 'hungry'}
            <ellipse class="mouth" cx="0" cy="33" rx="6" ry="7" />
          {:else if expression === 'surprised'}
            <ellipse class="mouth" cx="0" cy="34" rx="7.5" ry="9.5" />
          {:else if expression === 'sad' || expression === 'unwell'}
            <path class="mouth-line" d="M-9 37Q0 29 9 37" />
          {:else if expression === 'grumpy'}
            <path class="mouth-line" d="M-8 34Q0 31 8 34" />
          {:else if expression === 'asleep' || expression === 'dizzy'}
            <ellipse class="mouth" cx="0" cy="33" rx="4" ry="3.5" />
          {:else}
            <path class="mouth" d="M-11 26Q0 29 11 26Q9 40 0 40Q-9 40 -11 26Z" />
            <ellipse class="tongue" cx="0" cy="36.5" rx="5.5" ry="3" />
          {/if}
        </g>
        <ClothesArt {outfit} />
        {#if wear.includes('bookshelf')}
          <g class="prop glasses">
            <circle cx={-EYE.x} cy={EYE.y} r="31" />
            <circle cx={EYE.x} cy={EYE.y} r="31" />
            <path d="M-3 -14Q0 -18 3 -14M-60 -16L-70 -22M60 -16L70 -22" />
          </g>
        {/if}
        {#if wear.includes('mise')}
          <g class="prop hat">
            <path d="M-30 -60L-28 -76H28L30 -60Q0 -54 -30 -60Z" />
            <path d="M-28 -76Q-46 -84 -38 -100Q-30 -114 -14 -106Q-8 -124 10 -118Q26 -114 22 -102Q42 -106 42 -90Q42 -78 28 -76Z" />
          </g>
        {/if}
        {#if wear.includes('ledger')}
          <g class="prop visor">
            <path d="M-56 -44Q0 -78 56 -44L52 -36Q0 -66 -52 -36Z" />
            <path d="M-34 -50Q0 -66 34 -50Q38 -36 0 -40Q-38 -36 -34 -50Z" />
          </g>
        {/if}
        {#if wear.includes('colophon')}
          <g class="prop quill">
            <path d="M48 -48Q76 -100 104 -112Q92 -80 56 -44Z" />
            <path d="M52 -46L96 -104" class="prop-line" />
          </g>
        {/if}
      </g>

      {#if wear.includes('waymark')}
        <g class="prop pin">
          <path d="M84 -64Q70 -78 70 -92A14 14 0 0 1 98 -92Q98 -78 84 -64Z" />
          <circle cx="84" cy="-92" r="5" class="prop-hole" />
        </g>
      {/if}
      {#if wear.includes('rosetta')}
        <g class="prop bubble">
          <path d="M-104 -96H-58Q-50 -96 -50 -88V-72Q-50 -64 -58 -64H-70L-80 -54V-64H-104Q-112 -64 -112 -72V-88Q-112 -96 -104 -96Z" />
          <circle cx="-94" cy="-80" r="3" class="prop-dot" /><circle cx="-81" cy="-80" r="3" class="prop-dot" /><circle cx="-68" cy="-80" r="3" class="prop-dot" />
        </g>
      {/if}
      {#if wear.includes('cake')}
        <g class="prop cake">
          <path d="M-112 84V62Q-112 56 -106 56H-74Q-68 56 -68 62V84Z" />
          <path d="M-112 66Q-104 72 -98 66Q-90 72 -82 66Q-76 72 -68 66" class="prop-icing" />
          <rect x="-92" y="38" width="4" height="18" rx="2" class="prop-candle" />
          <path d="M-90 26Q-84 32 -90 37Q-96 32 -90 26Z" class="prop-flame" />
        </g>
      {/if}
      {#if stage === 'grown' && form === 'dreamer'}
        <path class="star" d={starPath(82, -70, 11)} />
      {/if}
      {#if expression === 'asleep'}
        <g class="zs" aria-hidden="true">
          <text class="z z1" x="58" y="-58">z</text>
          <text class="z z2" x="72" y="-78">z</text>
          <text class="z z3" x="88" y="-98">z</text>
        </g>
      {/if}
    {/if}
  </g>
  {#if moment && !BEHIND.includes(moment)}<MomentPropArt prop={moment} />{/if}
</svg>

<style>
  .pet {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    touch-action: none;
  }
  .rig,
  .breath {
    transform-box: view-box;
    transform-origin: 0 84px;
  }
  .prop path,
  .prop circle,
  .prop rect {
    stroke: var(--pet-outline);
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .glasses circle {
    fill: var(--pet-eye);
    fill-opacity: 0.18;
  }
  .glasses path {
    fill: none;
  }
  .hat path {
    fill: var(--pet-eye);
  }
  .visor path {
    fill: var(--pet-food-leaf);
    fill-opacity: 0.85;
  }
  .quill path {
    fill: var(--pet-fur-cream);
  }
  .prop .prop-line {
    fill: none;
    stroke-width: 1.6;
  }
  .pin path {
    fill: var(--pet-food-berry);
  }
  .pin .prop-hole,
  .bubble path {
    fill: var(--pet-eye);
  }
  .bubble .prop-dot {
    fill: var(--pet-outline);
    stroke: none;
  }
  .cake path {
    fill: var(--pet-food-crust);
  }
  .cake .prop-icing {
    fill: none;
    stroke: var(--pet-eye);
    stroke-width: 4;
  }
  .cake .prop-candle {
    fill: var(--pet-food-berry);
  }
  .cake .prop-flame {
    fill: var(--pet-food-honey);
  }
  .shadow {
    fill: var(--pet-fur-shade);
    opacity: 0.32;
  }
  .fur {
    fill: var(--fur);
    stroke: var(--pet-outline);
    stroke-width: 3;
    stroke-linejoin: round;
  }
  .tuft {
    fill: none;
    stroke: var(--pet-fur-shade);
    stroke-width: 2.4;
    stroke-linecap: round;
    opacity: 0.7;
  }
  .speck {
    fill: var(--pet-fur-shade);
  }
  .smudge {
    fill: var(--pet-fur-shade);
    opacity: 0.45;
  }
  .cheek {
    fill: var(--pet-cheek);
  }
  .eye {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 70ms linear;
  }
  .is-blinking .eye {
    transform: scaleY(0.08);
  }
  .eye-white {
    fill: var(--pet-eye);
  }
  .eye-rim {
    fill: none;
    stroke: var(--pet-pupil);
    stroke-width: 2.6;
  }
  .pupil {
    transition: transform var(--spring-spatial-fast-dur) var(--spring-spatial-fast);
  }
  .pupil-dot {
    fill: var(--pet-pupil);
  }
  .shine {
    fill: var(--pet-eye);
  }
  .lid {
    fill: var(--fur);
  }
  .lid-edge,
  .eye-arc {
    fill: none;
    stroke: var(--pet-pupil);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .eye-arc {
    stroke-width: 4.5;
  }
  .mouth {
    fill: var(--pet-mouth);
  }
  .mouth-line {
    fill: none;
    stroke: var(--pet-mouth);
    stroke-width: 3.2;
    stroke-linecap: round;
  }
  .tongue {
    fill: var(--pet-tongue);
  }
  .stem {
    fill: none;
    stroke: var(--pet-food-leaf);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .leaf {
    fill: var(--pet-food-leaf);
    stroke: var(--pet-outline);
    stroke-width: 1.5;
  }
  .star {
    fill: var(--accent-bright);
    stroke: var(--pet-outline);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .pod {
    fill: var(--pet-fur-shade);
    stroke: var(--pet-outline);
    stroke-width: 3;
  }
  .pod-seam {
    fill: none;
    stroke: var(--pet-outline);
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .pod-light {
    fill: rgba(var(--pet-glow-rgb), 0.9);
  }
  .z {
    font-family: var(--font-serif);
    font-style: italic;
    fill: var(--text-dim);
    font-size: 18px;
  }
  .z2 {
    font-size: 22px;
  }
  .z3 {
    font-size: 26px;
  }

  /* Living (style.md §11.2): only the pet loops, gently, and only while running. */
  .is-running .breath {
    animation: breathe 3.6s ease-in-out infinite;
  }
  .is-running.is-asleep .breath {
    animation-duration: 5.6s;
  }
  .is-running .star {
    animation: bob 4s ease-in-out infinite;
  }
  .is-running .z {
    animation: drift 3.6s ease-in-out infinite;
  }
  .is-running .z2 {
    animation-delay: 1.2s;
  }
  .is-running .z3 {
    animation-delay: 2.4s;
  }
  @keyframes breathe {
    50% {
      transform: scale(1.022, 0.978);
    }
  }
  @keyframes bob {
    50% {
      transform: translateY(-5px);
    }
  }
  @keyframes drift {
    0%,
    100% {
      opacity: 0.25;
      transform: translateY(4px);
    }
    50% {
      opacity: 1;
      transform: translateY(-4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .eye,
    .pupil {
      transition: none;
    }
  }
</style>
