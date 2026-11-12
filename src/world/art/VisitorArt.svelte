<script lang="ts">
  // The visitors: small original critters in the pet's idiom.
  import type { VisitorId } from '../visitors';

  let { id, size = 64 }: { id: VisitorId; size?: number } = $props();
</script>

<svg class="visitor" viewBox="-40 -40 80 80" width={size} height={size} aria-hidden="true">
  {#if id === 'bramble'}
    <path class="f sage" d="M-34 26Q-30 14 -14 14H24Q34 14 34 24Q34 30 26 30H-30Q-36 30 -34 26Z" />
    <circle class="f crust" cx="0" cy="0" r="20" />
    <path class="l" d="M0 0m-12 0a12 12 0 1 0 12 -12M0 0m-5 0a5 5 0 1 0 5 -5" />
    <path class="l" d="M26 14L30 0M32 16L38 4" />
    <circle class="o" cx="30" cy="0" r="2.4" /><circle class="o" cx="38" cy="4" r="2.4" />
  {:else if id === 'lumen'}
    <path class="f cream" d="M0 4Q-34 -26 -34 4Q-30 22 0 8Q30 22 34 4Q34 -26 0 4Z" />
    <ellipse class="f honey" cx="0" cy="6" rx="6" ry="16" />
    <path class="l" d="M-2 -10Q-8 -24 -14 -26M2 -10Q8 -24 14 -26" />
    <circle class="o" cx="-3" cy="-4" r="1.6" /><circle class="o" cx="3" cy="-4" r="1.6" />
  {:else if id === 'tock'}
    <ellipse class="f rust" cx="0" cy="8" rx="26" ry="20" />
    <path class="l" d="M0 -12V28M-24 0Q-12 4 0 0Q12 4 24 0" />
    <circle class="f sage" cx="0" cy="-14" r="10" />
    <circle class="o" cx="-4" cy="-15" r="2" /><circle class="o" cx="4" cy="-15" r="2" />
    <path class="l" d="M-20 24L-28 32M20 24L28 32M-26 12L-34 14M26 12L34 14" />
  {:else if id === 'fennel'}
    <ellipse class="f leaf" cx="0" cy="12" rx="28" ry="18" />
    <circle class="f leaf" cx="-14" cy="-6" r="10" />
    <circle class="f leaf" cx="14" cy="-6" r="10" />
    <circle class="eye" cx="-14" cy="-7" r="5" /><circle class="eye" cx="14" cy="-7" r="5" />
    <circle class="o" cx="-14" cy="-7" r="2.4" /><circle class="o" cx="14" cy="-7" r="2.4" />
    <path class="l" d="M-10 14Q0 20 10 14" />
  {:else}
    <path class="f cream" d="M-26 10Q-34 -6 -18 -12Q-14 -28 2 -24Q18 -30 22 -12Q36 -6 28 10Q30 26 10 24Q0 32 -10 24Q-30 26 -26 10Z" />
    <circle class="o" cx="-7" cy="0" r="2.6" /><circle class="o" cx="7" cy="0" r="2.6" />
    <path class="l" d="M-4 8Q0 11 4 8" />
  {/if}
</svg>

<style>
  .visitor {
    overflow: visible;
  }
  .f,
  .l {
    stroke: var(--pet-outline);
    stroke-width: 2.2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .l {
    fill: none;
  }
  .o {
    fill: var(--pet-outline);
  }
  .eye {
    fill: var(--pet-eye);
    stroke: var(--pet-outline);
    stroke-width: 1.6;
  }
  .sage {
    fill: var(--pet-fur-sage);
  }
  .crust {
    fill: var(--pet-food-crust);
  }
  .cream {
    fill: var(--pet-fur-cream);
  }
  .honey {
    fill: var(--pet-food-honey);
  }
  .rust {
    fill: var(--pet-fur-rust);
  }
  .leaf {
    fill: var(--pet-food-leaf);
  }
</style>
