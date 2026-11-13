<script lang="ts">
  // Every piece of pixel art besides the pet, on one page, for review.
  // Rendered to docs/ by `npm run sheet`.
  import FoodIcon from '../components/FoodIcon.svelte';
  import { FOODS, GARDEN_FOODS } from '../domain/foods';
  import { TREASURES } from '../world/treasures';
  import TreasureIcon from '../world/art/TreasureIcon.svelte';
  import GiftBundle from '../world/art/GiftBundle.svelte';
  import { DECOR } from '../world/decor';
  import DecorArt from '../world/art/DecorArt.svelte';
  import { SEEDS, type Growth } from '../world/garden';
  import PlantArt from '../world/art/PlantArt.svelte';
  import { VISITORS } from '../world/visitors';
  import VisitorArt from '../world/art/VisitorArt.svelte';
  import Pixels from './Pixels.svelte';
  import PixelIcon from './PixelIcon.svelte';
  import { WINDOW_GRID, windowArt } from '../world/art/window-art';
  import { BACKDROP_GRID, backdropArt, stickerArt, type Backdrop, type Sticker } from '../world/art/photo-art';
  import { BERRY_ART, BUBBLE_ART, noteArt, spotArt } from '../world/art/games-art';
  import type { Sky, Weather } from '../world/weather';
  import type { Season } from '../world/treasures';

  const GROWTH: Growth[] = ['seed', 'sprout', 'bud', 'ripe'];
  const VIEWS: [Sky, Season, Weather][] = [
    ['dawn', 'spring', 'clear'],
    ['day', 'summer', 'cloudy'],
    ['dusk', 'autumn', 'mist'],
    ['night', 'winter', 'snow'],
    ['day', 'autumn', 'rain'],
    ['night', 'summer', 'clear'],
  ];
  const BACKDROPS: Backdrop[] = ['meadow', 'night', 'beach', 'snow'];
  const STICKERS: Sticker[] = ['heart', 'star', 'sparkle', 'leaf', 'note'];
</script>

<div class="container art-sheet">
  <header class="sheet-head">
    <p class="eyebrow">Art sheet</p>
    <h1 class="t-page-title"><em>Nookling</em></h1>
  </header>

  <section class="panel">
    <h2 class="t-section-heading">Pantry</h2>
    <div class="row">
      {#each [...FOODS, ...GARDEN_FOODS] as food (food.id)}<figure><FoodIcon {food} size={72} /><figcaption>{food.name}</figcaption></figure>{/each}
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">Treasures</h2>
    <div class="row">
      <figure><GiftBundle size={72} /><figcaption>Gift</figcaption></figure>
      {#each TREASURES as t (t.id)}<figure><TreasureIcon treasure={t} size={64} /><figcaption>{t.name}</figcaption></figure>{/each}
      <figure><TreasureIcon treasure={TREASURES[0]!} size={64} hidden /><figcaption>Not found yet</figcaption></figure>
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">Decor</h2>
    <div class="row">
      {#each DECOR as d (d.id)}<figure class="decor"><DecorArt id={d.id} lit={d.id === 'lamp' || d.id === 'lights'} /><figcaption>{d.id}</figcaption></figure>{/each}
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">Garden and visitors</h2>
    <div class="row">
      {#each SEEDS as s (s.id)}
        {#each GROWTH as g (g)}<figure><PlantArt seed={s.id} stage={g} size={72} /><figcaption>{s.id} {g}</figcaption></figure>{/each}
      {/each}
      {#each VISITORS as v (v.id)}<figure><VisitorArt id={v.id} size={88} /><figcaption>{v.id}</figcaption></figure>{/each}
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">The window</h2>
    <div class="row wide">
      {#each VIEWS as [sky, season, weather] (`${sky}${season}${weather}`)}
        <figure><svg viewBox="0 0 300 220" width="300"><Pixels art={windowArt(sky, season, weather)} grid={WINDOW_GRID} /></svg><figcaption>{sky}, {season}, {weather}</figcaption></figure>
      {/each}
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">Photo mode and games</h2>
    <div class="row wide">
      {#each BACKDROPS as b (b)}
        {@const art = backdropArt(b)}
        <figure><svg viewBox="0 0 1080 1350" width="160">{#if art}<Pixels {art} grid={BACKDROP_GRID} />{/if}</svg><figcaption>{b}</figcaption></figure>
      {/each}
    </div>
    <div class="row">
      {#each STICKERS as s (s)}<figure><PixelIcon art={stickerArt(s)} half={20} px={16} size={64} /><figcaption>{s}</figcaption></figure>{/each}
      {#each ['cushion', 'basket', 'teapot', 'books'] as s (s)}<figure><PixelIcon art={spotArt(s)} half={30} px={30} size={72} /><figcaption>{s}</figcaption></figure>{/each}
      <figure><PixelIcon art={BUBBLE_ART} half={10} px={20} size={56} /><figcaption>bubble</figcaption></figure>
      <figure><PixelIcon art={BERRY_ART} half={10} px={20} size={56} /><figcaption>berry</figcaption></figure>
      <figure><PixelIcon art={noteArt(false)} half={10} px={20} size={56} /><figcaption>note</figcaption></figure>
      <figure><PixelIcon art={noteArt(true)} half={10} px={20} size={56} /><figcaption>on beat</figcaption></figure>
    </div>
  </section>
</div>

<style>
  .art-sheet {
    max-width: 1100px;
  }
  .sheet-head {
    margin-bottom: var(--space-5);
  }
  .panel {
    padding: var(--space-5);
    margin-bottom: var(--space-5);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-4);
  }
  .row.wide {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  figure {
    margin: 0;
    display: grid;
    gap: var(--space-2);
    justify-items: center;
    align-content: end;
  }
  .decor :global(.decor) {
    width: 96px;
  }
  figcaption {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
    text-align: center;
  }
</style>
