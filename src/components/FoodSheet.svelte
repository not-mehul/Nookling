<script lang="ts">
  // Choosing what to feed: every food, the ones too grown-up for it greyed
  // out with the reason beside them.
  import Sheet from './ui/Sheet.svelte';
  import FoodIcon from './FoodIcon.svelte';
  import { FOODS, canHave, type Food } from '../domain/foods';
  import type { Stage } from '../pet/types';

  let { title, stage, tooSmall, onpick, onclose }: { title: string; stage: Stage; tooSmall: string; onpick: (food: Food) => void; onclose: () => void } = $props();
</script>

<Sheet {title} {onclose}>
  <ul class="foods">
    {#each FOODS as food (food.id)}
      {@const ok = canHave(food, stage)}
      <li>
        <button type="button" class="food-row dd-pressable" data-food={food.id} disabled={!ok} onclick={() => onpick(food)}>
          <FoodIcon {food} />
          <span class="food-text">
            <span class="t-card-title">{food.name}</span>
            <span class="t-hint">{ok ? food.note : tooSmall}</span>
          </span>
        </button>
      </li>
    {/each}
  </ul>
</Sheet>

<style>
  .foods {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .food-row {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-4);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    min-height: 64px;
    text-align: left;
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-lg);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .food-row:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .food-text {
    display: grid;
    gap: 2px;
  }
</style>
