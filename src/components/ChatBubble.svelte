<script lang="ts">
  // A question in a picture bubble, and three replies to pick from.
  import FoodIcon from './FoodIcon.svelte';
  import { foodById } from '../domain/foods';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import TreasureIcon from '../world/art/TreasureIcon.svelte';
  import { REPLIES, type Question } from '../world/chat';
  import { treasureById } from '../world/treasures';

  let { question, name, onreply }: { question: Question; name: string; onreply: (reply: number) => void } = $props();
  const treasure = $derived('treasure' in question.picture ? treasureById(question.picture.treasure) : undefined);
  const food = $derived('food' in question.picture ? foodById(question.picture.food) : undefined);
</script>

<div class="chat" id="chatBubble" role="group" aria-label={t('chat.label', { name })}>
  <p class="bubble">
    <span class="picture" aria-hidden="true">
      {#if treasure}<TreasureIcon {treasure} size={40} />{:else if food}<FoodIcon {food} size={40} />{/if}
    </span>
    <span>{t(`chat.${question.id}.ask` as MessageKey, { name })}</span>
  </p>
  <div class="replies">
    {#each Array.from({ length: REPLIES }, (_, i) => i) as r (r)}
      <button type="button" class="btn btn-muted reply" data-reply={r} onclick={() => onreply(r)}>{t(`chat.${question.id}.${r}` as MessageKey)}</button>
    {/each}
  </div>
</div>

<style>
  .chat {
    width: 100%;
    max-width: 360px;
    display: grid;
    gap: var(--space-2);
  }
  .bubble {
    position: relative;
    display: flex;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3);
    border-radius: var(--corner-lg);
    background: var(--panel-bg);
    border: 1px solid var(--border-soft);
    color: var(--text-heading);
    font-family: var(--font-serif);
    font-style: italic;
  }
  .bubble::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    width: 14px;
    height: 14px;
    translate: -50% 0;
    rotate: 45deg;
    background: var(--panel-bg);
    border-left: 1px solid var(--border-soft);
    border-top: 1px solid var(--border-soft);
  }
  .picture {
    flex: none;
  }
  .replies {
    display: grid;
    gap: var(--space-2);
  }
  .reply {
    width: 100%;
    justify-content: center;
  }
</style>
