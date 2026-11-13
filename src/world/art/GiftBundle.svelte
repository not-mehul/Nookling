<script lang="ts">
  // A find, wrapped in a leaf and tied with grass, waiting to be opened.
  import PixelIcon from '../../pixel/PixelIcon.svelte';
  import { GIFT_ART } from './icons-art';

  let { size = 56 }: { size?: number } = $props();
</script>

<PixelIcon art={GIFT_ART} half={30} px={30} {size} class="gift" />
