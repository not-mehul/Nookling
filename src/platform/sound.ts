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

/**
 * A soft ambient bed for Quiet time, made from filtered noise: rain, a
 * breeze, or night (a breeze with the odd cricket). Returns a stop function.
 * Respects the sound setting like everything else.
 */
export function ambient(kind: 'rain' | 'breeze' | 'night'): () => void {
  const ctx = audio();
  if (!ctx) return () => {};
  try {
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brown-ish noise: softer than white.
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = kind === 'rain' ? 1400 : 420;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === 'rain' ? 0.09 : 0.06, ctx.currentTime + 1.5);
    // The breeze rises and falls.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.12;
    depth.gain.value = kind === 'rain' ? 0.01 : 0.03;
    lfo.connect(depth).connect(gain.gain);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    lfo.start();
    const extras = setInterval(() => {
      if (kind === 'rain' && Math.random() < 0.6) tone(ctx, 2400 + Math.random() * 800, 1800, 30, 0, 'sine', 0.012);
      if (kind === 'night' && Math.random() < 0.25) for (let i = 0; i < 3; i++) tone(ctx, 4200, 4300, 40, i * 0.07, 'sine', 0.01);
    }, 400);
    return () => {
      clearInterval(extras);
      const end = ctx.currentTime + 0.8;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      source.stop(end + 0.05);
      lfo.stop(end + 0.05);
    };
  } catch {
    return () => {};
  }
}
