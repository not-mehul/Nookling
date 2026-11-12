// What the drawing needs to know about the pet, independent of how it got there.

export type Stage = 'seedpod' | 'sprout' | 'nookling' | 'grown';
export type Form = 'lamplighter' | 'gardener' | 'dreamer' | 'scamp';

/** A face. The behaviour engine (src/pet/behaviour.ts) picks one from the pet's state. */
export type Expression = 'content' | 'happy' | 'sleepy' | 'asleep' | 'hungry' | 'sad' | 'unwell' | 'surprised' | 'eating' | 'grumpy' | 'dizzy';

/** One-off movements the pet makes in answer to something (Pet.svelte's `react`). */
export type Reaction = 'hop' | 'squish' | 'wiggle' | 'shiver' | 'nuzzle' | 'spin' | 'somersault' | 'wobble' | 'bounce';

export const FORMS: readonly Form[] = ['lamplighter', 'gardener', 'dreamer', 'scamp'];
export const EXPRESSIONS: readonly Expression[] = ['content', 'happy', 'sleepy', 'asleep', 'hungry', 'sad', 'unwell', 'surprised', 'eating', 'grumpy', 'dizzy'];

/** The fur token for a form. */
export function furToken(stage: Stage, form: Form | null, unwell: boolean): string {
  if (unwell) return '--pet-fur-unwell';
  if (stage !== 'grown' || !form) return '--pet-fur';
  return { lamplighter: '--pet-fur', gardener: '--pet-fur-sage', dreamer: '--pet-fur-cream', scamp: '--pet-fur-rust' }[form];
}
