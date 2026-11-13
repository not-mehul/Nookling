<script lang="ts">
  // The nookling (style.md §3.7 pet tokens, §11.2 living subject). One inline
  // SVG rig: fluff, eyes, mouth, cheeks and glow, every colour a token, so it
  // follows the theme with no redraw. It breathes and blinks while it is on
  // screen and the page is visible; under reduced motion it holds still poses.
  // One-off movements come from `react()`, on the Web Animations API.
  import { onMount } from 'svelte';
  import { furToken, type Expression, type Form, type Prop, type Reaction, type Stage } from './types';
  import { GLOW_ART, GRID, SHADOW_ART, STAR_ART, Z_ART, bodyArt, faceArt, propArt } from './sprite';
  import Pixels from '../pixel/Pixels.svelte';
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

  const fur = $derived(`var(${furToken(stage, form, unwell)})`);
  const scale = $derived(stage === 'sprout' ? 0.74 : 1);
  const glowLevel = $derived(clamp(glow, 0, 1) * (stage === 'grown' && form === 'lamplighter' ? 1 : 0.8));

  function clamp(n: number, lo = -1, hi = 1): number {
    return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));
  }

  const body = $derived(bodyArt(stage, form, grubby));
  const extras = $derived(propArt(wear));
  const openEyes = $derived(expression !== 'happy' && expression !== 'asleep' && expression !== 'dizzy');

  // ── Living: breathing runs in CSS; blinking is timed here. Both stop when
  //    the pet is off screen or the page is hidden, and under reduced motion.
  let svg: SVGSVGElement;
  let rig = $state<SVGGElement>();
  let visible = $state(true);
  let pageShown = $state(typeof document === 'undefined' || !document.hidden);
  let blinking = $state(false);
  // Pupils step in whole pixels, so a small look change often draws nothing new.
  const face = $derived(faceArt({ expression, look, blinking, chomp }));
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
  viewBox="-120 -120 240 240"
  role="img"
  aria-label={label}
  style:--fur={fur}
>
  <g class="glow" opacity={glowLevel}><Pixels art={GLOW_ART} grid={GRID} /></g>

  {#if moment && BEHIND.includes(moment)}<MomentPropArt prop={moment} />{/if}
  <g transform="translate(0 84) scale({scale}) translate(0 -84)">
    <g class="shadow"><Pixels art={SHADOW_ART} grid={GRID} /></g>

    <g class="rig" bind:this={rig}>
      <g class="breath">
        <Pixels art={body} grid={GRID} class="body" />
        {#if stage !== 'seedpod'}<Pixels art={face} grid={GRID} class="face" />{/if}
      </g>
      {#if stage !== 'seedpod'}
        <ClothesArt {outfit} />
        <g class="prop" class:hat={wear.includes('mise')}><Pixels art={extras.worn} grid={GRID} /></g>
      {/if}
    </g>
    {#if stage !== 'seedpod'}
      <Pixels art={extras.beside} grid={GRID} />
      {#if stage === 'grown' && form === 'dreamer'}<g class="star"><Pixels art={STAR_ART} grid={GRID} /></g>{/if}
      {#if expression === 'asleep'}<g class="zs" aria-hidden="true"><Pixels art={Z_ART} grid={GRID} /></g>{/if}
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
  .shadow {
    opacity: 0.4;
  }

  /* Living (style.md §11.2): only the pet loops, gently, and only while running.
     Pixel art moves in whole pixels, so the breath steps rather than glides. */
  .is-running .breath {
    animation: breathe 3.6s steps(1, end) infinite;
  }
  .is-running.is-asleep .breath {
    animation-duration: 5.6s;
  }
  .is-running .star {
    animation: bob 4s steps(1, end) infinite;
  }
  .is-running .zs {
    animation: drift 3.6s steps(4, end) infinite;
  }
  @keyframes breathe {
    25% {
      transform: scale(1.026, 0.974);
    }
    50% {
      transform: scale(1.04, 0.96);
    }
    75% {
      transform: scale(1.026, 0.974);
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
      opacity: 0.35;
      transform: translateY(5px);
    }
    50% {
      opacity: 1;
      transform: translateY(-5px);
    }
  }
</style>
