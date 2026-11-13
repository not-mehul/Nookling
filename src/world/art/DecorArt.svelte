<script lang="ts">
  // The nook's things as pixel art (./scene-art.ts). The lamp and the fairy
  // lights glow when lit.
  import Pixels from '../../pixel/Pixels.svelte';
  import type { DecorId } from '../decor';
  import { decorArt, decorGlow } from './scene-art';

  let { id, lit = false }: { id: DecorId; lit?: boolean } = $props();
  const GRID = { x: -50, y: -50, w: 100, h: 100, u: 2.5 };
  const art = $derived(decorArt(id));
  const glow = $derived(decorGlow(id));
</script>

<svg class="decor" viewBox="-50 -50 100 100" aria-hidden="true" class:is-lit={lit}>
  {#if glow}<g class="glow"><Pixels art={glow} grid={GRID} /></g>{/if}
  <Pixels {art} grid={GRID} />
</svg>

<style>
  .decor {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .glow {
    opacity: 0;
    transition: opacity 400ms steps(4, end);
  }
  .is-lit .glow {
    opacity: 1;
  }
</style>
