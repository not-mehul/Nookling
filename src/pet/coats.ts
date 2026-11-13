// The nookling's coat: the colour of its fur. Picked at random when it is
// adopted, changeable in Settings. Every coat is a token, or two tokens mixed,
// so it suits both themes.

export type CoatId =
  | 'caramel'
  | 'cream'
  | 'sage'
  | 'fox'
  | 'peach'
  | 'rose'
  | 'butter'
  | 'mint'
  | 'moss'
  | 'cocoa';

export const COATS: readonly { id: CoatId; colour: string }[] = [
  { id: 'caramel', colour: 'var(--pet-fur)' },
  { id: 'cream', colour: 'var(--pet-fur-cream)' },
  { id: 'sage', colour: 'var(--pet-fur-sage)' },
  { id: 'fox', colour: 'var(--pet-fur-rust)' },
  {
    id: 'peach',
    colour: 'color-mix(in oklab, var(--pet-tongue) 45%, var(--pet-fur-cream))',
  },
  {
    id: 'rose',
    colour:
      'color-mix(in oklab, var(--pet-food-berry) 42%, var(--pet-fur-cream))',
  },
  {
    id: 'butter',
    colour:
      'color-mix(in oklab, var(--pet-food-honey) 60%, var(--pet-fur-cream))',
  },
  {
    id: 'mint',
    colour:
      'color-mix(in oklab, var(--pet-food-leaf) 40%, var(--pet-fur-cream))',
  },
  {
    id: 'moss',
    colour:
      'color-mix(in oklab, var(--pet-food-leaf) 80%, var(--pet-fur-cream))',
  },
  {
    id: 'cocoa',
    colour: 'color-mix(in oklab, var(--pet-fur-shade) 78%, var(--pet-mouth))',
  },
];

export function isCoat(id: unknown): id is CoatId {
  return COATS.some((c) => c.id === id);
}

/** A coat at random (Math.random in the app, fixed in tests). */
export function pickCoat(random: () => number = Math.random): CoatId {
  return COATS[Math.floor(random() * COATS.length)]?.id ?? 'caramel';
}

/** Its coat; a pet from before coats gets one from its id, the same every time. */
export function coatOf(pet: { id: string; coat?: CoatId }): CoatId {
  if (isCoat(pet.coat)) return pet.coat;
  let h = 0;
  for (const ch of pet.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COATS[h % COATS.length]!.id;
}

export function coatColour(id: CoatId): string {
  return COATS.find((c) => c.id === id)?.colour ?? 'var(--pet-fur)';
}
