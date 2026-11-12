<script lang="ts">
  // A food, drawn from its kind and colour token. Original, simple shapes in
  // the pet's idiom: flat fills, the pet's outline.
  import type { Food } from '../domain/foods';

  let { food, size = 44 }: { food: Food; size?: number } = $props();
  const fill = $derived(`var(--pet-food-${food.colour})`);
</script>

<svg class="food" width={size} height={size} viewBox="-24 -24 48 48" aria-hidden="true" style:--food={fill}>
  {#if food.kind === 'meal'}
    <path class="dish" d="M-19 0H19Q17 16 0 17Q-17 16 -19 0Z" />
    <path class="fill" d="M-16 0Q-12 -11 0 -12Q12 -11 16 0Z" />
    <path class="steam" d="M-6 -16q-3 -4 0 -7M3 -17q-3 -4 0 -7" />
  {:else if food.kind === 'fruit'}
    <circle class="fill" cx="-6" cy="4" r="11" />
    <circle class="fill" cx="8" cy="7" r="9" />
    <path class="leaf" d="M2 -10Q10 -20 18 -14Q10 -6 2 -10Z" />
    <circle class="shine" cx="-10" cy="0" r="2.6" />
  {:else if food.kind === 'snack'}
    <ellipse class="fill" cx="-9" cy="4" rx="7" ry="9" transform="rotate(-20 -9 4)" />
    <ellipse class="fill" cx="5" cy="-4" rx="7" ry="9" transform="rotate(15 5 -4)" />
    <ellipse class="fill" cx="9" cy="11" rx="6" ry="8" transform="rotate(70 9 11)" />
  {:else}
    <path class="fill" d="M0 -19Q14 -2 13 7A13 13 0 0 1 -13 7Q-14 -2 0 -19Z" />
    <circle class="shine" cx="-5" cy="3" r="3" />
  {/if}
</svg>

<style>
  .food {
    display: block;
    overflow: visible;
  }
  .fill,
  .leaf,
  .dish {
    stroke: var(--pet-outline);
    stroke-width: 1.8;
    stroke-linejoin: round;
  }
  .fill {
    fill: var(--food);
  }
  .dish {
    fill: var(--pet-fur-shade);
  }
  .leaf {
    fill: var(--pet-food-leaf);
  }
  .shine {
    fill: var(--pet-eye);
    opacity: 0.8;
  }
  .steam {
    fill: none;
    stroke: var(--text-faint);
    stroke-width: 1.8;
    stroke-linecap: round;
  }
</style>
