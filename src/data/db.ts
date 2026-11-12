// The pet, its care log and its photo album, in IndexedDB (the WebView's on
// Android). Food, traits and rates live in code (src/domain), not here.

import Dexie, { type EntityTable } from 'dexie';
import type { Pet } from '../domain/pet';

/** One line of the care log (the Journal). */
export interface LogEntry {
  id: string;
  petId: string;
  at: number;
  /** A PetEventKind, or a care action: fed, played, cleaned, cuddled, medicine, lights-off, lights-on, named, away, photo. */
  kind: string;
  /** The food's id, the game's name, the new stage. */
  detail?: string;
}

export interface Photo {
  id: string;
  petId: string;
  at: number;
  image: Blob;
}

export class NooklingDb extends Dexie {
  pets!: EntityTable<Pet, 'id'>;
  log!: EntityTable<LogEntry, 'id'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor(name = 'nookling') {
    super(name);
    // The schema allows several pets; the app shows one.
    this.version(1).stores({
      pets: 'id',
      log: 'id, petId, at',
      photos: 'id, petId, at',
    });
  }
}

export const db = new NooklingDb();
