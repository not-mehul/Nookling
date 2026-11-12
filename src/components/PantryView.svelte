<script lang="ts">
  // The Pantry: every food, what it does, and when it unlocks. "Give" takes
  // it to the Nook and feeds it. Nothing to buy and nothing runs out.
  import FoodIcon from './FoodIcon.svelte';
  import GardenPanel from './GardenPanel.svelte';
  import { canHave, pantry, type Food, type FoodKind } from '../domain/foods';
  import { worldState } from '../state/world.svelte';
  import { grownFoods } from '../world/garden';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { petState } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';

  const KINDS: FoodKind[] = ['meal', 'fruit', 'snack', 'treat'];
  const pet = $derived(petState.pet);
  const stage = $derived(pet?.stage ?? 'seedpod');
  const foods = $derived(pantry(grownFoods(worldState.world.garden)));

  function effects(food: Food): string[] {
    const out: string[] = [];
    if (food.fullness >= 0.3) out.push(t('pantry.filling'));
    else if (food.fullness > 0) out.push(t('pantry.light'));
    if (food.mood >= 0.15) out.push(t('pantry.cheering'));
    if (food.health >= 0.05) out.push(t('pantry.healthy'));
    return out;
  }
</script>

<div id="viewPantry" role="tabpanel" aria-labelledby="tabPantry">
  <p class="t-hint intro">{t('pantry.intro')}</p>
  {#if pet && pet.stage !== 'seedpod'}<GardenPanel />{/if}
  {#each KINDS as kind (kind)}
    <section class="panel">
      <div class="section-head"><h2>{t(`pantry.${kind}` as MessageKey)}</h2></div>
      <ul class="foods">
        {#each foods.filter((f) => f.kind === kind) as food (food.id)}
          {@const ok = canHave(food, stage)}
          <li class="food" class:is-locked={!ok}>
            <FoodIcon {food} size={44} />
            <div class="food-text">
              <span class="t-card-title">{food.name}</span>
              <span class="t-hint">{food.note}</span>
              <span class="chip-row">
                {#each effects(food) as e (e)}<span class="chip chip-tag">{e}</span>{/each}
                {#if !ok}<span class="chip chip-tag">{t(`pantry.from.${food.from}` as MessageKey)}</span>{/if}
              </span>
            </div>
            {#if pet && pet.stage !== 'seedpod'}
              <button type="button" class="btn btn-muted" data-give={food.id} disabled={!ok} aria-label={t('tray.give', { food: food.name })} onclick={() => ui.give(food)}>{t('pantry.give')}</button>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .intro {
    margin-bottom: var(--space-4);
  }
  .foods {
    list-style: none;
    display: grid;
    gap: var(--space-4);
  }
  .food {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-4);
    align-items: center;
  }
  .food.is-locked :global(.food) {
    opacity: 0.45;
  }
  .food-text {
    display: grid;
    gap: 2px;
  }
  .chip-row {
    margin-top: var(--space-1);
  }
</style>
