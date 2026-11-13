<script lang="ts">
  // What it wears, in the pet's own viewBox (-120 to 120), on the pet's pixel
  // grid: drawn inside the rig so a hat hops when it hops.
  import Pixels from '../pixel/Pixels.svelte';
  import type { Outfit } from '../world/wardrobe';
  import { clothesArt } from './clothes';
  import { GRID } from './sprite';

  let { outfit }: { outfit: Outfit } = $props();
  const art = $derived(clothesArt(outfit));
</script>

<g class="clothes" aria-hidden="true"><Pixels {art} grid={GRID} /></g>

