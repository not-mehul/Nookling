// The nookling as pixel art: the layers Pet.svelte paints (src/pixel). Pure
// functions of the pet's state, so the app, the character sheet and the
// tests all draw the same creature.
//
// The sprite sits on the pet's 240 × 240 box, centred on 0,0, at 2.5 units
// a pixel: 96 pixels across, the body about 60 of them.

import { BODY, EYE, fluffPath, starPath } from "./geometry";
import type { Expression, Form, Prop, Stage } from "./types";
import { P, circle, ellipse, fill, line, mix, path, rect } from "../pixel/kit";
import type { Art, Grid, Layer } from "../pixel/raster";

export const GRID: Grid = { x: -120, y: -120, w: 240, h: 240, u: 2.5 };

const BODY_PATH = fluffPath(BODY.r, BODY.bumps, BODY.depth, BODY.ruffle);
const SPECKS = [
  [-38, 30, 3.2],
  [44, 40, 2.6],
  [-20, 54, 2.2],
  [52, 8, 2.4],
  [-56, -14, 2.8],
  [16, 58, 3],
  [-48, 46, 2],
  [30, -50, 2.2],
] as const;

/** The body: fluff, feet, belly, tufts, dust. */
export function bodyArt(stage: Stage, form: Form | null, grubby: number): Art {
  const fur = P.fur;
  if (stage === "seedpod") {
    return {
      layers: [
        fill(
          P.furShade,
          path(
            "M0 -46C34 -46 52 -6 52 26C52 62 30 84 0 84C-30 84 -52 62 -52 26C-52 -6 -34 -46 0 -46Z",
          ),
          { shade: "ball", name: "pod" },
        ),
        fill(
          mix(P.furShade, P.white, 78),
          path(
            "M-50 18L-38 10L-28 20L-16 9L-4 19L8 8L20 19L32 9L42 18L51 12L52 26C52 62 30 84 0 84C-30 84 -52 62 -52 26Z",
          ),
          { shade: "ball", clip: "pod" },
        ),
        line(
          mix(P.furShade, P.ink, 45),
          3,
          "M-50 18L-38 10L-28 20L-16 9L-4 19L8 8L20 19L32 9L42 18L51 12",
          { clip: "pod" },
        ),
        line(mix(P.furShade, P.ink, 55), 3, "M0 -46Q-4 -56 4 -62"),
        fill(P.leaf, path("M4 -60Q16 -72 26 -62Q16 -52 4 -60Z")),
        fill(
          "rgba(var(--pet-glow-rgb), 0.95)",
          [circle(-14, 46, 6), circle(14, 46, 6)],
          { shade: "flat", edge: false },
        ),
        fill(P.white, [rect(-17, 42, 2.6, 2.6), rect(11, 42, 2.6, 2.6)], {
          shade: "flat",
          edge: false,
        }),
      ],
    };
  }
  const layers: Layer[] = [];
  // Feet, behind the body.
  layers.push(fill(fur, [ellipse(-30, 80, 17, 9), ellipse(30, 80, 17, 9)]));
  if (stage === "grown" && form === "scamp") {
    layers.push(
      fill(
        fur,
        path(
          "M-16 -64Q-20 -84 -6 -92Q-10 -80 -2 -72Q2 -90 18 -94Q8 -84 12 -68Z",
        ),
      ),
    );
  }
  if (stage === "grown" && form === "gardener") {
    layers.push(line(mix(P.leaf, P.ink, 70), 4, "M0 -66Q-3 -88 3 -98"));
    layers.push(
      fill(P.leaf, [
        path("M3 -96Q18 -110 30 -96Q16 -84 3 -96Z"),
        path("M1 -86Q-14 -98 -24 -86Q-10 -76 1 -86Z"),
      ]),
    );
    layers.push(
      line(mix(P.leaf, P.white, 60), 2, [
        "M8 -96Q16 -98 22 -96",
        "M-4 -87Q-10 -89 -16 -87",
      ]),
    );
  }
  if (stage === "grown" && form === "lamplighter") {
    // A little antenna with a light on it.
    layers.push(line(mix(P.fur, P.ink, 50), 3.5, "M0 -70Q2 -84 -4 -94"));
  }
  layers.push(fill(fur, path(BODY_PATH), { shade: "ball", name: "body" }));
  // A paler belly and muzzle.
  layers.push(
    fill(mix(fur, P.white, 72), [ellipse(0, 46, 40, 30)], {
      clip: "body",
      shade: "ball",
      edge: false,
    }),
  );
  // Tufts: short strokes of the shade tone, so the fluff reads as fluff.
  layers.push(
    line(
      mix(fur, P.mouth, 74),
      2.5,
      [
        "M-44 -46q6 -8 14 -9",
        "M-30 -58q7 -6 15 -5",
        "M40 -48q-6 -8 -14 -9",
        "M-58 4q-3 8 0 16",
        "M58 4q3 8 0 16",
        "M-24 72q4 -4 9 -4",
        "M24 72q-4 -4 -9 -4",
      ],
      { clip: "body" },
    ),
  );
  layers.push(
    line(
      mix(fur, P.white, 50),
      2.5,
      ["M-50 -30q4 -8 10 -12", "M-22 -62q6 -3 12 -3"],
      { clip: "body" },
    ),
  );
  const specks = SPECKS.slice(
    0,
    Math.round(Math.min(1, Math.max(0, grubby)) * SPECKS.length),
  );
  if (specks.length)
    layers.push(
      fill(
        P.furShade,
        specks.map(([x, y, r]) => circle(x, y, r + 0.6)),
        { clip: "body", shade: "flat", edge: false },
      ),
    );
  if (grubby > 0.5)
    layers.push(
      fill(mix(P.furShade, P.mouth, 80), ellipse(30, 48, 14, 7), {
        clip: "body",
        shade: "flat",
        edge: false,
      }),
    );
  // Cheeks, with a pixel of shine.
  layers.push(
    fill(
      mix(fur, P.tongue, 45),
      [ellipse(-50, 22, 11, 6.5), ellipse(50, 22, 11, 6.5)],
      { shade: "flat", edge: false },
    ),
  );
  layers.push(
    fill(
      mix(P.white, P.tongue, 60),
      [rect(-56, 18, 2.5, 2.5), rect(44, 18, 2.5, 2.5)],
      { shade: "flat", edge: false },
    ),
  );
  if (stage === "grown" && form === "lamplighter") {
    layers.push(
      fill("rgba(var(--pet-glow-rgb), 0.3)", circle(-4, -97, 13), {
        shade: "flat",
        edge: false,
        over: true,
      }),
    );
    layers.push(
      fill("rgba(var(--pet-glow-rgb), 1)", circle(-4, -97, 8), {
        shade: "ball",
      }),
    );
  }
  return { layers };
}

/** What happens to the pupils and lids, per face. */
function lidFor(expression: Expression): [number, number] | null {
  switch (expression) {
    case "sleepy":
      return [-2, -2];
    case "sad":
      return [-8, -20];
    case "unwell":
      return [-11, -13];
    case "grumpy":
      return [-22, -9];
    default:
      return null;
  }
}

export interface FaceState {
  expression: Expression;
  look: { x: number; y: number };
  blinking: boolean;
  chomp: boolean;
}

const clamp = (n: number) =>
  Math.min(1, Math.max(-1, Number.isFinite(n) ? n : 0));

/** Eyes and mouth. Pupils move in whole pixels, as pixel art does. */
export function faceArt({ expression, look, blinking, chomp }: FaceState): Art {
  const layers: Layer[] = [];
  const open =
    expression !== "happy" &&
    expression !== "asleep" &&
    expression !== "dizzy" &&
    !blinking;
  const pupil =
    expression === "surprised" ? 9 : expression === "hungry" ? 15 : EYE.pupil;
  const snap = (v: number) => Math.round(v / GRID.u) * GRID.u;
  const gx = snap(clamp(look.x) * EYE.reach);
  const gy = snap(
    clamp(look.y) * EYE.reach +
      (expression === "sad" || expression === "unwell" ? 4 : 0),
  );
  const lid = lidFor(expression);
  for (const side of [-1, 1] as const) {
    const ex = side * EYE.x;
    const ey = EYE.y;
    const name = side < 0 ? "eyeL" : "eyeR";
    if (open) {
      layers.push(
        fill(P.white, ellipse(ex, ey, EYE.rx, EYE.ry), { name, shade: "rim" }),
      );
      const px = ex + gx;
      const py = ey + gy;
      layers.push(
        fill(P.ink, ellipse(px, py, pupil, pupil * 1.08), {
          clip: name,
          shade: "flat",
          edge: false,
          name: `${name}p`,
        }),
      );
      // A warm glint low in the pupil, then two shines.
      layers.push(
        fill(
          mix(P.ink, P.fur, 55),
          ellipse(px, py + pupil * 0.62, pupil * 0.62, pupil * 0.34),
          { clip: `${name}p`, shade: "flat", edge: false },
        ),
      );
      layers.push(
        fill(
          P.white,
          [
            ellipse(
              px - pupil * 0.38,
              py - pupil * 0.45,
              pupil * 0.36,
              pupil * 0.4,
            ),
            circle(px + pupil * 0.4, py + pupil * 0.3, pupil * 0.16),
          ],
          { clip: name, shade: "flat", edge: false },
        ),
      );
      if (lid) {
        const [outer, inner] = lid;
        const left = side < 0 ? outer : inner;
        const right = side < 0 ? inner : outer;
        const w = EYE.rx + 4;
        layers.push(
          fill(
            P.fur,
            path(
              `M${ex - w} ${ey - EYE.ry - 4}H${ex + w}V${ey + right}L${ex - w} ${ey + left}Z`,
            ),
            { clip: name, shade: "flat" },
          ),
        );
      }
    } else if (expression === "happy") {
      layers.push(
        line(
          P.ink,
          5,
          `M${ex - 15} ${ey + 6}Q${ex} ${ey - 16} ${ex + 15} ${ey + 6}`,
        ),
      );
    } else if (expression === "dizzy") {
      layers.push(
        line(P.ink, 4.5, [
          `M${ex - 11} ${ey - 11}L${ex + 11} ${ey + 11}`,
          `M${ex + 11} ${ey - 11}L${ex - 11} ${ey + 11}`,
        ]),
      );
    } else {
      layers.push(
        line(
          P.ink,
          5,
          `M${ex - 16} ${ey - 2}Q${ex} ${ey + 11} ${ex + 16} ${ey - 2}`,
        ),
      );
    }
  }

  const mouth = (shapes: Parameters<typeof fill>[1]) =>
    fill(P.mouth, shapes, { name: "mouth", shade: "flat" });
  const tongue = (cx: number, cy: number, rx: number, ry: number) =>
    fill(P.tongue, ellipse(cx, cy, rx, ry), {
      clip: "mouth",
      shade: "flat",
      edge: false,
    });
  switch (expression) {
    case "happy":
      layers.push(
        mouth(path("M-16 22Q0 27 16 22Q13 46 0 46Q-13 46 -16 22Z")),
        tongue(0, 42, 9, 6),
      );
      break;
    case "eating":
      if (chomp) layers.push(line(P.mouth, 4, "M-12 32Q-6 37 0 32Q6 37 12 32"));
      else layers.push(mouth(ellipse(0, 34, 12, 11)), tongue(0, 42, 8, 5));
      break;
    case "hungry":
      layers.push(mouth(ellipse(0, 33, 6.5, 7.5)));
      break;
    case "surprised":
      layers.push(mouth(ellipse(0, 34, 8, 10)), tongue(0, 42, 6, 4));
      break;
    case "sad":
    case "unwell":
      layers.push(line(P.mouth, 4, "M-9 37Q0 29 9 37"));
      break;
    case "grumpy":
      layers.push(line(P.mouth, 4, "M-9 34Q0 30 9 34"));
      break;
    case "asleep":
    case "dizzy":
      layers.push(mouth(ellipse(0, 33, 4.5, 4)));
      break;
    default:
      layers.push(
        mouth(path("M-11 26Q0 29 11 26Q9 40 0 40Q-9 40 -11 26Z")),
        tongue(0, 38, 7, 4),
      );
  }
  return { layers };
}

/** The mood glow: rings of light, stepped the way pixel art does gradients. */
export const GLOW_ART: Art = {
  outline: "none",
  layers: [
    fill("rgba(var(--pet-glow-rgb), 0.08)", circle(0, 0, 116), {
      shade: "flat",
      edge: false,
    }),
    fill("rgba(var(--pet-glow-rgb), 0.16)", circle(0, 0, 100), {
      shade: "flat",
      edge: false,
    }),
    fill("rgba(var(--pet-glow-rgb), 0.26)", circle(0, 0, 82), {
      shade: "flat",
      edge: false,
    }),
    fill("rgba(var(--pet-glow-rgb), 0.38)", circle(0, 0, 62), {
      shade: "flat",
      edge: false,
    }),
  ],
};

/** The shadow it sits on. */
export const SHADOW_ART: Art = {
  outline: "none",
  layers: [
    fill(P.furShade, ellipse(0, 88, 56, 8), { shade: "flat", edge: false }),
    fill(mix(P.furShade, P.mouth, 60), ellipse(0, 88, 40, 5), {
      shade: "flat",
      edge: false,
    }),
  ],
};

/** The Dreamer's star, the sleeping z's. */
export const STAR_ART: Art = {
  layers: [fill(P.star, path(starPath(82, -70, 12)), { shade: "rim" })],
};
export const Z_ART: Art = {
  layers: [
    line(P.dim, 3, "M54 -66H62L54 -58H62"),
    line(P.dim, 3.4, "M68 -88H78L68 -78H78"),
    line(P.dim, 3.8, "M84 -112H96L84 -100H96"),
  ],
};

/** A sibling app's prop, worn or beside it (they move with the pet unless noted). */
export function propArt(wear: readonly Prop[]): { worn: Art; beside: Art } {
  const worn: Layer[] = [];
  const beside: Layer[] = [];
  if (wear.includes("bookshelf")) {
    worn.push(
      line(mix(P.crust, P.ink, 60), 3.5, [
        `M${-EYE.x} ${EYE.y - 31}a31 31 0 1 0 0.1 0`,
        `M${EYE.x} ${EYE.y - 31}a31 31 0 1 0 0.1 0`,
        "M-3 -14Q0 -18 3 -14",
        "M-60 -16L-70 -22",
        "M60 -16L70 -22",
      ]),
    );
    worn.push(
      line(P.white, 2.5, [
        `M${-EYE.x - 18} ${EYE.y - 14}l6 -6`,
        `M${EYE.x - 18} ${EYE.y - 14}l6 -6`,
      ]),
    );
  }
  if (wear.includes("mise")) {
    worn.push(
      fill(
        P.white,
        [
          path("M-30 -60L-28 -76H28L30 -60Q0 -54 -30 -60Z"),
          path(
            "M-28 -76Q-46 -84 -38 -100Q-30 -114 -14 -106Q-8 -124 10 -118Q26 -114 22 -102Q42 -106 42 -90Q42 -78 28 -76Z",
          ),
        ],
        { shade: "rim" },
      ),
    );
    worn.push(
      line(mix(P.white, P.mouth, 70), 2.5, ["M-14 -76V-90", "M10 -76V-94"]),
    );
  }
  if (wear.includes("ledger")) {
    worn.push(
      fill(P.leaf, [
        path("M-56 -44Q0 -78 56 -44L52 -36Q0 -66 -52 -36Z"),
        path("M-34 -50Q0 -66 34 -50Q38 -36 0 -40Q-38 -36 -34 -50Z"),
      ]),
    );
  }
  if (wear.includes("colophon")) {
    worn.push(fill(P.cream, path("M48 -48Q76 -100 104 -112Q92 -80 56 -44Z")));
    worn.push(line(mix(P.cream, P.ink, 50), 2, "M52 -46L96 -104"));
  }
  if (wear.includes("waymark")) {
    beside.push(
      fill(
        P.berry,
        path("M84 -64Q70 -78 70 -92A14 14 0 0 1 98 -92Q98 -78 84 -64Z"),
        { shade: "ball" },
      ),
    );
    beside.push(fill(P.white, circle(84, -92, 5), { shade: "flat" }));
  }
  if (wear.includes("rosetta")) {
    beside.push(
      fill(
        P.white,
        path(
          "M-104 -96H-58Q-50 -96 -50 -88V-72Q-50 -64 -58 -64H-70L-80 -54V-64H-104Q-112 -64 -112 -72V-88Q-112 -96 -104 -96Z",
        ),
      ),
    );
    beside.push(
      fill(
        P.ink,
        [circle(-94, -80, 3.2), circle(-81, -80, 3.2), circle(-68, -80, 3.2)],
        { shade: "flat", edge: false },
      ),
    );
  }
  if (wear.includes("cake")) {
    beside.push(
      fill(P.crust, path("M-112 84V62Q-112 56 -106 56H-74Q-68 56 -68 62V84Z")),
    );
    beside.push(
      fill(
        P.white,
        path("M-112 58H-68V68Q-76 74 -82 68Q-90 74 -98 68Q-104 74 -112 68Z"),
        { shade: "flat" },
      ),
    );
    beside.push(
      fill(P.berry, [circle(-100, 76, 3), circle(-84, 78, 3)], {
        shade: "flat",
        edge: false,
      }),
    );
    beside.push(fill(P.berry, rect(-92, 38, 5, 18), { shade: "flat" }));
    beside.push(
      fill(P.honey, path("M-89.5 24Q-82 32 -89.5 38Q-97 32 -89.5 24Z"), {
        shade: "flat",
      }),
    );
  }
  return { worn: { layers: worn }, beside: { layers: beside } };
}
