<script lang="ts">
  // style.md §8.22: a labelled bar with the level as a word.
  import { level } from '../domain/pet';

  let { id, label, value, words }: { id: string; label: string; value: number; words: Record<'full' | 'fine' | 'low' | 'empty', string> } = $props();
  const state = $derived(level(value));
  const word = $derived(words[state]);
</script>

<div class="need-meter" class:is-low={state === 'low'} class:is-critical={state === 'empty'} style:--value={value} {id}>
  <div class="need-meter-head">
    <span class="need-meter-label" id="{id}-label">{label}</span>
    <span class="need-meter-word">{word}</span>
  </div>
  <div
    class="need-meter-track"
    role="meter"
    aria-labelledby="{id}-label"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(value * 100)}
    aria-valuetext={word}
  >
    <div class="need-meter-fill"></div>
  </div>
</div>
