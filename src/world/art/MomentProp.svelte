<script lang="ts">
  // The thing it is caught with in a little moment, drawn beside it in the
  // pet's own viewBox (-120 to 120) and on its pixel grid, so it sits in the scene.
  import Pixels from '../../pixel/Pixels.svelte';
  import { GRID } from '../../pet/sprite';
  import type { MomentProp } from '../moments';
  import { momentArt } from './moments-art';

  let { prop }: { prop: MomentProp } = $props();
  const art = $derived(momentArt(prop));
</script>

<g class="moment-prop" class:flutter={prop === 'moth'} aria-hidden="true"><Pixels {art} grid={GRID} /></g>

<style>
  .flutter {
    animation: flutter 900ms steps(2, jump-none) infinite alternate;
    transform-box: view-box;
    transform-origin: 70px -88px;
  }
  @keyframes flutter {
    to {
      transform: translateY(-5px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flutter {
      animation: none;
    }
  }
</style>
