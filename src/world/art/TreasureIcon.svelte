<script lang="ts">
  // A found thing, drawn small in one token colour with the pet's outline.
  // `hidden` draws it as a silhouette, for the Treasures book's empty slots.
  import type { Treasure } from '../treasures';

  let { treasure, size = 40, hidden = false }: { treasure: Treasure; size?: number; hidden?: boolean } = $props();
  const FILL: Record<Treasure['colour'], string> = {
    berry: '--pet-food-berry',
    leaf: '--pet-food-leaf',
    crust: '--pet-food-crust',
    honey: '--pet-food-honey',
    sage: '--pet-fur-sage',
    cream: '--pet-fur-cream',
    rust: '--pet-fur-rust',
    fur: '--pet-fur',
  };
  const fill = $derived(hidden ? 'var(--border-soft)' : `var(${FILL[treasure.colour]})`);
</script>

<svg class="treasure" class:is-hidden={hidden} viewBox="-20 -20 40 40" width={size} height={size} style:--fill={fill} aria-hidden="true">
  {#if treasure.shape === 'shell'}
    <path class="f" d="M0 15C-12 15 -16 4 -14 -4Q-10 -15 0 -16Q10 -15 14 -4C16 4 12 15 0 15Z" />
    <path class="l" d="M0 14V-14M-7 13Q-9 0 -6 -13M7 13Q9 0 6 -13" />
  {:else if treasure.shape === 'button'}
    <circle class="f" r="14" />
    <circle class="l" r="10" />
    <circle class="o" cx="-3.5" cy="-3.5" r="2" /><circle class="o" cx="3.5" cy="-3.5" r="2" /><circle class="o" cx="-3.5" cy="3.5" r="2" /><circle class="o" cx="3.5" cy="3.5" r="2" />
  {:else if treasure.shape === 'leaf'}
    <path class="f" d="M-13 13Q-16 -10 13 -14Q14 10 -13 13Z" />
    <path class="l" d="M-13 13L8 -8M-4 4L-3 -4M3 -2L6 2" />
  {:else if treasure.shape === 'pebble'}
    <path class="f" d="M-15 3Q-15 -10 -2 -11Q13 -12 15 0Q15 11 0 11Q-15 12 -15 3Z" />
    <path class="l shine" d="M-8 -5Q-4 -8 1 -8" />
  {:else if treasure.shape === 'key'}
    <circle class="f" cx="-8" cy="-6" r="7" />
    <circle class="o" cx="-8" cy="-6" r="2.5" />
    <path class="f" d="M-3 -2L13 12L10 15L7 12L5 14L3 12L5 10L-6 0Z" />
  {:else if treasure.shape === 'feather'}
    <path class="f" d="M-12 15Q-14 -4 12 -16Q10 6 -12 15Z" />
    <path class="l" d="M-14 17L10 -13M-6 6L-10 2M0 0L-3 -5M2 4L7 2" />
  {:else if treasure.shape === 'marble'}
    <circle class="f" r="13" />
    <path class="l" d="M-8 6Q-2 -6 9 -4M-6 -8Q2 2 6 9" />
    <circle class="o shine-dot" cx="-5" cy="-6" r="2.5" />
  {:else if treasure.shape === 'acorn'}
    <path class="f" d="M-10 -2Q-10 14 0 16Q10 14 10 -2Z" />
    <path class="f cap" d="M-13 -2Q-13 -12 0 -12Q13 -12 13 -2Z" />
    <path class="l" d="M0 -12V-16" />
  {:else if treasure.shape === 'clover'}
    <circle class="f" cx="-6" cy="-6" r="6" /><circle class="f" cx="6" cy="-6" r="6" /><circle class="f" cx="-6" cy="6" r="6" /><circle class="f" cx="6" cy="6" r="6" />
    <path class="l" d="M0 0Q4 10 10 16" />
  {:else if treasure.shape === 'cap'}
    <path class="f" d="M-14 0L-12 -4L-14 -8L-9 -10L-8 -14L-3 -13L0 -16L3 -13L8 -14L9 -10L14 -8L12 -4L14 0L12 4L14 8L9 10L8 14L3 13L0 16L-3 13L-8 14L-9 10L-14 8L-12 4Z" />
    <circle class="l" r="7" />
  {:else if treasure.shape === 'ribbon'}
    <path class="f" d="M0 0Q-12 -14 -15 -6Q-14 4 0 0Q12 -14 15 -6Q14 4 0 0Z" />
    <path class="f" d="M-2 1L-9 15L-5 13L-3 16L0 3ZM2 1L9 15L5 13L3 16L0 3Z" />
    <circle class="f" r="3" />
  {:else if treasure.shape === 'star'}
    <path class="f" d="M0 -15L4 -5L15 -4L6 3L9 14L0 8L-9 14L-6 3L-15 -4L-4 -5Z" />
  {:else if treasure.shape === 'glass'}
    <path class="f" d="M-12 -6L-4 -14L10 -10L14 4L4 14L-10 10Z" />
    <path class="l shine" d="M-6 -6L2 -9" />
  {:else if treasure.shape === 'coin'}
    <circle class="f" r="14" />
    <circle class="l" r="10.5" />
    <path class="l" d="M-3 -5H3M0 -5V6M-4 6H4" />
  {:else if treasure.shape === 'thimble'}
    <path class="f" d="M-10 14L-8 -8Q-8 -14 0 -14Q8 -14 8 -8L10 14Z" />
    <path class="l" d="M-11 10H11" />
    <circle class="o" cx="-3" cy="-6" r="1.2" /><circle class="o" cx="3" cy="-6" r="1.2" /><circle class="o" cx="0" cy="-1" r="1.2" /><circle class="o" cx="-4" cy="4" r="1.2" /><circle class="o" cx="4" cy="4" r="1.2" />
  {:else if treasure.shape === 'flower'}
    {#each [0, 72, 144, 216, 288] as a (a)}
      <ellipse class="f" cx="0" cy="-8" rx="5.5" ry="7.5" transform="rotate({a})" />
    {/each}
    <circle class="o centre" r="4.5" />
  {:else if treasure.shape === 'snowflake'}
    <path class="l thick" d="M0 -15V15M-13 -7.5L13 7.5M-13 7.5L13 -7.5M-4 -12L0 -8L4 -12M-4 12L0 8L4 12" />
  {:else}
    <ellipse class="f" rx="11" ry="14" />
    <circle class="o" cx="-4" cy="-4" r="1.5" /><circle class="o" cx="3" cy="2" r="1.2" /><circle class="o" cx="-2" cy="7" r="1.4" /><circle class="o" cx="5" cy="-7" r="1" />
  {/if}
</svg>

<style>
  .treasure {
    display: block;
    overflow: visible;
  }
  .f {
    fill: var(--fill);
    stroke: var(--pet-outline);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .l {
    fill: none;
    stroke: var(--pet-outline);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.7;
  }
  .l.thick {
    stroke-width: 3;
    opacity: 1;
  }
  .l.shine {
    stroke: var(--pet-eye);
    stroke-width: 2.4;
    opacity: 0.9;
  }
  .o {
    fill: var(--pet-outline);
    opacity: 0.75;
  }
  .o.shine-dot {
    fill: var(--pet-eye);
    opacity: 0.9;
  }
  .o.centre {
    fill: var(--pet-food-honey);
    stroke: var(--pet-outline);
    stroke-width: 1.5;
    opacity: 1;
  }
  .cap {
    fill: var(--pet-food-crust);
  }
  .is-hidden .f,
  .is-hidden .o,
  .is-hidden .l {
    fill: var(--border-soft);
    stroke: var(--border-soft);
  }
  .is-hidden .l {
    fill: none;
  }
</style>
