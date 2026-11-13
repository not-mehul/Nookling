<script lang="ts">
  // Fidget: stretch it, squish it, let go and it springs back. Nothing to
  // win; it just feels nice. A press and hold squishes; a drag stretches.
  // The buttons do the same for anyone who'd rather tap, and Wobble is the
  // shake-the-phone wobble without shaking anything.
  import Sheet from './ui/Sheet.svelte';
  import { t } from '../i18n/index.svelte';
  import Pet from '../pet/Pet.svelte';
  import type { Expression, Form, Stage } from '../pet/types';
  import { buzz } from '../platform/haptics';
  import { chirp } from '../platform/sound';

  let { name, stage, form, onclose }: { name: string; stage: Stage; form: Form | null; onclose: () => void } = $props();
  let blob = $state<HTMLElement>();
  let sx = $state(1);
  let sy = $state(1);
  let tilt = $state(0);
  let face = $state<Expression>('content');
  let boings = $state(0);
  let from: { x: number; y: number } | null = null;
  let squishTimer: ReturnType<typeof setTimeout> | undefined;
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    from = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    face = 'surprised';
    squishTimer = setTimeout(() => {
      sx = 1.25;
      sy = 0.72;
      face = 'happy';
      buzz('light');
    }, 220);
  }
  function drag(e: PointerEvent) {
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.hypot(dx, dy) < 6) return;
    clearTimeout(squishTimer);
    // Stretch along the drag, thin across it; up to half as big again.
    const pull = Math.min(1, Math.hypot(dx, dy) / 160);
    const along = 1 + pull * 0.5;
    const across = 1 - pull * 0.25;
    const sideways = Math.abs(dx) > Math.abs(dy);
    sx = sideways ? along : across;
    sy = sideways ? across : along;
    tilt = Math.max(-12, Math.min(12, dx / 12));
    face = pull > 0.7 ? 'surprised' : 'happy';
  }
  function up() {
    if (!from) return;
    from = null;
    clearTimeout(squishTimer);
    const was = { sx, sy, tilt };
    sx = sy = 1;
    tilt = 0;
    const stretched = Math.abs(was.sx - 1) + Math.abs(was.sy - 1) > 0.15;
    if (stretched) {
      boings += 1;
      chirp('boop');
      buzz('tick');
      if (!reduced && blob?.animate) {
        // A spring: overshoot one way, then the other, settling.
        blob.animate(
          [
            { transform: `scale(${was.sx}, ${was.sy}) rotate(${was.tilt}deg)` },
            { transform: `scale(${2 - was.sx}, ${2 - was.sy}) rotate(${-was.tilt / 2}deg)` },
            { transform: `scale(${1 + (was.sx - 1) * 0.4}, ${1 + (was.sy - 1) * 0.4})` },
            { transform: `scale(${1 - (was.sx - 1) * 0.15}, ${1 - (was.sy - 1) * 0.15})` },
            { transform: 'none' },
          ],
          { duration: 650, easing: 'ease-out' },
        );
      }
      if (boings % 8 === 0) chirp('giggle');
    }
    face = 'happy';
    setTimeout(() => (face = 'content'), 700);
  }
  const SHAPES: Record<string, [number, number]> = { ArrowUp: [0.85, 1.3], ArrowDown: [1.25, 0.72], ArrowLeft: [1.3, 0.85], ArrowRight: [1.3, 0.85] };
  function shape(v: [number, number]) {
    from = { x: 0, y: 0 };
    [sx, sy] = v;
    setTimeout(up, 120);
  }
  function key(e: KeyboardEvent) {
    const v = SHAPES[e.key];
    if (!v) return;
    e.preventDefault();
    shape(v);
  }
  function wobble() {
    face = 'dizzy';
    chirp('giggle');
    buzz('medium');
    if (!reduced && blob?.animate) {
      blob.animate(
        [{ transform: 'none' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }],
        { duration: 900, easing: 'ease-out' },
      );
    }
    setTimeout(() => (face = 'content'), 1400);
  }
</script>

<Sheet title={t('fidget.title', { name })} {onclose}>
  <div
    class="fidget"
    id="fidgetField"
    role="button"
    tabindex="0"
    aria-label={t('fidget.label', { name })}
    onpointerdown={down}
    onpointermove={drag}
    onpointerup={up}
    onpointercancel={up}
    onkeydown={key}
  >
    <div class="blob" bind:this={blob} style:transform="scale({sx}, {sy}) rotate({tilt}deg)">
      <Pet {stage} {form} expression={face} label="" />
    </div>
  </div>
  <div class="fidget-buttons">
    <button type="button" class="btn btn-muted" id="btnSquish" onclick={() => shape(SHAPES.ArrowDown!)}>{t('fidget.squish')}</button>
    <button type="button" class="btn btn-muted" id="btnStretch" onclick={() => shape(SHAPES.ArrowUp!)}>{t('fidget.stretch')}</button>
    <button type="button" class="btn btn-muted" id="btnWobble" onclick={wobble}>{t('fidget.wobble')}</button>
  </div>
  <p class="t-hint" aria-live="polite">{boings ? t('fidget.boings', { count: boings }) : t('fidget.hint')}</p>
</Sheet>

<style>
  .fidget {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    max-height: 50dvh;
    margin: 0 auto var(--space-3);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    cursor: grab;
    border-radius: var(--corner-lg);
    background: var(--panel-bg-faint);
  }
  .fidget-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .blob {
    width: 62%;
    transform-origin: 50% 70%;
    transition: transform 80ms linear;
  }
</style>
