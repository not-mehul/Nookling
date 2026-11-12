<script lang="ts">
  // The nook's things, drawn in the pet's idiom: flat token fills and its outline.
  import type { DecorId } from '../decor';

  let { id, lit = false }: { id: DecorId; lit?: boolean } = $props();
</script>

<svg class="decor" viewBox="-50 -50 100 100" aria-hidden="true" class:is-lit={lit}>
  {#if id === 'rug'}
    <ellipse class="f berry soft" cx="0" cy="10" rx="48" ry="16" />
    <ellipse class="l" cx="0" cy="10" rx="38" ry="11" />
    <ellipse class="l" cx="0" cy="10" rx="26" ry="6" />
  {:else if id === 'cushion'}
    <path class="f sage" d="M-40 14Q-44 -14 -20 -16H20Q44 -14 40 14Q42 30 20 30H-20Q-42 30 -40 14Z" />
    <circle class="o" cx="0" cy="7" r="3" />
    <path class="l" d="M-26 -2Q0 6 26 -2" />
  {:else if id === 'plant'}
    <path class="f crust" d="M-18 14H18L13 46H-13Z" />
    <path class="f leaf" d="M0 14Q-30 -10 -24 -38Q-4 -24 0 14Z" />
    <path class="f leaf" d="M0 14Q26 -14 30 -34Q8 -30 0 14Z" />
    <path class="f leaf" d="M0 14Q-6 -30 4 -48Q12 -24 0 14Z" />
  {:else if id === 'lamp'}
    <circle class="glow" cx="0" cy="-26" r="40" />
    <path class="f honey" d="M-22 -10L-12 -40H12L22 -10Z" />
    <path class="l" d="M0 -10V40" />
    <path class="f crust" d="M-14 40H14Q14 46 0 46Q-14 46 -14 40Z" />
  {:else if id === 'books'}
    <rect class="f berry" x="-34" y="8" width="68" height="14" rx="2" />
    <rect class="f leaf" x="-30" y="-6" width="60" height="14" rx="2" />
    <rect class="f honey" x="-36" y="22" width="72" height="14" rx="2" />
    <path class="l" d="M-24 15H24M-20 1H20M-28 29H28" />
  {:else if id === 'mobile'}
    <path class="l" d="M0 -50V-30M-34 -30H34M-34 -30V-6M0 -30V6M34 -30V-10" />
    <path class="f honey" d="M-34 -6l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" />
    <circle class="f cream" cx="0" cy="12" r="7" />
    <path class="f sage" d="M34 -10Q44 0 34 10Q24 0 34 -10Z" />
  {:else if id === 'ball'}
    <circle class="f berry" r="30" />
    <path class="l" d="M-30 0Q0 -14 30 0M-10 -28Q4 0 -10 28" />
  {:else if id === 'teacup'}
    <path class="f cream" d="M-24 -16H24Q24 16 0 18Q-24 16 -24 -16Z" />
    <path class="l" d="M24 -8Q36 -8 34 4Q32 10 22 8" />
    <path class="f cream" d="M-30 18H30Q26 26 0 26Q-26 26 -30 18Z" />
  {:else if id === 'lights'}
    <path class="l" d="M-50 -30Q-25 -6 0 -24Q25 -6 50 -30" />
    {#each [-38, -20, 0, 20, 38] as x, i (x)}
      <circle class="f bulb {['honey', 'berry', 'leaf', 'honey', 'berry'][i]}" cx={x} cy={-18 + Math.abs(x) * -0.12 + (i % 2) * 4} r="5" />
    {/each}
  {:else if id === 'frame'}
    <rect class="f crust" x="-30" y="-36" width="60" height="72" rx="4" />
    <rect class="f cream" x="-22" y="-28" width="44" height="56" rx="2" />
    <circle class="f sage" cx="0" cy="-2" r="12" />
    <circle class="o" cx="-4" cy="-4" r="2" /><circle class="o" cx="4" cy="-4" r="2" />
  {:else if id === 'blanket'}
    <path class="f rust" d="M-46 -10Q-20 -22 0 -10Q20 2 46 -10L44 24Q20 34 0 22Q-20 10 -44 24Z" />
    <path class="l" d="M-40 0Q-20 -10 0 2Q20 14 40 2" />
  {:else}
    <rect class="f crust" x="-46" y="10" width="92" height="8" rx="2" />
    <path class="l" d="M-34 18V30M34 18V30" />
    <circle class="f sage" cx="-26" cy="2" r="8" />
    <path class="f cream" d="M-4 10Q-14 -10 2 -10Q16 -10 6 10Z" />
    <path class="f honey" d="M28 -6l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
  {/if}
</svg>

<style>
  .decor {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
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
  .soft {
    fill-opacity: 0.45;
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
  .rust {
    fill: var(--pet-fur-rust);
  }
  .glow {
    fill: rgba(var(--pet-glow-rgb), 0);
    stroke: none;
    transition: fill 400ms ease;
  }
  .is-lit .glow {
    fill: rgba(var(--pet-glow-rgb), 0.35);
  }
  .is-lit .bulb {
    filter: drop-shadow(0 0 4px rgba(var(--pet-glow-rgb), 0.9));
  }
</style>
