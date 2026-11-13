<script lang="ts">
  // The Journal: who it is, the moments it grew, its pictures and the care log.
  import { logLine } from '../lib/logLine';
  import VisitorArt from '../world/art/VisitorArt.svelte';
  import { VISITORS } from '../world/visitors';
  import { DAY } from '../domain/pet';
  import { t, type MessageKey } from '../i18n/index.svelte';
  import { datedName, shareFile } from '../platform/output';
  import { petState } from '../state/pet.svelte';
  import { ui } from '../state/ui.svelte';
  import type { LogEntry, Photo } from '../data/db';
  import Sheet from './ui/Sheet.svelte';
  import { worldState } from '../state/world.svelte';
  import TreasureIcon from '../world/art/TreasureIcon.svelte';
  import { MOMENTS } from '../world/moments';
  import { postcardColour } from '../world/siblings';
  import { TREASURES, type Treasure } from '../world/treasures';

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
  let looking = $state<Treasure | null>(null);
  const found = $derived(worldState.world.treasures);
  const foundCount = $derived(TREASURES.filter((tr) => found[tr.id]).length);
  const caught = $derived(MOMENTS.filter((m) => worldState.world.moments[m.id]).sort((a, b) => worldState.world.moments[b.id]! - worldState.world.moments[a.id]!));

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

  const line = (e: LogEntry) => logLine(e, worldState.world);

  async function share(p: Photo) {
    await shareFile({ name: datedName(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'nookling'}`, 'png', new Date(p.at), true), data: new Uint8Array(await p.image.arrayBuffer()), mime: 'image/png' }, name);
  }

  async function remove(p: Photo) {
    open = null;
    await petState.deletePhoto(p.id);
    ui.notify(t('journal.deleted'), 'info');
  }

  /** A YYYY-MM-DD day as local noon, for the date format. */
  function dayTime(day: string): number {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y!, m! - 1, d!, 12).getTime();
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

    <div class="panel" id="journalTreasures">
      <div class="section-head"><h3>{t('journal.treasures')}</h3><span class="t-data">{foundCount} / {TREASURES.length}</span></div>
      {#if foundCount}
        <ul class="treasures">
          {#each TREASURES as tr (tr.id)}
            <li>
              {#if found[tr.id]}
                <button type="button" class="treasure-slot dd-pressable" data-treasure={tr.id} aria-label={tr.name} onclick={() => (looking = tr)}>
                  <TreasureIcon treasure={tr} size={36} />
                  {#if (found[tr.id]?.count ?? 0) > 1}<span class="t-data times">×{found[tr.id]?.count}</span>{/if}
                </button>
              {:else}
                <span class="treasure-slot is-empty" aria-hidden="true"><TreasureIcon treasure={tr} size={36} hidden /></span>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="t-hint">{t('journal.treasuresHint')}</p>
      {:else}
        <p class="t-hint">{t('journal.noTreasures', { name })}</p>
      {/if}
      {#if worldState.world.postcards.length}
        <h4 class="t-section-label postcards-head">{t('journal.postcards')}</h4>
        <ul class="postcards" id="journalPostcards">
          {#each worldState.world.postcards as c (c.id)}
            <li class="postcard" aria-label={t('journal.postcardFrom', { place: [c.city, c.country].filter(Boolean).join(', ') })}>
              <span class="stamp" style:background="var(--pet-food-{postcardColour(c)})" aria-hidden="true"></span>
              <span class="postcard-text">
                <b>{c.city}</b>{#if c.country}<span class="t-hint">{c.country}</span>{/if}
                <span class="t-data">{c.date ? dateFmt(dayTime(c.date)) : dateFmt(c.at)}</span>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="panel" id="journalMoments">
      <div class="section-head"><h3>{t('journal.moments')}</h3><span class="t-data">{caught.length} / {MOMENTS.length}</span></div>
      {#if caught.length}
        <ul class="moments">
          {#each caught as m (m.id)}
            <li><span class="t-data">{dateFmt(worldState.world.moments[m.id]!)}</span> {t(`moment.${m.id}` as MessageKey, { name })}</li>
          {/each}
        </ul>
      {:else}
        <p class="t-hint">{t('journal.noMoments', { name })}</p>
      {/if}
    </div>

    <div class="panel" id="journalVisitors">
      <div class="section-head"><h3>{t('journal.visitors')}</h3><span class="t-data">{VISITORS.filter((v) => worldState.world.visitors[v.id]).length} / {VISITORS.length}</span></div>
      {#if Object.keys(worldState.world.visitors).length}
        <ul class="visitors">
          {#each VISITORS.filter((v) => worldState.world.visitors[v.id]) as v (v.id)}
            <li><VisitorArt id={v.id} size={40} /><span><b>{t(`visitor.${v.id}` as MessageKey)}</b><br /><span class="t-hint">{t('journal.visitorMet', { count: worldState.world.visitors[v.id]!.met })}</span></span></li>
          {/each}
        </ul>
      {:else}
        <p class="t-hint">{t('journal.visitorsEmpty')}</p>
      {/if}
    </div>

    {#if worldState.world.books.length}
      <div class="panel" id="journalBooks">
        <div class="section-head"><h3>{t('journal.books', { name })}</h3></div>
        <ul class="moments">
          {#each worldState.world.books as b (b.title)}
            <li><span class="t-data">{dateFmt(b.at)}</span> <i>{b.title}</i>{#if b.author}, {b.author}{/if}</li>
          {/each}
        </ul>
      </div>
    {/if}

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

{#if looking}
  {@const tr = looking}
  <Sheet title={tr.name} onclose={() => (looking = null)}>
    <div class="treasure-detail">
      <TreasureIcon treasure={tr} size={96} />
      <p class="treasure-note">{tr.note}</p>
      <p class="t-hint">{t(`journal.rarity.${tr.rarity}` as MessageKey)}{tr.season ? ` · ${t(`journal.season.${tr.season}` as MessageKey)}` : ''} · {t('journal.firstFound', { date: dateFmt(found[tr.id]?.first ?? Date.now()) })}</p>
    </div>
  </Sheet>
{/if}

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
  .visitors {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .visitors li {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .postcards-head {
    margin: var(--space-4) 0 var(--space-2);
  }
  .postcards {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
    gap: var(--space-2);
  }
  .postcard {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
  }
  .stamp {
    flex: none;
    width: 0.875rem;
    height: 1.125rem;
    margin-top: 0.2rem;
    border-radius: 2px;
    outline: 2px dotted var(--border-soft);
    outline-offset: 1px;
  }
  .postcard-text {
    display: grid;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .treasures {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .treasure-slot {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    background: var(--panel-bg-faint);
    border: 1px solid var(--border-soft);
    border-radius: var(--corner-md);
    cursor: pointer;
  }
  .treasure-slot.is-empty {
    cursor: default;
    border-style: dashed;
  }
  .times {
    position: absolute;
    right: 3px;
    bottom: 1px;
    font-size: 0.6875rem;
    color: var(--text-muted);
  }
  .moments {
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }
  .moments li {
    display: flex;
    gap: var(--space-3);
    color: var(--text-body);
  }
  .treasure-detail {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    text-align: center;
  }
  .treasure-note {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.125rem;
    color: var(--text-heading);
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
