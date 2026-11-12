<script lang="ts">
  // A find, wrapped in a leaf and tied with grass, waiting to be opened.
  let { size = 56 }: { size?: number } = $props();
</script>

<svg class="gift" viewBox="-30 -30 60 60" width={size} height={size} aria-hidden="true">
  <path class="wrap" d="M-22 -2Q-24 20 0 24Q24 20 22 -2Q12 -10 0 -6Q-12 -10 -22 -2Z" />
  <path class="vein" d="M0 -6V24M-14 4L-4 10M14 4L4 10" />
  <path class="tie" d="M-8 -6Q-16 -20 -2 -14Q0 -8 0 -6Q0 -8 2 -14Q16 -20 8 -6" />
</svg>

<style>
  .gift {
    display: block;
    overflow: visible;
  }
  .wrap {
    fill: var(--pet-food-leaf);
    stroke: var(--pet-outline);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }
  .vein {
    fill: none;
    stroke: var(--pet-outline);
    stroke-width: 1.4;
    opacity: 0.5;
    stroke-linecap: round;
  }
  .tie {
    fill: var(--pet-food-honey);
    stroke: var(--pet-outline);
    stroke-width: 2;
    stroke-linejoin: round;
  }
</style>
