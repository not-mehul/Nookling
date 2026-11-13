<script lang="ts">
  // A garden plant at its stage of growth, or a bare plot, as pixel art (./scene-art.ts).
  import Pixels from '../../pixel/Pixels.svelte';
  import type { Growth, SeedId } from '../garden';
  import { plantArt } from './scene-art';

  let { seed, stage, size = 64 }: { seed: SeedId | null; stage: Growth; size?: number } = $props();
  const GRID = { x: -30, y: -40, w: 60, h: 70, u: 2 };
  const art = $derived(plantArt(seed, stage));
</script>

<svg class="plant" viewBox="-30 -40 60 70" width={size} height={size} aria-hidden="true">
  <Pixels {art} grid={GRID} />
</svg>

<style>
  .plant {
    overflow: visible;
  }
</style>
