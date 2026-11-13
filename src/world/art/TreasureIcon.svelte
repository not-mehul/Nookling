<script lang="ts">
  // A found thing as pixel art. `hidden` draws it as a silhouette, for the
  // Treasures book's empty slots.
  import PixelIcon from '../../pixel/PixelIcon.svelte';
  import type { Treasure } from '../treasures';
  import { treasureArt } from './icons-art';

  let { treasure, size = 40, hidden = false }: { treasure: Treasure; size?: number; hidden?: boolean } = $props();
  const art = $derived(treasureArt(treasure, hidden));
</script>

<PixelIcon {art} half={20} px={20} {size} class="treasure {hidden ? 'is-hidden' : ''}" />
