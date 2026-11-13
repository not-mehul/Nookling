// Pixel art from shapes. Every drawing in Nookling is described as layers of
// simple shapes (SVG path data, ellipses, rects, strokes), sampled onto a grid
// of square pixels, then finished the way a pixel artist would by hand: a
// dark selective outline, a shaded side away from the light (which comes from
// the top left), a highlight, and a checkerboard dither between tones.
//
// Colours stay tokens. A shade or highlight is `color-mix()` of the layer's
// own token with another token, so the art follows the theme with no redraw.
// The result is one SVG path per colour, drawn with crisp edges.

/** A transform: scale, then rotate (degrees), then move. */
export interface Xf {
  x?: number;
  y?: number;
  s?: number;
  sx?: number;
  sy?: number;
  r?: number;
}

export type Shape =
  /** A filled path (even-odd). */
  | { d: string; at?: Xf }
  /** A filled ellipse: cx, cy, rx, ry, and a rotation in degrees. */
  | { e: readonly [number, number, number, number, number?]; at?: Xf }
  /** A filled rectangle: x, y, w, h. */
  | { r: readonly [number, number, number, number]; at?: Xf }
  /** A stroked path, `w` wide, with round ends. */
  | { s: string; w: number; at?: Xf };

export type Shading = "ball" | "rim" | "flat";

export interface Layer {
  /** A CSS colour, normally `var(--token)`. */
  fill: string;
  shapes: readonly Shape[];
  /** How it is lit. Filled layers default to 'rim', stroke-only layers to 'flat'. */
  shade?: Shading;
  /** A darker edge where it sits over another layer. Defaults on for filled layers. */
  edge?: boolean;
  /** Only where this earlier layer (by name) is. */
  clip?: string;
  name?: string;
  /** Clears what is under it instead of painting. */
  cut?: boolean;
  /** Only every other pixel, in a checkerboard: for soft blends between bands. */
  dither?: boolean;
  /** Laid over what is beneath (for a translucent colour) instead of replacing it. */
  over?: boolean;
}

export interface Art {
  layers: readonly Layer[];
  /** The colour of the outer outline. Default: each layer's own dark edge tone. 'none' leaves it off. */
  outline?: string;
}

/** The area drawn and the size of one pixel, in the drawing's own units. */
export interface Grid {
  x: number;
  y: number;
  w: number;
  h: number;
  u: number;
}

export interface Run {
  fill: string;
  d: string;
}

const enum Tone {
  Base = 0,
  Shade = 1,
  Light = 2,
  Edge = 3,
  Deep = 4,
  Outline = 5,
}

/** The tones of a colour, mixed from tokens. */
export function tone(fill: string, t: number): string {
  switch (t) {
    case Tone.Shade:
      return `color-mix(in oklab, ${fill} 74%, var(--pet-mouth))`;
    case Tone.Deep:
      return `color-mix(in oklab, ${fill} 56%, var(--pet-mouth))`;
    case Tone.Light:
      return `color-mix(in oklab, ${fill} 58%, var(--pet-eye))`;
    case Tone.Edge:
      return `color-mix(in oklab, ${fill} 38%, var(--pet-pupil))`;
    default:
      return fill;
  }
}

// ── Geometry: everything becomes polygons (to fill) or polylines (to stroke).

type Pt = [number, number];

function xform(at: Xf | undefined): (p: Pt) => Pt {
  if (!at) return (p) => p;
  const sx = (at.sx ?? 1) * (at.s ?? 1);
  const sy = (at.sy ?? 1) * (at.s ?? 1);
  const a = ((at.r ?? 0) * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const tx = at.x ?? 0;
  const ty = at.y ?? 0;
  return ([x, y]) => {
    const px = x * sx;
    const py = y * sy;
    return [px * cos - py * sin + tx, px * sin + py * cos + ty];
  };
}

const TOKEN =
  /[MmLlHhVvQqCcTtSsAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** SVG path data as polylines, curves flattened. Each subpath is one list. */
export function flatten(d: string, steps = 10): Pt[][] {
  const tokens = d.match(TOKEN) ?? [];
  const out: Pt[][] = [];
  let sub: Pt[] = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = 0; // last control point, for S and T
  let cy = 0;
  let prev = "";
  const num = () => Number(tokens[i++]);
  const start = () => {
    if (sub.length > 1) out.push(sub);
    sub = [];
  };
  while (i < tokens.length) {
    const t = tokens[i]!;
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "Z" || cmd === "z") {
        x = sx;
        y = sy;
        if (sub.length) sub.push([x, y]);
        start();
        prev = "Z";
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M": {
        start();
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        sub.push([x, y]);
        cmd = rel ? "l" : "L";
        break;
      }
      case "L":
        x = ox + num();
        y = oy + num();
        sub.push([x, y]);
        break;
      case "H":
        x = (rel ? x : 0) + num();
        sub.push([x, y]);
        break;
      case "V":
        y = (rel ? y : 0) + num();
        sub.push([x, y]);
        break;
      case "Q":
      case "T": {
        let qx: number;
        let qy: number;
        if (cmd.toUpperCase() === "Q") {
          qx = ox + num();
          qy = oy + num();
        } else {
          const smooth = /[QT]/i.test(prev);
          qx = smooth ? 2 * x - cx : x;
          qy = smooth ? 2 * y - cy : y;
        }
        const ex = ox + num();
        const ey = oy + num();
        for (let k = 1; k <= steps; k++) {
          const s = k / steps;
          const m = 1 - s;
          sub.push([
            m * m * x + 2 * m * s * qx + s * s * ex,
            m * m * y + 2 * m * s * qy + s * s * ey,
          ]);
        }
        cx = qx;
        cy = qy;
        x = ex;
        y = ey;
        break;
      }
      case "C":
      case "S": {
        let ax: number;
        let ay: number;
        if (cmd.toUpperCase() === "C") {
          ax = ox + num();
          ay = oy + num();
        } else {
          const smooth = /[CS]/i.test(prev);
          ax = smooth ? 2 * x - cx : x;
          ay = smooth ? 2 * y - cy : y;
        }
        const bx = ox + num();
        const by = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        for (let k = 1; k <= steps; k++) {
          const s = k / steps;
          const m = 1 - s;
          sub.push([
            m * m * m * x +
              3 * m * m * s * ax +
              3 * m * s * s * bx +
              s * s * s * ex,
            m * m * m * y +
              3 * m * m * s * ay +
              3 * m * s * s * by +
              s * s * s * ey,
          ]);
        }
        cx = bx;
        cy = by;
        x = ex;
        y = ey;
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = num();
        const sweep = num();
        const ex = ox + num();
        const ey = oy + num();
        sub.push(...arc(x, y, rx, ry, rot, large, sweep, ex, ey, steps * 2));
        x = ex;
        y = ey;
        break;
      }
      default:
        i++; // An unknown token: skip it rather than loop.
    }
    prev = cmd;
  }
  start();
  return out;
}

/** An SVG elliptical arc as points (the endpoint parameterisation, SVG spec F.6). */
function arc(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotDeg: number,
  large: number,
  sweep: number,
  x2: number,
  y2: number,
  steps: number,
): Pt[] {
  if (!rx || !ry) return [[x2, y2]];
  const phi = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const pts: Pt[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = t1 + (dt * k) / steps;
    const px = rx * Math.cos(t);
    const py = ry * Math.sin(t);
    pts.push([cos * px - sin * py + cx, sin * px + cos * py + cy]);
  }
  return pts;
}

function ellipsePoly(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotDeg = 0,
): Pt[] {
  const n = 40;
  const a = (rotDeg * Math.PI) / 180;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = (k / n) * 2 * Math.PI;
    const px = rx * Math.cos(t);
    const py = ry * Math.sin(t);
    pts.push([
      cx + px * Math.cos(a) - py * Math.sin(a),
      cy + px * Math.sin(a) + py * Math.cos(a),
    ]);
  }
  return pts;
}

// ── Sampling onto the grid.

interface Mask {
  bits: Uint8Array;
  any: boolean;
}

function fillPolys(
  polys: Pt[][],
  g: Grid,
  cols: number,
  rows: number,
  bits: Uint8Array,
): void {
  // Even-odd scanline fill, sampled at each pixel's centre.
  const edges: [number, number, number, number][] = [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const poly of polys) {
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k]!;
      const b = poly[(k + 1) % poly.length]!;
      if (a[1] === b[1]) continue;
      edges.push([a[0], a[1], b[0], b[1]]);
      minY = Math.min(minY, a[1], b[1]);
      maxY = Math.max(maxY, a[1], b[1]);
    }
  }
  if (!edges.length) return;
  const j0 = Math.max(0, Math.floor((minY - g.y) / g.u - 0.5));
  const j1 = Math.min(rows - 1, Math.ceil((maxY - g.y) / g.u));
  const xs: number[] = [];
  for (let j = j0; j <= j1; j++) {
    const y = g.y + (j + 0.5) * g.u;
    xs.length = 0;
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y))
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k]! - g.x) / g.u - 0.5));
      const i1 = Math.min(cols - 1, Math.floor((xs[k + 1]! - g.x) / g.u - 0.5));
      for (let i = i0; i <= i1; i++) bits[j * cols + i] = 1;
    }
  }
}

function strokeLines(
  lines: Pt[][],
  w: number,
  g: Grid,
  cols: number,
  rows: number,
  bits: Uint8Array,
): void {
  const r = w / 2;
  const r2 = r * r;
  for (const line of lines) {
    const segs =
      line.length === 1
        ? [[line[0]!, line[0]!]]
        : line.slice(1).map((b, k) => [line[k]!, b]);
    for (const [a, b] of segs) {
      const [ax, ay] = a!;
      const [bx, by] = b!;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - r - g.x) / g.u));
      const i1 = Math.min(
        cols - 1,
        Math.ceil((Math.max(ax, bx) + r - g.x) / g.u),
      );
      const j0 = Math.max(0, Math.floor((Math.min(ay, by) - r - g.y) / g.u));
      const j1 = Math.min(
        rows - 1,
        Math.ceil((Math.max(ay, by) + r - g.y) / g.u),
      );
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      for (let j = j0; j <= j1; j++) {
        const py = g.y + (j + 0.5) * g.u;
        for (let i = i0; i <= i1; i++) {
          const px = g.x + (i + 0.5) * g.u;
          const t = Math.max(
            0,
            Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2),
          );
          const ex = ax + t * dx - px;
          const ey = ay + t * dy - py;
          if (ex * ex + ey * ey <= r2) bits[j * cols + i] = 1;
        }
      }
    }
  }
}

function sample(
  shapes: readonly Shape[],
  g: Grid,
  cols: number,
  rows: number,
): Mask {
  const bits = new Uint8Array(cols * rows);
  for (const shape of shapes) {
    const f = xform(shape.at);
    if ("d" in shape) {
      const one = new Uint8Array(cols * rows);
      fillPolys(
        flatten(shape.d).map((p) => p.map(f)),
        g,
        cols,
        rows,
        one,
      );
      for (let k = 0; k < one.length; k++) if (one[k]) bits[k] = 1;
    } else if ("e" in shape) {
      const [cx, cy, rx, ry, rot] = shape.e;
      fillPolys([ellipsePoly(cx, cy, rx, ry, rot).map(f)], g, cols, rows, bits);
    } else if ("r" in shape) {
      const [x, y, w, h] = shape.r;
      const poly: Pt[] = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ];
      fillPolys([poly.map(f)], g, cols, rows, bits);
    } else {
      const scale = shape.at
        ? (shape.at.s ?? 1) *
          Math.sqrt(Math.abs((shape.at.sx ?? 1) * (shape.at.sy ?? 1)))
        : 1;
      strokeLines(
        flatten(shape.s).map((p) => p.map(f)),
        shape.w * scale,
        g,
        cols,
        rows,
        bits,
      );
    }
  }
  return { bits, any: bits.some((b) => b) };
}

// ── Painting.

const cache = new Map<string, Run[]>();

/** The art as one path per colour, cached by its description. */
export function render(art: Art, g: Grid): Run[] {
  const key = JSON.stringify([art, g]);
  const hit = cache.get(key);
  if (hit) return hit;
  const runs = paint(art, g);
  if (cache.size > 400) cache.delete(cache.keys().next().value!);
  cache.set(key, runs);
  return runs;
}

function paint(art: Art, g: Grid): Run[] {
  const cols = Math.round(g.w / g.u);
  const rows = Math.round(g.h / g.u);
  const n = cols * rows;
  const layers = art.layers;
  const masks: Mask[] = [];
  const named = new Map<string, Mask>();
  // Which layer is on top at each pixel (-1: nothing).
  const top = new Int16Array(n).fill(-1);
  layers.forEach((layer, li) => {
    const mask = sample(layer.shapes, g, cols, rows);
    if (layer.clip) {
      const clip = named.get(layer.clip);
      for (let k = 0; k < n; k++) if (!clip?.bits[k]) mask.bits[k] = 0;
    }
    if (layer.dither)
      for (let k = 0; k < n; k++)
        if ((k % cols) % 2 !== Math.floor(k / cols) % 2) mask.bits[k] = 0;
    masks.push(mask);
    if (layer.name) named.set(layer.name, mask);
    if (!mask.any || layer.over) return;
    for (let k = 0; k < n; k++) if (mask.bits[k]) top[k] = layer.cut ? -1 : li;
  });

  const tones = new Uint8Array(n);
  const at = (i: number, j: number) =>
    i < 0 || j < 0 || i >= cols || j >= rows ? -1 : top[j * cols + i]!;
  const own = (m: Mask, i: number, j: number) =>
    i >= 0 && j >= 0 && i < cols && j < rows && m.bits[j * cols + i] === 1;

  // Light and shade, per layer.
  const boxes = layers.map((_, li) => {
    let x0 = cols;
    let x1 = -1;
    let y0 = rows;
    let y1 = -1;
    const bits = masks[li]!.bits;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        if (bits[j * cols + i]) {
          x0 = Math.min(x0, i);
          x1 = Math.max(x1, i);
          y0 = Math.min(y0, j);
          y1 = Math.max(y1, j);
        }
    return {
      cx: (x0 + x1 + 1) / 2,
      cy: (y0 + y1 + 1) / 2,
      rx: Math.max(1, (x1 - x0 + 1) / 2),
      ry: Math.max(1, (y1 - y0 + 1) / 2),
    };
  });
  const isStroke = (l: Layer) => l.shapes.every((s) => "s" in s);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const li = top[k]!;
      if (li < 0) continue;
      const layer = layers[li]!;
      const mask = masks[li]!;
      const dither = (i + j) % 2 === 0;
      const shading = layer.shade ?? (isStroke(layer) ? "flat" : "rim");
      let t: Tone = Tone.Base;
      if (shading === "ball") {
        const b =
          boxes[
            layer.clip ? layers.findIndex((l) => l.name === layer.clip) : li
          ] ?? boxes[li]!;
        const nx = (i + 0.5 - b.cx) / b.rx;
        const ny = (j + 0.5 - b.cy) / b.ry;
        // A sphere lit from the top left, a little in front.
        const r2 = Math.min(1, nx * nx + ny * ny);
        const nz = Math.sqrt(1 - r2);
        const lit = -0.42 * nx - 0.56 * ny + 0.71 * nz;
        if (lit < 0.06) t = Tone.Deep;
        else if (lit < 0.14) t = dither ? Tone.Deep : Tone.Shade;
        else if (lit < 0.34) t = Tone.Shade;
        else if (lit < 0.44) t = dither ? Tone.Shade : Tone.Base;
        else if (lit > 0.975) t = Tone.Light;
        else if (
          lit > 0.5 &&
          (!own(mask, i - 2, j - 1) || !own(mask, i - 1, j - 2))
        )
          t = Tone.Light;
        else if (lit > 0.955 && dither) t = Tone.Light;
      } else if (shading === "rim") {
        if (!own(mask, i + 1, j + 1) || !own(mask, i, j + 1)) t = Tone.Shade;
        else if (!own(mask, i + 2, j + 2) && dither) t = Tone.Shade;
        // The light sits just inside the outline on the top and left.
        else if (
          !own(mask, i, j - 2) ||
          !own(mask, i - 2, j) ||
          !own(mask, i - 1, j - 1)
        )
          t = Tone.Light;
      }
      // The outline: against empty space, and where it sits over an earlier layer.
      const edge = layer.edge ?? !isStroke(layer);
      const n4 = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)];
      if (art.outline !== "none" && n4.some((v) => v < 0)) t = Tone.Outline;
      else if (edge && n4.some((v) => v >= 0 && v < li && !layers[v]!.cut))
        t = Tone.Edge;
      tones[k] = t;
    }
  }

  // One path per colour: horizontal runs.
  const paths = new Map<string, string[]>();
  const fmt = (v: number) => String(Math.round(v * 100) / 100);
  const colourOf = (li: number, t: number) =>
    t === Tone.Outline
      ? (art.outline ?? tone(layers[li]!.fill, Tone.Edge))
      : tone(layers[li]!.fill, t);
  for (let j = 0; j < rows; j++) {
    let i = 0;
    while (i < cols) {
      const k = j * cols + i;
      const li = top[k]!;
      if (li < 0) {
        i++;
        continue;
      }
      const t = tones[k]!;
      let e = i + 1;
      while (e < cols && top[j * cols + e] === li && tones[j * cols + e] === t)
        e++;
      const colour = colourOf(li, t);
      const list = paths.get(colour) ?? [];
      list.push(
        `M${fmt(g.x + i * g.u)} ${fmt(g.y + j * g.u)}h${fmt((e - i) * g.u)}v${fmt(g.u)}h${fmt(-(e - i) * g.u)}z`,
      );
      paths.set(colour, list);
      i = e;
    }
  }
  // Overlays, in order, on top of everything.
  const overlays: Run[] = [];
  layers.forEach((layer, li) => {
    if (!layer.over) return;
    const bits = masks[li]!.bits;
    const d: string[] = [];
    for (let j = 0; j < rows; j++) {
      let i = 0;
      while (i < cols) {
        if (!bits[j * cols + i]) {
          i++;
          continue;
        }
        let e = i + 1;
        while (e < cols && bits[j * cols + e]) e++;
        d.push(
          `M${fmt(g.x + i * g.u)} ${fmt(g.y + j * g.u)}h${fmt((e - i) * g.u)}v${fmt(g.u)}h${fmt(-(e - i) * g.u)}z`,
        );
        i = e;
      }
    }
    if (d.length) overlays.push({ fill: layer.fill, d: d.join("") });
  });
  return [
    ...[...paths].map(([fill, d]) => ({ fill, d: d.join("") })),
    ...overlays,
  ];
}
