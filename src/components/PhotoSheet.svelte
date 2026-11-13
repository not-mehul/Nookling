<script lang="ts">
  // Photo mode: a backdrop, a pose and a few stickers, then a picture for
  // the Journal's album.
  import Sheet from './ui/Sheet.svelte';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { snapshot } from '../lib/snapshot';
  import Pet from '../pet/Pet.svelte';
  import type { Expression, Form, Prop, Stage } from '../pet/types';
  import { chirp } from '../platform/sound';
  import { petState } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';
  import { worldState } from '../state/world.svelte';
  import Pixels from '../pixel/Pixels.svelte';
  import { BACKDROP_GRID, STICKER_GRID, backdropArt, stickerArt } from '../world/art/photo-art';

  let { name, stage, form, wear, onclose }: { name: string; stage: Stage; form: Form | null; wear: readonly Prop[]; onclose: () => void } = $props();

  const BACKDROPS = ['plain', 'meadow', 'night', 'beach', 'snow'] as const;
  const POSES: { id: string; face: Expression; look: { x: number; y: number } }[] = [
    { id: 'smile', face: 'happy', look: { x: 0, y: 0 } },
    { id: 'wonder', face: 'surprised', look: { x: 0, y: -0.8 } },
    { id: 'cheeky', face: 'content', look: { x: 0.9, y: 0.1 } },
    { id: 'sleepy', face: 'sleepy', look: { x: 0, y: 0.4 } },
    { id: 'dreamy', face: 'asleep', look: { x: 0, y: 0 } },
  ];
  const STICKERS = ['heart', 'star', 'sparkle', 'leaf', 'note'] as const;
  type Sticker = (typeof STICKERS)[number];

  let backdrop = $state<(typeof BACKDROPS)[number]>('plain');
  let pose = $state(POSES[0]!);
  const backArt = $derived(backdropArt(backdrop));
  let stuck = $state<{ id: number; kind: Sticker; x: number; y: number; r: number }[]>([]);
  let back = $state<SVGSVGElement>();
  let rig = $state<ReturnType<typeof Pet>>();
  let saving = $state(false);
  let nextId = 0;

  function stick(kind: Sticker) {
    if (stuck.length >= 12) return;
    // Round the edges of the picture, where the pet isn't.
    const a = Math.random() * Math.PI * 2;
    stuck = [...stuck, { id: ++nextId, kind, x: 540 + Math.cos(a) * (360 + Math.random() * 100), y: 560 + Math.sin(a) * (380 + Math.random() * 80), r: Math.random() * 40 - 20 }];
    chirp('pop');
  }
  async function save() {
    const svg = rig?.element();
    if (!svg || !back || saving) return;
    saving = true;
    try {
      const caption = t('photo.caption', { date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) });
      await petState.addPhoto(await snapshot(svg, name, caption, back));
      chirp('happy');
      ui.notify(t('nook.pictureTaken'), 'success');
      onclose();
    } finally {
      saving = false;
    }
  }
</script>

<Sheet title={t('photo.title')} {onclose}>
  <div class="studio" id="photoStudio">
    <svg bind:this={back} class="backdrop" viewBox="0 0 1080 1350" aria-hidden="true">
      {#if backArt}<Pixels art={backArt} grid={BACKDROP_GRID} />{/if}
      {#each stuck as s (s.id)}
        <g transform="translate({s.x} {s.y}) scale(3)" class="sticker"><Pixels art={stickerArt(s.kind)} grid={STICKER_GRID} /></g>
      {/each}
    </svg>
    <div class="model">
      <Pet bind:this={rig} {stage} {form} expression={pose.face} look={pose.look} {wear} outfit={worldState.world.wardrobe.wearing} live={false} label={t('photo.model', { name })} />
    </div>
    <p class="name-card" aria-hidden="true">{name}</p>
  </div>

  <h3 class="t-field-label">{t('photo.backdrop')}</h3>
  <div class="segmented wrap" role="radiogroup" aria-label={t('photo.backdrop')}>
    {#each BACKDROPS as b (b)}<button type="button" role="radio" aria-checked={backdrop === b} data-backdrop={b} onclick={() => (backdrop = b)}>{t(`photo.bg.${b}` as MessageKey)}</button>{/each}
  </div>
  <h3 class="t-field-label">{t('photo.pose')}</h3>
  <div class="segmented wrap" role="radiogroup" aria-label={t('photo.pose')}>
    {#each POSES as p (p.id)}<button type="button" role="radio" aria-checked={pose.id === p.id} data-pose={p.id} onclick={() => (pose = p)}>{t(`photo.pose.${p.id}` as MessageKey)}</button>{/each}
  </div>
  <h3 class="t-field-label">{t('photo.stickers')}</h3>
  <div class="stickers">
    {#each STICKERS as s (s)}<button type="button" class="btn btn-muted" data-sticker={s} onclick={() => stick(s)}>{t(`photo.sticker.${s}` as MessageKey)}</button>{/each}
    {#if stuck.length}<button type="button" class="btn btn-muted" onclick={() => (stuck = [])}>{t('photo.clear')}</button>{/if}
  </div>
  <button type="button" class="btn btn-primary btn-block" id="btnSnap" disabled={saving} onclick={save}>{t('photo.save')}</button>
</Sheet>

<style>
  .studio {
    position: relative;
    width: min(100%, 320px);
    aspect-ratio: 1080 / 1350;
    margin: 0 auto var(--space-3);
    border-radius: var(--corner-lg);
    overflow: hidden;
    background: linear-gradient(var(--bg-grad-top), var(--bg-grad-mid), var(--bg-grad-bot));
    border: 1px solid var(--border-soft);
  }
  .backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  /* Where snapshot() draws the pet: 820 wide at 130 from the left, 120 down. */
  .model {
    position: absolute;
    left: 12.04%;
    top: 8.89%;
    width: 75.93%;
  }
  .name-card {
    position: absolute;
    left: 0;
    right: 0;
    top: 76%;
    text-align: center;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.5rem;
    color: var(--text-heading);
  }
  h3 {
    margin: var(--space-3) 0 var(--space-2);
  }
  .wrap {
    flex-wrap: wrap;
  }
  .stickers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
</style>
