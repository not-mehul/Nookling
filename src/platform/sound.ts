// The pet's voice: soft chirps synthesised with the Web Audio API, so every
// sound is original to the app and nothing is fetched or bundled. Quiet by
// design (a tenth of full volume) and off when Settings says so.

export type Chirp = 'boop' | 'happy' | 'giggle' | 'chomp' | 'yawn' | 'sad' | 'hatch' | 'purr' | 'pop' | 'splash';

let context: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled || typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** One tone gliding from `from` to `to` Hz, starting `delay` seconds from now. */
function tone(ctx: AudioContext, from: number, to: number, ms: number, delay = 0, type: OscillatorType = 'sine', peak = 0.1): void {
  const start = ctx.currentTime + delay;
  const end = start + ms / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, ms / 4000));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

/** A short soft thud, for chomps. */
function thump(ctx: AudioContext, delay = 0): void {
  tone(ctx, 220, 90, 70, delay, 'triangle', 0.12);
}

export function chirp(kind: Chirp): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    switch (kind) {
      case 'boop':
        return tone(ctx, 660, 990, 90);
      case 'happy':
        tone(ctx, 740, 1110, 90);
        return tone(ctx, 880, 1320, 110, 0.11);
      case 'giggle':
        for (let i = 0; i < 4; i++) tone(ctx, 900 + i * 60, 1200 + i * 60, 60, i * 0.075);
        return;
      case 'chomp':
        return thump(ctx);
      case 'yawn':
        return tone(ctx, 520, 260, 520, 0, 'sine', 0.07);
      case 'sad':
        tone(ctx, 520, 440, 160, 0, 'sine', 0.07);
        return tone(ctx, 440, 330, 220, 0.18, 'sine', 0.07);
      case 'purr':
        for (let i = 0; i < 5; i++) tone(ctx, 140, 120, 70, i * 0.08, 'triangle', 0.05);
        return;
      case 'pop':
        return tone(ctx, 1400, 2000, 45, 0, 'sine', 0.06);
      case 'splash':
        for (let i = 0; i < 3; i++) tone(ctx, 300 - i * 40, 180, 80, i * 0.05, 'triangle', 0.05);
        return;
      case 'hatch':
        [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, f * 1.02, 140, i * 0.1));
        return;
    }
  } catch {
    // Audio is a nicety; never let it break a touch.
  }
}

/** A soft note on a pentatonic scale: for the rhythm game and the bedtime lullaby. */
export function note(step: number, ms = 220): void {
  const ctx = audio();
  if (!ctx) return;
  const scale = [523, 587, 659, 784, 880, 1047, 1175];
  const f = scale[((step % scale.length) + scale.length) % scale.length]!;
  try {
    tone(ctx, f, f, ms, 0, 'sine', 0.08);
  } catch {
    // A nicety.
  }
}
