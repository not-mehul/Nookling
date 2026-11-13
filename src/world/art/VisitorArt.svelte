<script lang="ts">
  // The visitors: small original critters, as pixel art (./scene-art.ts).
  import Pixels from '../../pixel/Pixels.svelte';
  import type { VisitorId } from '../visitors';
  import { visitorArt } from './scene-art';

  let { id, size = 64 }: { id: VisitorId; size?: number } = $props();
  const GRID = { x: -40, y: -40, w: 80, h: 80, u: 2.5 };
  const art = $derived(visitorArt(id));
</script>

<svg class="visitor" viewBox="-40 -40 80 80" width={size} height={size} aria-hidden="true">
  <Pixels {art} grid={GRID} />
</svg>

<style>
  .visitor {
    overflow: visible;
  }
</style>
