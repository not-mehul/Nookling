<script lang="ts">
  // A garden plant at its stage of growth.
  import type { Growth, SeedId } from '../garden';

  let { seed, stage, size = 64 }: { seed: SeedId; stage: Growth; size?: number } = $props();
  const fruit: Record<SeedId, string> = { mint: 'leaf', strawberry: 'berry', pea: 'leaf', carrot: 'honey', pumpkin: 'honey' };
</script>

<svg class="plant" viewBox="-30 -40 60 70" width={size} height={size} aria-hidden="true">
  <path class="f crust" d="M-26 18Q0 10 26 18L22 30H-22Z" />
  {#if stage === 'seed'}
    <ellipse class="f crust" cx="0" cy="14" rx="5" ry="3.5" />
  {:else}
    <path class="l stem" d={stage === 'sprout' ? 'M0 16V2' : 'M0 16V-18'} />
    <path class="f leaf" d={stage === 'sprout' ? 'M0 4Q-12 -4 -14 4Q-6 10 0 4ZM0 4Q12 -4 14 4Q6 10 0 4Z' : 'M0 -2Q-18 -12 -20 -2Q-10 6 0 -2ZM0 -8Q18 -18 20 -8Q10 0 0 -8Z'} />
    {#if stage === 'bud'}
      <circle class="f cream" cx="0" cy="-20" r="5" />
    {:else if stage === 'ripe'}
      {#if seed === 'pumpkin'}
        <ellipse class="f {fruit[seed]}" cx="0" cy="6" rx="16" ry="11" />
        <path class="l" d="M-6 -4Q-8 6 -6 16M6 -4Q8 6 6 16" />
      {:else if seed === 'carrot'}
        <path class="f {fruit[seed]}" d="M-7 14L0 34L7 14Z" />
        <path class="f leaf" d="M0 14Q-8 -14 -4 -26Q2 -10 0 14ZM0 14Q8 -14 4 -26Q-2 -10 0 14Z" />
      {:else if seed === 'mint'}
        <path class="f leaf" d="M0 -16Q-14 -30 -12 -36Q2 -30 0 -16ZM0 -16Q14 -30 12 -36Q-2 -30 0 -16Z" />
      {:else}
        <circle class="f {fruit[seed]}" cx="-10" cy="-18" r="6" />
        <circle class="f {fruit[seed]}" cx="10" cy="-22" r="6" />
        <circle class="f {fruit[seed]}" cx="0" cy="-30" r="6" />
      {/if}
    {/if}
  {/if}
</svg>

<style>
  .plant {
    overflow: visible;
  }
  .f,
  .l {
    stroke: var(--pet-outline);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .l {
    fill: none;
  }
  .stem {
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
  .cream {
    fill: var(--pet-fur-cream);
  }
</style>
