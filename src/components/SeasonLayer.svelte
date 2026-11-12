<script lang="ts">
  // A few things drifting past the nook, by season: blossom in spring,
  // fireflies on summer evenings, leaves in autumn, snow in winter.
  import { seasonAt } from '../world/treasures';

  let { now }: { now: number } = $props();
  const season = $derived(seasonAt(now));
  const evening = $derived(new Date(now).getHours() >= 18 || new Date(now).getHours() < 6);
  const show = $derived(season !== 'summer' || evening);
  const bits = Array.from({ length: 7 }, (_, i) => ({ x: (i * 15 + 6) % 96, delay: -i * 1.7, dur: 9 + (i % 3) * 3 }));
</script>

{#if show}
  <div class="season season-{season}" data-season={season} aria-hidden="true">
    {#each bits as b, i (i)}
      <span class="bit" style:left="{b.x}%" style:animation-delay="{b.delay}s" style:animation-duration="{b.dur}s"></span>
    {/each}
  </div>
{/if}

<style>
  .season {
    position: absolute;
    inset: 0;
    container-type: size;
    overflow: hidden;
    pointer-events: none;
  }
  .bit {
    position: absolute;
    top: -6%;
    width: 9px;
    height: 9px;
    opacity: 0.7;
    animation: drift linear infinite;
  }
  .season-spring .bit {
    border-radius: 60% 0;
    background: var(--pet-food-berry);
    opacity: 0.45;
  }
  .season-autumn .bit {
    border-radius: 0 70%;
    background: var(--pet-fur-rust);
  }
  .season-autumn .bit:nth-child(even) {
    background: var(--pet-food-honey);
  }
  .season-winter .bit {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pet-fur-cream);
    box-shadow: 0 0 0 1px rgba(var(--shadow-rgb), 0.15);
  }
  .season-summer .bit {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--pet-food-honey);
    box-shadow: 0 0 8px 2px rgba(var(--pet-glow-rgb), 0.8);
    animation-name: float;
    top: 60%;
  }
  @keyframes drift {
    to {
      translate: 30px 115cqh;
      rotate: 220deg;
    }
  }
  @keyframes float {
    50% {
      translate: 14px -40px;
      opacity: 0.2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .season {
      display: none;
    }
  }
</style>
