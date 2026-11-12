<script lang="ts">
  // Every face, stage and form of the nookling on one page, still (no
  // breathing), for review. Rendered to docs/ by `npm run sheet`.
  import Pet from './Pet.svelte';
  import { EXPRESSIONS, FORMS, type Expression, type Form, type Stage } from './types';

  const STAGES: { stage: Stage; name: string }[] = [
    { stage: 'seedpod', name: 'Seedpod' },
    { stage: 'sprout', name: 'Sprout' },
    { stage: 'nookling', name: 'Nookling' },
  ];
  const NAMES: Record<Form, string> = { lamplighter: 'Lamplighter', gardener: 'Gardener', dreamer: 'Dreamer', scamp: 'Scamp' };
  const LOOKS: { name: string; look: { x: number; y: number } }[] = [
    { name: 'Looks left', look: { x: -1, y: 0 } },
    { name: 'Looks up', look: { x: 0.3, y: -1 } },
    { name: 'Looks right', look: { x: 1, y: 0.3 } },
  ];
  const STATES: { name: string; expression: Expression; grubby?: number; unwell?: boolean; chomp?: boolean; glow?: number }[] = [
    { name: 'Grubby', expression: 'content', grubby: 1 },
    { name: 'Unwell', expression: 'unwell', unwell: true, glow: 0.15 },
    { name: 'Chomp', expression: 'eating', chomp: true },
  ];
</script>

<div class="container character-sheet">
  <header class="sheet-head">
    <p class="eyebrow">Character sheet</p>
    <h1 class="t-page-title"><em>Nookling</em></h1>
  </header>

  <section class="panel">
    <h2 class="t-section-heading">Faces</h2>
    <div class="grid">
      {#each EXPRESSIONS as expression (expression)}
        <figure>
          <Pet {expression} live={false} label={expression} glow={expression === 'happy' ? 0.9 : 0.5} />
          <figcaption>{expression}</figcaption>
        </figure>
      {/each}
      {#each STATES as s (s.name)}
        <figure>
          <Pet expression={s.expression} grubby={s.grubby} unwell={s.unwell} chomp={s.chomp} glow={s.glow} live={false} label={s.name} />
          <figcaption>{s.name}</figcaption>
        </figure>
      {/each}
      {#each LOOKS as l (l.name)}
        <figure>
          <Pet look={l.look} live={false} label={l.name} />
          <figcaption>{l.name}</figcaption>
        </figure>
      {/each}
    </div>
  </section>

  <section class="panel">
    <h2 class="t-section-heading">Growing up</h2>
    <div class="grid">
      {#each STAGES as s (s.stage)}
        <figure>
          <Pet stage={s.stage} live={false} label={s.name} />
          <figcaption>{s.name}</figcaption>
        </figure>
      {/each}
      {#each FORMS as form (form)}
        <figure>
          <Pet stage="grown" {form} expression="happy" glow={0.8} live={false} label={NAMES[form]} />
          <figcaption>{NAMES[form]}</figcaption>
        </figure>
      {/each}
    </div>
  </section>
</div>

<style>
  .character-sheet {
    max-width: 1100px;
  }
  .sheet-head {
    margin-bottom: var(--space-5);
  }
  .panel {
    padding: var(--space-5);
    margin-bottom: var(--space-5);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-5) var(--space-4);
    margin-top: var(--space-4);
  }
  figure {
    margin: 0;
    display: grid;
    gap: var(--space-2);
    justify-items: center;
  }
  figure :global(.pet) {
    width: 150px;
  }
  figcaption {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
</style>
