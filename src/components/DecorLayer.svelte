<script lang="ts">
  // The nook's things, behind the pet. While decorating, each can be dragged
  // (or nudged with the arrow keys) and the spot is saved when you let go.
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { worldState } from '../state/world.svelte';
  import DecorArt from '../world/art/DecorArt.svelte';
  import { DECOR, place, type DecorId } from '../world/decor';

  let { editing = false, night = false }: { editing?: boolean; night?: boolean } = $props();
  let layer = $state<HTMLDivElement>();
  /** The spot of the thing being dragged, before it's saved. */
  let moving = $state<{ id: DecorId; x: number; y: number } | null>(null);
  const out = $derived(DECOR.filter((d) => worldState.world.decor[d.id]));

  function at(id: DecorId) {
    return moving?.id === id ? moving : worldState.world.decor[id]!;
  }
  function grab(e: PointerEvent, id: DecorId) {
    if (!editing || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moving = { id, ...at(id) };
  }
  function drag(e: PointerEvent) {
    const box = layer?.getBoundingClientRect();
    if (!moving || !box) return;
    moving = { id: moving.id, ...place((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height) };
  }
  function drop() {
    if (!moving) return;
    const { id, x, y } = moving;
    moving = null;
    void worldState.arrange(id, { x, y });
  }
  function nudge(e: KeyboardEvent, id: DecorId) {
    const step: Record<string, [number, number]> = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] };
    const d = step[e.key];
    if (!d) return;
    e.preventDefault();
    const p = at(id);
    void worldState.arrange(id, { x: p.x + d[0], y: p.y + d[1] });
  }
</script>

<div class="decor-layer" class:is-editing={editing} bind:this={layer} aria-hidden={!editing}>
  {#each out as d (d.id)}
    {@const p = at(d.id)}
    {#if editing}
      <button
        type="button"
        class="thing is-movable"
        data-decor={d.id}
        style:left="{p.x * 100}%"
        style:top="{p.y * 100}%"
        style:width="{d.size * 100}%"
        aria-label={t('decor.move', { thing: t(`decor.${d.id}` as MessageKey) })}
        onpointerdown={(e) => grab(e, d.id)}
        onpointermove={drag}
        onpointerup={drop}
        onpointercancel={drop}
        onkeydown={(e) => nudge(e, d.id)}
      >
        <DecorArt id={d.id} lit={night} />
      </button>
    {:else}
      <span class="thing" data-decor={d.id} style:left="{p.x * 100}%" style:top="{p.y * 100}%" style:width="{d.size * 100}%">
        <DecorArt id={d.id} lit={night} />
      </span>
    {/if}
  {/each}
</div>

<style>
  .decor-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .thing {
    position: absolute;
    display: block;
    translate: -50% -50%;
    max-width: 220px;
    padding: 0;
    background: none;
    border: 0;
    opacity: 0.92;
  }
  .decor-layer.is-editing {
    z-index: 2;
  }
  .is-editing .thing {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    outline: 2px dashed var(--border-soft);
    outline-offset: 4px;
    border-radius: var(--corner-md);
  }
  .is-editing .thing:focus-visible {
    outline-color: var(--accent-bright);
  }
</style>
