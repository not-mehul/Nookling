// Shorthand for describing pixel art (./raster.ts): the palette as tokens,
// and small builders for layers and shapes.
import type { Layer, Shape, Shading, Xf } from "./raster";

/** The palette. Every colour is a token. */
export const P = {
  fur: "var(--fur, var(--pet-fur))",
  furShade: "var(--pet-fur-shade)",
  cream: "var(--pet-fur-cream)",
  sage: "var(--pet-fur-sage)",
  rust: "var(--pet-fur-rust)",
  unwell: "var(--pet-fur-unwell)",
  berry: "var(--pet-food-berry)",
  leaf: "var(--pet-food-leaf)",
  crust: "var(--pet-food-crust)",
  honey: "var(--pet-food-honey)",
  white: "var(--pet-eye)",
  ink: "var(--pet-pupil)",
  mouth: "var(--pet-mouth)",
  tongue: "var(--pet-tongue)",
  outline: "var(--pet-outline)",
  star: "var(--accent-bright)",
  amber: "var(--accent-amber)",
  sky: "var(--accent-sage)",
  faint: "var(--text-faint)",
  dim: "var(--text-dim)",
  soft: "var(--border-soft)",
} as const;

/** Two tokens mixed: `a` at `pct` percent. */
export function mix(a: string, b: string, pct: number): string {
  return `color-mix(in oklab, ${a} ${pct}%, ${b})`;
}

export interface LayerOpts {
  shade?: Shading;
  edge?: boolean;
  clip?: string;
  name?: string;
  cut?: boolean;
  dither?: boolean;
  over?: boolean;
}

/** A filled layer. */
export function fill(
  colour: string,
  shapes: Shape | readonly Shape[],
  opts: LayerOpts = {},
): Layer {
  return {
    fill: colour,
    shapes: Array.isArray(shapes) ? shapes : [shapes as Shape],
    ...opts,
  };
}

/** A stroked layer: lines `w` wide. */
export function line(
  colour: string,
  w: number,
  d: string | readonly string[],
  opts: LayerOpts & { at?: Xf } = {},
): Layer {
  const { at, ...rest } = opts;
  const list = typeof d === "string" ? [d] : d;
  return { fill: colour, shapes: list.map((s) => ({ s, w, at })), ...rest };
}

export const circle = (cx: number, cy: number, r: number, at?: Xf): Shape => ({
  e: [cx, cy, r, r],
  at,
});
export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
  at?: Xf,
): Shape => ({ e: [cx, cy, rx, ry, rot], at });
export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  at?: Xf,
): Shape => ({ r: [x, y, w, h], at });
export const path = (d: string, at?: Xf): Shape => ({ d, at });

/** Moves every shape in a list of layers. */
export function place(layers: readonly Layer[], at: Xf): Layer[] {
  return layers.map((l) => ({
    ...l,
    shapes: l.shapes.map((s) => ({ ...s, at: compose(at, s.at) })),
  }));
}

/** `outer` after `inner`. `outer` may only move, rotate and scale evenly. */
function compose(outer: Xf, inner?: Xf): Xf {
  if (!inner) return outer;
  const s = outer.s ?? 1;
  const r = ((outer.r ?? 0) * Math.PI) / 180;
  const ix = (inner.x ?? 0) * s;
  const iy = (inner.y ?? 0) * s;
  return {
    ...inner,
    x: (outer.x ?? 0) + ix * Math.cos(r) - iy * Math.sin(r),
    y: (outer.y ?? 0) + ix * Math.sin(r) + iy * Math.cos(r),
    s: s * (inner.s ?? 1),
    r: (outer.r ?? 0) + (inner.r ?? 0),
  };
}
