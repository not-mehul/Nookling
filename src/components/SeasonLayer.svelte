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
  /* Each bit is a few square pixels (a stepped clip-path), and it falls in
     whole steps, so it reads as part of the pixel world. */
  .bit {
    position: absolute;
    top: -6%;
    width: 12px;
    height: 12px;
    opacity: 0.8;
    animation: drift steps(60, end) infinite;
  }
  .season-spring .bit {
    background: var(--pet-food-berry);
    opacity: 0.55;
    clip-path: polygon(33% 0, 100% 0, 100% 67%, 67% 67%, 67% 100%, 0 100%, 0 33%, 33% 33%);
  }
  .season-autumn .bit {
    background: var(--pet-fur-rust);
    clip-path: polygon(0 0, 67% 0, 67% 33%, 100% 33%, 100% 100%, 33% 100%, 33% 67%, 0 67%);
  }
  .season-autumn .bit:nth-child(even) {
    background: var(--pet-food-honey);
  }
  .season-winter .bit {
    width: 9px;
    height: 9px;
    background: var(--pet-fur-cream);
    clip-path: polygon(33% 0, 67% 0, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0 67%, 0 33%, 33% 33%);
  }
  .season-summer .bit {
    width: 6px;
    height: 6px;
    background: var(--pet-food-honey);
    box-shadow:
      0 0 0 3px rgba(var(--pet-glow-rgb), 0.35),
      0 0 0 6px rgba(var(--pet-glow-rgb), 0.15);
    animation-name: float;
    animation-timing-function: steps(12, end);
    top: 60%;
  }
  @keyframes drift {
    to {
      translate: 30px 115cqh;
      rotate: 180deg;
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
