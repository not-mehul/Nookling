<script lang="ts">
  // What it wears, in the pet's own viewBox (-120 to 120): drawn inside the
  // rig so a hat hops when it hops.
  import { EYE } from './geometry';
  import type { Outfit } from '../world/wardrobe';

  let { outfit }: { outfit: Outfit } = $props();
</script>

<g class="clothes" aria-hidden="true">
  {#if outfit.neck === 'scarf'}
    <path class="f berry" d="M-58 40Q0 64 58 40L60 54Q0 80 -60 54Z" />
    <path class="f berry" d="M34 56L46 96L60 92L52 52Z" />
    <path class="l" d="M-30 52L-28 64M0 58V70M30 52L28 64M44 70L56 68M48 82L58 80" />
  {:else if outfit.neck === 'bow'}
    <path class="f berry" d="M0 56L-20 44Q-26 56 -20 68ZM0 56L20 44Q26 56 20 68Z" />
    <circle class="f berry" cx="0" cy="56" r="6" />
  {:else if outfit.neck === 'bandana'}
    <path class="f leaf" d="M-54 42Q0 60 54 42L0 82Z" />
    <circle class="o" cx="-14" cy="56" r="2.4" /><circle class="o" cx="12" cy="60" r="2.4" /><circle class="o" cx="0" cy="70" r="2.4" />
  {:else if outfit.neck === 'bell'}
    <path class="l collar" d="M-52 46Q0 66 52 46" />
    <path class="f honey" d="M-10 72Q-10 56 0 56Q10 56 10 72Z" />
    <circle class="o" cx="0" cy="70" r="2.4" />
  {/if}

  {#if outfit.eyes === 'round-glasses'}
    <circle class="l lens" cx={-EYE.x} cy={EYE.y} r="30" />
    <circle class="l lens" cx={EYE.x} cy={EYE.y} r="30" />
    <path class="l" d="M-4 -14Q0 -18 4 -14M-59 -14L-70 -20M59 -14L70 -20" />
  {:else if outfit.eyes === 'sunglasses'}
    <path class="f dark" d="M-58 -26H-4Q-4 4 -30 6Q-56 4 -58 -26Z" />
    <path class="f dark" d="M58 -26H4Q4 4 30 6Q56 4 58 -26Z" />
    <path class="l" d="M-4 -22H4M-58 -24L-70 -28M58 -24L70 -28" />
  {:else if outfit.eyes === 'monocle'}
    <circle class="l lens" cx={EYE.x} cy={EYE.y} r="30" />
    <path class="l" d="M59 -6Q70 30 50 60" />
  {/if}

  {#if outfit.hat === 'beret'}
    <path class="f berry" d="M-54 -62Q-50 -94 0 -96Q52 -94 56 -64Q30 -74 -54 -62Z" />
    <path class="l" d="M2 -96L6 -106" />
  {:else if outfit.hat === 'flower-crown'}
    <path class="l vine" d="M-62 -48Q0 -88 62 -48" />
    {#each [-48, -24, 0, 24, 48] as x, i (x)}
      <circle class="f {i % 2 ? 'honey' : 'berry'}" cx={x} cy={-58 - (48 - Math.abs(x)) * 0.36} r="8" />
      <circle class="f cream" cx={x} cy={-58 - (48 - Math.abs(x)) * 0.36} r="3" />
    {/each}
  {:else if outfit.hat === 'sun-hat'}
    <ellipse class="f honey" cx="0" cy="-66" rx="90" ry="16" />
    <path class="f honey" d="M-42 -68Q-40 -108 0 -108Q40 -108 42 -68Z" />
    <path class="f berry" d="M-42 -76Q0 -68 42 -76L42 -68Q0 -60 -42 -68Z" />
  {:else if outfit.hat === 'acorn-cap'}
    <path class="f crust" d="M-58 -58Q-56 -102 0 -104Q56 -102 58 -58Q0 -70 -58 -58Z" />
    <path class="l" d="M-40 -84L-30 -66M-14 -94L-10 -68M14 -94L10 -68M40 -84L30 -66" />
    <path class="l stalk" d="M0 -104Q4 -116 12 -118" />
  {:else if outfit.hat === 'woolly-hat'}
    <path class="f sage" d="M-60 -54Q-62 -110 0 -110Q62 -110 60 -54Z" />
    <path class="f cream" d="M-64 -60H64V-46H-64Z" />
    <circle class="f cream" cx="0" cy="-114" r="12" />
    <path class="l" d="M-30 -66V-100M0 -66V-108M30 -66V-100" />
  {:else if outfit.hat === 'party-hat'}
    <path class="f berry" d="M-30 -66L4 -128L34 -66Q2 -58 -30 -66Z" />
    <circle class="o" cx="0" cy="-90" r="3" /><circle class="o" cx="14" cy="-78" r="3" /><circle class="o" cx="-12" cy="-74" r="3" />
    <circle class="f honey" cx="4" cy="-130" r="7" />
  {/if}
</g>

<style>
  .f,
  .l {
    stroke: var(--pet-outline);
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .l {
    fill: none;
  }
  .o {
    fill: var(--pet-outline);
  }
  .lens {
    fill: var(--pet-eye);
    fill-opacity: 0.15;
  }
  .dark {
    fill: var(--pet-pupil);
  }
  .collar {
    stroke: var(--pet-food-berry);
    stroke-width: 6;
  }
  .vine,
  .stalk {
    stroke: var(--pet-food-leaf);
    stroke-width: 3;
  }
  .berry {
    fill: var(--pet-food-berry);
  }
  .leaf {
    fill: var(--pet-food-leaf);
  }
  .crust {
    fill: var(--pet-food-crust);
  }
  .honey {
    fill: var(--pet-food-honey);
  }
  .sage {
    fill: var(--pet-fur-sage);
  }
  .cream {
    fill: var(--pet-fur-cream);
  }
</style>
