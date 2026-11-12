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
      {#if backdrop === 'meadow'}
        <rect class="sky-day" width="1080" height="1350" />
        <path class="hill" d="M0 900Q300 760 600 860T1080 820V1350H0Z" />
        <circle class="sun" cx="860" cy="220" r="90" />
        {#each [[160, 1040], [420, 1120], [760, 1060], [940, 1180]] as [x, y] (`${x}`)}<circle class="flower" cx={x} cy={y} r="18" />{/each}
      {:else if backdrop === 'night'}
        <rect class="sky-night" width="1080" height="1350" />
        {#each Array.from({ length: 30 }, (_, i) => i) as i (i)}<circle class="star" cx={(i * 317) % 1080} cy={(i * 211) % 900} r={3 + (i % 3) * 2} />{/each}
        <circle class="moon" cx="220" cy="220" r="80" />
      {:else if backdrop === 'beach'}
        <rect class="sky-day" width="1080" height="1350" />
        <rect class="sea" y="760" width="1080" height="200" />
        <path class="sand" d="M0 940Q540 880 1080 940V1350H0Z" />
        <circle class="sun" cx="200" cy="260" r="90" />
      {:else if backdrop === 'snow'}
        <rect class="sky-snow" width="1080" height="1350" />
        <path class="drift" d="M0 960Q360 880 700 960T1080 940V1350H0Z" />
        {#each Array.from({ length: 36 }, (_, i) => i) as i (i)}<circle class="flake" cx={(i * 293) % 1080} cy={(i * 157) % 1000} r={5 + (i % 4) * 2} />{/each}
      {/if}
      {#each stuck as s (s.id)}
        <g transform="translate({s.x} {s.y}) rotate({s.r}) scale(3)" class="sticker">
          {#if s.kind === 'heart'}<path class="berry" d="M0 12C-22 -2 -16 -18 -6 -16Q0 -15 0 -8Q0 -15 6 -16C16 -18 22 -2 0 12Z" />
          {:else if s.kind === 'star'}<path class="honey" d="M0 -16l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" />
          {:else if s.kind === 'sparkle'}<path class="cream" d="M0 -16Q2 -2 16 0Q2 2 0 16Q-2 2 -16 0Q-2 -2 0 -16Z" />
          {:else if s.kind === 'leaf'}<path class="leaf" d="M-12 12Q-14 -10 12 -13Q13 9 -12 12Z" />
          {:else}<path class="ink" d="M-4 10A5 5 0 1 1 -4 9V-14L10 -16V6A5 5 0 1 1 10 5V-9L-4 -7Z" />{/if}
        </g>
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
  .sky-day {
    fill: var(--pet-fur-sage);
    fill-opacity: 0.35;
  }
  .sky-night {
    fill: var(--pet-pupil);
  }
  .sky-snow {
    fill: var(--pet-fur-cream);
    fill-opacity: 0.6;
  }
  .hill {
    fill: var(--pet-food-leaf);
    fill-opacity: 0.6;
  }
  .sun {
    fill: var(--pet-food-honey);
  }
  .moon,
  .star,
  .flake,
  .drift,
  .cream {
    fill: var(--pet-fur-cream);
  }
  .flower,
  .berry {
    fill: var(--pet-food-berry);
  }
  .sea {
    fill: var(--pet-fur-sage);
  }
  .sand,
  .honey {
    fill: var(--pet-food-honey);
  }
  .leaf {
    fill: var(--pet-food-leaf);
  }
  .ink {
    fill: var(--pet-outline);
  }
  .sticker path {
    stroke: var(--pet-outline);
    stroke-width: 1.4;
    stroke-linejoin: round;
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
