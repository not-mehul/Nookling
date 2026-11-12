<script lang="ts">
  // The Journal: who it is, the moments it grew, its pictures and the care log.
  import { foodById } from '../domain/foods';
  import { DAY } from '../domain/pet';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { datedName, shareFile } from '../platform/output';
  import { petState } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';
  import type { LogEntry, Photo } from '../data/db';
  import Sheet from './ui/Sheet.svelte';

  const pet = $derived(petState.pet);
  const name = $derived(pet?.name ?? '');
  const dateFmt = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const timeFmt = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  let urls = $state<Record<string, string>>({});
  $effect(() => {
    const made: Record<string, string> = {};
    for (const p of petState.photos) made[p.id] = URL.createObjectURL(p.image);
    urls = made;
    return () => Object.values(made).forEach((u) => URL.revokeObjectURL(u));
  });

  let open = $state<Photo | null>(null);

  function startOfDay(at: number): number {
    const d = new Date(at);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  const days = $derived.by(() => {
    const groups: { day: number; entries: LogEntry[] }[] = [];
    for (const e of petState.log) {
      const day = startOfDay(e.at);
      const last = groups.at(-1);
      if (last?.day === day) last.entries.push(e);
      else groups.push({ day, entries: [e] });
    }
    return groups;
  });

  function dayLabel(day: number): string {
    const today = startOfDay(Date.now());
    if (day === today) return t('journal.today');
    if (day === startOfDay(today - DAY / 2)) return t('journal.yesterday');
    return new Date(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function line(e: LogEntry): string {
    const key = `log.${e.kind}` as MessageKey;
    if (e.kind === 'grew') return t('log.grew', { stage: t(`stage.${e.detail ?? 'nookling'}` as MessageKey) });
    if (e.kind === 'fed') return t('log.fed', { detail: (foodById(e.detail ?? '')?.name ?? e.detail ?? '').toLowerCase() });
    if (e.kind === 'played') return t('log.played', { detail: e.detail === 'catch' || e.detail === 'seek' || e.detail === 'echo' ? t(`game.${e.detail}`).toLowerCase() : '' });
    return t(key, { detail: e.detail ?? '' });
  }

  async function share(p: Photo) {
    await shareFile({ name: datedName(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'nookling'}`, 'png', new Date(p.at), true), data: new Uint8Array(await p.image.arrayBuffer()), mime: 'image/png' }, name);
  }

  async function remove(p: Photo) {
    open = null;
    await petState.deletePhoto(p.id);
    ui.notify(t('journal.deleted'), 'info');
  }
</script>

<div id="viewJournal" role="tabpanel" aria-labelledby="tabJournal">
  <h2 class="visually-hidden">{t('tabs.journal')}</h2>
  {#if pet}
    <div class="panel" id="journalAbout">
      <div class="section-head"><h3>{t('journal.about', { name })}</h3></div>
      <dl class="facts">
        <div>
          <dt class="t-field-label">{t('journal.stage')}</dt>
          <dd>{t(`stage.${pet.stage}` as MessageKey)}{pet.form ? ` · ${t(`form.${pet.form}` as MessageKey)}` : ''}</dd>
        </div>
        <div>
          <dt class="t-field-label">{t('journal.traits')}</dt>
          <dd>{pet.stage === 'seedpod' || !pet.traits.length ? t('journal.noTraits') : pet.traits.map((tr) => t(`trait.${tr}` as MessageKey)).join(', ')}</dd>
        </div>
        <div>
          <dt class="t-field-label">{t('journal.cared')}</dt>
          <dd>{t('journal.caredLine', { foods: pet.care.foods.length, rest: Math.round(pet.care.rest), attention: Math.round(pet.care.attention) })}</dd>
        </div>
      </dl>
      <p class="t-hint">
        {#if pet.hatchedAt}
          {t('journal.age', { count: Math.max(0, Math.floor((Date.now() - pet.hatchedAt) / DAY)) })} · {t('journal.hatchedOn', { date: dateFmt(pet.hatchedAt) })}
        {:else}
          {t('journal.unhatched')}
        {/if}
      </p>
    </div>

    <div class="panel" id="journalMilestones">
      <div class="section-head"><h3>{t('journal.milestones')}</h3></div>
      {#if petState.milestones.length}
        <ol class="milestones">
          {#each petState.milestones as m (m.id)}
            <li><span class="t-data">{dateFmt(m.at)}</span> {line(m)}</li>
          {/each}
        </ol>
      {:else}
        <p class="t-hint">{t('journal.noMilestones')}</p>
      {/if}
    </div>

    <div class="panel" id="journalAlbum">
      <div class="section-head"><h3>{t('journal.album')}</h3></div>
      {#if petState.photos.length}
        <ul class="album">
          {#each petState.photos as p (p.id)}
            <li>
              <button type="button" class="photo dd-pressable" onclick={() => (open = p)} aria-label={t('journal.photo', { date: dateFmt(p.at) })}>
                {#if urls[p.id]}<img src={urls[p.id]} alt="" />{/if}
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="t-hint">{t('journal.noPhotos')}</p>
      {/if}
    </div>

    <div class="panel" id="journalLog">
      <div class="section-head"><h3>{t('journal.log')}</h3></div>
      {#if days.length}
        {#each days as g (g.day)}
          <h4 class="t-field-label day">{dayLabel(g.day)}</h4>
          <ul class="log">
            {#each g.entries as e (e.id)}
              <li data-kind={e.kind}><span class="t-data when">{timeFmt(e.at)}</span><span>{line(e)}</span></li>
            {/each}
          </ul>
        {/each}
      {:else}
        <p class="t-hint">{t('journal.noLog')}</p>
      {/if}
    </div>
  {:else}
    <p class="t-hint">{t('journal.noLog')}</p>
  {/if}
</div>

{#if open}
  {@const p = open}
  <Sheet title={t('journal.photo', { date: dateFmt(p.at) })} onclose={() => (open = null)}>
    {#if urls[p.id]}<img class="big" src={urls[p.id]} alt={t('journal.photo', { date: dateFmt(p.at) })} />{/if}
    <div class="photo-actions">
      <button type="button" class="btn btn-secondary" onclick={() => share(p)}>{t('journal.share')}</button>
      <button type="button" class="btn btn-muted" onclick={() => remove(p)}>{t('journal.delete')}</button>
    </div>
  </Sheet>
{/if}

<style>
  .facts {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .facts dd {
    color: var(--text-body);
  }
  .milestones,
  .log {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .milestones li,
  .log li {
    display: flex;
    gap: var(--space-3);
    color: var(--text-body);
  }
  .when {
    min-width: 4.5em;
    color: var(--text-muted);
  }
  .day {
    margin: var(--space-4) 0 var(--space-2);
  }
  .day:first-of-type {
    margin-top: 0;
  }
  .album {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
  }
  .photo {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    padding: 0;
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-md);
    overflow: hidden;
    background: var(--panel-bg-faint);
    cursor: pointer;
  }
  .photo img,
  .big {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .big {
    border-radius: var(--corner-lg);
    margin-bottom: var(--space-4);
  }
  .photo-actions {
    display: flex;
    gap: var(--space-2);
  }
</style>
