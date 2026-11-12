<script lang="ts">
  // The thing it is caught with in a little moment, drawn beside it in the
  // pet's own viewBox (-120 to 120), so it sits in the scene.
  import type { MomentProp } from '../moments';

  let { prop }: { prop: MomentProp } = $props();
</script>

<g class="moment-prop" aria-hidden="true">
  {#if prop === 'moth'}
    <g class="flutter" transform="translate(70 -88)">
      <path class="f cream" d="M0 0Q-16 -16 -20 -2Q-16 8 0 0Q16 -16 20 -2Q16 8 0 0Z" />
      <path class="l" d="M0 -2V6M0 -2L-4 -9M0 -2L4 -9" />
    </g>
  {:else if prop === 'teacup'}
    <g transform="translate(-92 66)">
      <path class="f cream" d="M-20 -14H20Q20 12 0 14Q-20 12 -20 -14Z" />
      <path class="l" d="M20 -8Q30 -8 28 2Q26 8 18 6" />
      <path class="f cream" d="M-26 14H26Q22 20 0 20Q-22 20 -26 14Z" />
      <path class="l steam" d="M-6 -20Q-10 -28 -4 -34M6 -20Q2 -28 8 -34" />
    </g>
  {:else if prop === 'book'}
    <g transform="translate(-88 74)">
      <path class="f berry" d="M-28 -10L0 -4L28 -10V12L0 18L-28 12Z" />
      <path class="f cream" d="M-24 -10L0 -5L24 -10V8L0 14L-24 8Z" />
      <path class="l" d="M0 -5V14M-18 -3L-6 -1M-18 2L-6 4M6 -1L18 -3M6 4L18 2" />
    </g>
  {:else if prop === 'dandelion'}
    <g transform="translate(86 -20)">
      <path class="l stem" d="M0 0Q-4 40 2 80" />
      {#each Array.from({ length: 12 }, (_, i) => i * 30) as a (a)}
        <path class="l seed" d="M0 0L0 -16" transform="rotate({a})" />
        <circle class="o cream-dot" cx="0" cy="-17" r="2.5" transform="rotate({a})" />
      {/each}
    </g>
  {:else if prop === 'ladybug'}
    <g transform="translate(34 -66) rotate(20)">
      <ellipse class="f berry" rx="10" ry="8" />
      <path class="l" d="M0 -8V8" />
      <circle class="o" cx="-4" cy="-2" r="1.8" /><circle class="o" cx="4" cy="3" r="1.8" />
      <circle class="o" cx="-11" cy="0" r="4" />
    </g>
  {:else if prop === 'leaves'}
    <g transform="translate(0 92)">
      {#each [[-80, 0, 20, 'rust'], [-58, -6, -30, 'honey'], [64, -2, 40, 'rust'], [84, 2, -10, 'leaf'], [-96, -2, 70, 'honey']] as [x, y, r, c] (`${x}`)}
        <path class="f {c}" d="M-12 6Q-14 -8 12 -9Q12 8 -12 6Z" transform="translate({x} {y}) rotate({r})" />
      {/each}
    </g>
  {:else if prop === 'puddle'}
    <ellipse class="f sage puddle" cx="0" cy="88" rx="96" ry="14" />
    <path class="l shine" d="M-50 86Q-30 82 -10 86M30 90Q44 87 58 90" />
  {:else if prop === 'yarn'}
    <g transform="translate(-86 62)">
      <circle class="f berry" r="18" />
      <path class="l" d="M-14 -10Q0 0 -6 16M-4 -17Q10 -4 4 17M8 -15Q16 0 14 10" />
      <path class="l" d="M16 8Q60 26 90 18" />
    </g>
  {:else if prop === 'bubbles'}
    {#each [[60, -70, 12], [84, -40, 8], [70, -106, 6], [-70, -84, 9], [-88, -54, 5]] as [x, y, r] (`${x}`)}
      <circle class="bubble" cx={x} cy={y} r={r} />
    {/each}
  {:else if prop === 'sunbeam'}
    <path class="beam" d="M-60 -120L20 -120L110 100L-30 100Z" />
  {:else if prop === 'blanket'}
    <path class="f rust" d="M-90 40Q-60 10 0 24Q60 10 90 40L84 96H-84Z" />
    <path class="l" d="M-70 50L-64 90M-30 40L-28 92M10 42L12 92M50 40L46 90" />
  {:else if prop === 'cloud'}
    <path class="f cream" d="M40 -84Q40 -100 56 -100Q64 -114 80 -106Q96 -110 98 -94Q110 -90 104 -78H44Q36 -78 40 -84Z" />
  {:else if prop === 'snow'}
    {#each [[-80, -90], [-40, -110], [10, -100], [60, -96], [96, -70], [-100, -40], [90, -20], [-60, -60]] as [x, y] (`${x}${y}`)}
      <circle class="flake" cx={x} cy={y} r="3.5" />
    {/each}
  {:else if prop === 'flower'}
    <g transform="translate(88 30)">
      <path class="l stem" d="M0 0V60" />
      {#each [0, 72, 144, 216, 288] as a (a)}
        <ellipse class="f berry" cx="0" cy="-9" rx="6" ry="9" transform="rotate({a})" />
      {/each}
      <circle class="f honey" r="5" />
    </g>
  {:else if prop === 'mirror'}
    <g transform="translate(-92 20)">
      <ellipse class="f cream" rx="20" ry="28" />
      <ellipse class="mirror-glass" rx="14" ry="21" />
      <path class="l" d="M0 28V64M-12 64H12" />
    </g>
  {:else}
    <g class="notes">
      <path class="l thick" d="M70 -70V-96L90 -100V-74" />
      <circle class="o" cx="66" cy="-70" r="5" /><circle class="o" cx="86" cy="-74" r="5" />
      <path class="l thick" d="M-80 -86V-108" />
      <circle class="o" cx="-84" cy="-86" r="5" />
    </g>
  {/if}
</g>

<style>
  .f {
    stroke: var(--pet-outline);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }
  .berry {
    fill: var(--pet-food-berry);
  }
  .honey {
    fill: var(--pet-food-honey);
  }
  .leaf {
    fill: var(--pet-food-leaf);
  }
  .rust {
    fill: var(--pet-fur-rust);
  }
  .sage {
    fill: var(--pet-fur-sage);
  }
  .cream {
    fill: var(--pet-fur-cream);
  }
  .puddle {
    opacity: 0.7;
  }
  .l {
    fill: none;
    stroke: var(--pet-outline);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .l.thick {
    stroke-width: 3;
  }
  .l.stem {
    stroke: var(--pet-food-leaf);
    stroke-width: 3;
  }
  .l.seed {
    stroke-width: 1;
    opacity: 0.6;
  }
  .l.shine {
    stroke: var(--pet-eye);
    opacity: 0.7;
  }
  .l.steam {
    opacity: 0.45;
  }
  .o {
    fill: var(--pet-outline);
  }
  .cream-dot {
    fill: var(--pet-fur-cream);
  }
  .bubble {
    fill: var(--pet-eye);
    fill-opacity: 0.25;
    stroke: var(--pet-outline);
    stroke-opacity: 0.5;
    stroke-width: 1.5;
  }
  .beam {
    fill: var(--pet-food-honey);
    opacity: 0.16;
  }
  .flake {
    fill: var(--pet-eye);
    stroke: var(--pet-outline);
    stroke-opacity: 0.4;
    stroke-width: 1;
  }
  .mirror-glass {
    fill: var(--pet-fur-sage);
    opacity: 0.6;
  }
  .flutter {
    animation: flutter 600ms ease-in-out infinite alternate;
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes flutter {
    to {
      scale: 0.8 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flutter {
      animation: none;
    }
  }
</style>
