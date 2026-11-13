<script lang="ts">
  // A food as pixel art (src/world/art/icons-art.ts): its own picture where it
  // has one, otherwise by kind in its colour token.
  import type { Food } from '../domain/foods';
  import PixelIcon from '../pixel/PixelIcon.svelte';
  import { foodArt } from '../world/art/icons-art';

  let { food, size = 44 }: { food: Food; size?: number } = $props();
  const art = $derived(foodArt(food));
</script>

<PixelIcon {art} half={24} px={24} {size} class="food" />
