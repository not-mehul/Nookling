<script lang="ts">
  // A small piece of pixel art as its own SVG: a food, a treasure, a plant.
  import Pixels from './Pixels.svelte';
  import type { Art } from './raster';

  interface Props {
    art: Art;
    /** The drawing's box, centred on 0,0: `half` either way. */
    half: number;
    /** Pixels across. */
    px: number;
    /** Width and height in CSS pixels; 0 leaves the size to CSS. */
    size?: number;
    class?: string;
  }
  let { art, half, px, size = 40, class: cls = '' }: Props = $props();
  const grid = $derived({ x: -half, y: -half, w: half * 2, h: half * 2, u: (half * 2) / px });
</script>

<svg class="pixel-icon {cls}" viewBox="{-half} {-half} {half * 2} {half * 2}" width={size || undefined} height={size || undefined} aria-hidden="true">
  <Pixels {art} {grid} />
</svg>

<style>
  .pixel-icon {
    display: block;
    overflow: visible;
  }
</style>
