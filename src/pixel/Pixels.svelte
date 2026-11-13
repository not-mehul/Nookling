<script lang="ts">
  // Draws pixel art (./raster.ts) inside an SVG: one path per colour, crisp edges.
  import { render, type Art, type Grid } from './raster';

  let { art, grid, class: cls = '' }: { art: Art; grid: Grid; class?: string } = $props();
  const runs = $derived(render(art, grid));
</script>

<g class="px {cls}" shape-rendering="crispEdges">
  {#each runs as run, i (i)}
    <path style:fill={run.fill} d={run.d} />
  {/each}
</g>
