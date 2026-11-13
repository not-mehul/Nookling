// The nookling's shapes, as SVG path data. Pure functions, so the app, the
// character sheet and the tests all draw the same creature.
//
// The pet is drawn on a 240 × 240 box centred on 0,0: its body is a circle
// of fluff about 150 across, resting on y = 84.

/**
 * A circle of fluff: `bumps` rounded tufts around radius `r`, each reaching
 * about `depth` beyond it. With `ruffle` above 0 the tufts vary in depth and
 * lean a little, the same way every time, so the edge reads as fur rather
 * than a cookie cutter.
 */
export function fluffPath(
  r: number,
  bumps: number,
  depth: number,
  ruffle = 0,
  rotate = -Math.PI / 2,
  cx = 0,
  cy = 0,
): string {
  const at = (angle: number, radius: number) =>
    `${round(cx + radius * Math.cos(angle))} ${round(cy + radius * Math.sin(angle))}`;
  const step = (2 * Math.PI) / bumps;
  let d = `M${at(rotate, r)}`;
  for (let i = 0; i < bumps; i++) {
    const a = rotate + i * step;
    const jitter = ruffle ? noise(i) : 0;
    const reach = depth * (1 + ruffle * jitter);
    const lean = step * 0.5 + step * 0.18 * ruffle * noise(i + 31);
    // A quadratic peaks halfway to its control point, so the control sits at twice the depth.
    d += `Q${at(a + lean, r + 2 * reach)} ${at(a + step, r)}`;
  }
  return `${d}Z`;
}

/** A fixed pseudo-random number in -1..1 for an index. */
function noise(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** An ellipse as a path, for clip paths and even-odd cut-outs. */
export function ellipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  return `M${round(cx - rx)} ${round(cy)}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
}

/** A five-pointed star, for the Dreamer's companion. */
export function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner = outer * 0.48,
): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`;
  }
  return `${d}Z`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** The body. */
export const BODY = { r: 71, bumps: 19, depth: 5.2, ruffle: 0.45 } as const;
/** Where each eye sits, its size, and how far the pupil may travel. */
export const EYE = {
  x: 29,
  y: -10,
  rx: 25,
  ry: 31,
  pupil: 15.5,
  reach: 7,
} as const;
