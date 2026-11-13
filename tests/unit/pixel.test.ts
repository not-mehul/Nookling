import { describe, expect, it } from "vitest";
import { flatten, render, type Art, type Grid } from "../../src/pixel/raster";
import { P, circle, fill, rect } from "../../src/pixel/kit";
import { GRID, bodyArt, faceArt } from "../../src/pet/sprite";
import { clothesArt } from "../../src/pet/clothes";
import { EXPRESSIONS, FORMS } from "../../src/pet/types";
import { CLOTHES } from "../../src/world/wardrobe";
import { FOODS, GARDEN_FOODS } from "../../src/domain/foods";
import { TREASURES } from "../../src/world/treasures";
import { foodArt, treasureArt } from "../../src/world/art/icons-art";
import { DECOR } from "../../src/world/decor";
import { SEEDS } from "../../src/world/garden";
import { VISITORS } from "../../src/world/visitors";
import { decorArt, plantArt, visitorArt } from "../../src/world/art/scene-art";
import { MOMENTS } from "../../src/world/moments";
import { momentArt } from "../../src/world/art/moments-art";
import { windowArt } from "../../src/world/art/window-art";
import { WINDOW_GRID } from "../../src/world/art/window-art";

const G: Grid = { x: 0, y: 0, w: 10, h: 10, u: 1 };

/** The pixels a run list covers, as "x,y" keys per colour. */
function pixels(art: Art, g = G): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const run of render(art, g)) {
    const set = new Set<string>();
    for (const m of run.d.matchAll(/M([-\d.]+) ([-\d.]+)h([-\d.]+)/g)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      for (let i = 0; i < Number(m[3]) / g.u; i++)
        set.add(`${x + i * g.u},${y}`);
    }
    out.set(run.fill, set);
  }
  return out;
}
const count = (m: Map<string, Set<string>>) =>
  [...m.values()].reduce((n, s) => n + s.size, 0);

describe("raster", () => {
  it("flattens lines, curves and arcs", () => {
    expect(flatten("M0 0L10 0V10H0Z")[0]).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
    const curve = flatten("M0 0Q5 10 10 0", 4)[0]!;
    expect(curve.at(-1)).toEqual([10, 0]);
    expect(Math.max(...curve.map((p) => p[1]))).toBeCloseTo(5, 5);
    const arc = flatten("M0 0A5 5 0 0 1 10 0")[0]!;
    expect(arc.at(-1)![0]).toBeCloseTo(10, 5);
    expect(Math.min(...arc.map((p) => p[1]))).toBeCloseTo(-5, 1);
  });

  it("samples a shape at pixel centres", () => {
    const px = pixels({
      layers: [fill(P.berry, rect(2, 2, 4, 3), { shade: "flat", edge: false })],
      outline: "none",
    });
    expect(count(px)).toBe(12);
    expect(px.get(P.berry)!.has("2,2")).toBe(true);
    expect(px.get(P.berry)!.has("6,2")).toBe(false);
  });

  it("outlines the edge, shades the far side and lights the near one", () => {
    const px = pixels({ layers: [fill(P.berry, rect(1, 1, 8, 8))] });
    const keys = [...px.keys()];
    expect(keys.some((k) => k.includes("--pet-pupil"))).toBe(true); // the dark edge
    expect(keys.some((k) => k.includes("--pet-mouth"))).toBe(true); // shade
    expect(keys.some((k) => k.includes("--pet-eye"))).toBe(true); // light
    expect(count(px)).toBe(64);
  });

  it("clips, cuts, dithers and lays over", () => {
    const base = fill(P.leaf, rect(0, 0, 10, 10), {
      name: "base",
      shade: "flat",
      edge: false,
    });
    const clipped = pixels({
      outline: "none",
      layers: [
        fill(P.leaf, rect(0, 0, 4, 4), { name: "a", shade: "flat" }),
        fill(P.berry, rect(2, 2, 6, 6), {
          clip: "a",
          shade: "flat",
          edge: false,
        }),
      ],
    });
    expect(clipped.get(P.berry)!.size).toBe(4);
    const cut = pixels({
      outline: "none",
      layers: [base, fill(P.leaf, rect(0, 0, 5, 10), { cut: true })],
    });
    expect(count(cut)).toBe(50);
    const dither = pixels({
      outline: "none",
      layers: [
        fill(P.berry, rect(0, 0, 10, 10), {
          dither: true,
          shade: "flat",
          edge: false,
        }),
      ],
    });
    expect(count(dither)).toBe(50);
    const over = render(
      {
        outline: "none",
        layers: [
          base,
          fill("rgba(var(--pet-glow-rgb), 0.3)", circle(5, 5, 3), {
            over: true,
          }),
        ],
      },
      G,
    );
    expect(over.at(-1)!.fill).toContain("glow");
    expect(over[0]!.fill).toBe(P.leaf);
  });

  it("only ever paints with tokens", () => {
    const fills = render(bodyArt("grown", "gardener", 1), GRID).map(
      (r) => r.fill,
    );
    for (const f of fills)
      expect(f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/i);
  });
});

describe("pixel art", () => {
  it("draws every face, and moves the pupils in whole pixels", () => {
    for (const expression of EXPRESSIONS)
      expect(
        render(
          faceArt({
            expression,
            look: { x: 0, y: 0 },
            blinking: false,
            chomp: false,
          }),
          GRID,
        ).length,
      ).toBeGreaterThan(0);
    const a = render(
      faceArt({
        expression: "content",
        look: { x: 0.1, y: 0 },
        blinking: false,
        chomp: false,
      }),
      GRID,
    );
    const b = render(
      faceArt({
        expression: "content",
        look: { x: 0, y: 0 },
        blinking: false,
        chomp: false,
      }),
      GRID,
    );
    expect(a).toEqual(b);
    const c = render(
      faceArt({
        expression: "content",
        look: { x: 1, y: 0 },
        blinking: false,
        chomp: false,
      }),
      GRID,
    );
    expect(c).not.toEqual(b);
  });

  it("closes the eyes for a blink", () => {
    const open = render(
      faceArt({
        expression: "content",
        look: { x: 0, y: 0 },
        blinking: false,
        chomp: false,
      }),
      GRID,
    );
    const shut = render(
      faceArt({
        expression: "content",
        look: { x: 0, y: 0 },
        blinking: true,
        chomp: false,
      }),
      GRID,
    );
    expect(shut.some((r) => r.fill === P.white)).toBe(false);
    expect(open.some((r) => r.fill === P.white)).toBe(true);
  });

  it("has a picture for every stage, form, outfit, food, treasure, decor, plant, visitor, moment and window", () => {
    const drawn = (art: Art, g: Grid = GRID) => render(art, g).length > 0;
    for (const stage of ["seedpod", "sprout", "nookling"] as const)
      expect(drawn(bodyArt(stage, null, 0))).toBe(true);
    for (const form of FORMS)
      expect(drawn(bodyArt("grown", form, 0))).toBe(true);
    for (const c of CLOTHES)
      expect(drawn(clothesArt({ [c.slot]: c.id }))).toBe(true);
    for (const m of MOMENTS) expect(drawn(momentArt(m.prop))).toBe(true);
    const icon = (half: number, px: number): Grid => ({
      x: -half,
      y: -half,
      w: half * 2,
      h: half * 2,
      u: (half * 2) / px,
    });
    for (const f of [...FOODS, ...GARDEN_FOODS])
      expect(drawn(foodArt(f), icon(24, 24))).toBe(true);
    for (const t of TREASURES)
      expect(drawn(treasureArt(t), icon(20, 20))).toBe(true);
    for (const d of DECOR)
      expect(drawn(decorArt(d.id), icon(50, 40))).toBe(true);
    for (const s of SEEDS)
      for (const g of ["seed", "sprout", "bud", "ripe"] as const)
        expect(
          drawn(plantArt(s.id, g), { x: -30, y: -40, w: 60, h: 70, u: 2 }),
        ).toBe(true);
    for (const v of VISITORS)
      expect(drawn(visitorArt(v.id), icon(40, 32))).toBe(true);
    for (const sky of ["dawn", "day", "dusk", "night"] as const)
      expect(drawn(windowArt(sky, "winter", "snow"), WINDOW_GRID)).toBe(true);
  });

  it("draws a found-nothing-yet treasure as a plain silhouette", () => {
    const fills = new Set(
      render(treasureArt(TREASURES[0]!, true), {
        x: -20,
        y: -20,
        w: 40,
        h: 40,
        u: 2,
      }).map((r) => r.fill),
    );
    expect([...fills].every((f) => f.includes("--border-soft"))).toBe(true);
  });
});
