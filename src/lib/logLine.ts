// One line for a care-log entry, as the Journal and the Nook's "Today" show it.

import { GAMES, type Game } from '../domain/games';
import { foodById } from '../domain/foods';
import { t, type MessageKey } from '../i18n/index.svelte';
import type { LogEntry } from '../data/db';
import type { World } from '../world/world';

export function logLine(e: LogEntry, world: World): string {
  if (e.kind === 'grew') return t('log.grew', { stage: t(`stage.${e.detail ?? 'nookling'}` as MessageKey) });
  if (e.kind === 'fed') return t('log.fed', { detail: (foodById(e.detail ?? '')?.name ?? world.dishes.find((d) => d.id === e.detail)?.name ?? e.detail ?? '').toLowerCase() });
  if (e.kind === 'played') return t('log.played', { detail: e.detail && (GAMES as readonly string[]).includes(e.detail) ? t(`game.${e.detail as Game}`).toLowerCase() : '' });
  return t(`log.${e.kind}` as MessageKey, { detail: e.detail ?? '' });
}
