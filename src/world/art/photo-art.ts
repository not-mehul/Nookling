// Photo mode's backdrops and stickers as pixel art. Backdrops fill the
// 1080 × 1350 picture at 15 units a pixel (72 across); stickers are drawn on
// a 40 × 40 box and placed at three times size.
import {
  P,
  circle,
  ellipse,
  fill,
  line,
  mix,
  path,
  rect,
} from "../../pixel/kit";
import type { Art, Layer } from "../../pixel/raster";

export type Backdrop = "plain" | "meadow" | "night" | "beach" | "snow";
export type Sticker = "heart" | "star" | "sparkle" | "leaf" | "note";

export const BACKDROP_GRID = { x: 0, y: 0, w: 1080, h: 1350, u: 15 };
export const STICKER_GRID = { x: -20, y: -20, w: 40, h: 40, u: 2.5 };
const flat = { shade: "flat", edge: false } as const;

/** Bands of sky, top to bottom, with dithered seams. */
function sky(colours: string[], from: number, to: number): Layer[] {
  const step = (to - from) / colours.length;
  return colours.flatMap((c, i) => {
    const y = from + i * step;
    const band = fill(c, rect(0, i ? y : 0, 1080, 1350), flat);
    return i
      ? [fill(c, rect(0, y - 15, 1080, 1350), { ...flat, dither: true }), band]
      : [band];
  });
}

export function backdropArt(b: Backdrop): Art | null {
  const L: Layer[] = [];
  switch (b) {
    case "meadow":
      L.push(
        ...sky(
          [
            mix(P.sky, P.ink, 80),
            mix(P.sky, P.white, 60),
            mix(P.sky, P.white, 35),
          ],
          0,
          900,
        ),
      );
      L.push(
        fill("rgba(var(--pet-glow-rgb), 0.25)", circle(860, 220, 150), {
          ...flat,
          over: true,
        }),
        fill(P.honey, circle(860, 220, 90), { shade: "ball" }),
      );
      L.push(
        fill(
          P.white,
          [
            ellipse(260, 260, 120, 34),
            circle(220, 230, 50),
            circle(300, 220, 60),
          ],
          { shade: "rim" },
        ),
      );
      L.push(
        fill(
          mix(P.leaf, P.sky, 55),
          path("M0 820Q260 700 520 780Q800 690 1080 760V1350H0Z"),
          flat,
        ),
      );
      L.push(
        fill(P.leaf, path("M0 900Q300 760 600 860T1080 820V1350H0Z"), {
          shade: "rim",
          name: "hill",
        }),
      );
      L.push(
        fill(
          mix(P.leaf, P.white, 65),
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
            rect((i * 233) % 1060, 960 + ((i * 97) % 300), 15, 30),
          ),
          { clip: "hill", ...flat },
        ),
      );
      for (const [x, y] of [
        [160, 1040],
        [420, 1120],
        [760, 1060],
        [940, 1180],
        [300, 1240],
        [620, 1220],
      ] as const) {
        L.push(fill(P.leaf, rect(x - 7, y, 15, 60), flat));
        L.push(
          fill(P.berry, [
            circle(x - 18, y, 16),
            circle(x + 18, y, 16),
            circle(x, y - 18, 16),
            circle(x, y + 18, 16),
          ]),
        );
        L.push(fill(P.honey, circle(x, y, 12), flat));
      }
      break;
    case "night":
      L.push(
        ...sky(
          [mix(P.ink, P.sky, 94), mix(P.ink, P.sky, 84), mix(P.ink, P.sky, 74)],
          0,
          1100,
        ),
      );
      L.push(
        fill(
          P.cream,
          Array.from({ length: 30 }, (_, i) => {
            const x = (i * 317) % 1080;
            const y = (i * 211) % 900;
            return i % 4 ? rect(x, y, 15, 15) : rect(x - 15, y - 15, 15, 15);
          }),
          flat,
        ),
      );
      L.push(
        fill(
          P.cream,
          [0, 1, 2, 3].flatMap((i) => {
            const x = 150 + i * 260;
            const y = 120 + ((i * 173) % 500);
            return [rect(x - 15, y, 45, 15), rect(x, y - 15, 15, 45)];
          }),
          flat,
        ),
      );
      L.push(
        fill("rgba(var(--pet-glow-rgb), 0.15)", circle(220, 220, 140), {
          ...flat,
          over: true,
        }),
        fill("rgba(var(--pet-glow-rgb), 0.22)", circle(220, 220, 105), {
          ...flat,
          over: true,
        }),
      );
      L.push(
        fill(P.cream, circle(220, 220, 80), { shade: "ball", name: "moon" }),
      );
      L.push(
        fill(
          mix(P.cream, P.ink, 80),
          [circle(190, 200, 16), circle(250, 250, 12), circle(230, 175, 8)],
          { clip: "moon", ...flat },
        ),
      );
      L.push(
        fill(
          mix(P.ink, P.leaf, 75),
          path("M0 1060Q300 980 560 1040Q820 960 1080 1020V1350H0Z"),
          { shade: "rim" },
        ),
      );
      break;
    case "beach":
      L.push(
        ...sky(
          [
            mix(P.sky, P.ink, 80),
            mix(P.sky, P.white, 60),
            mix(P.honey, P.white, 50),
          ],
          0,
          760,
        ),
      );
      L.push(
        fill("rgba(var(--pet-glow-rgb), 0.25)", circle(200, 260, 150), {
          ...flat,
          over: true,
        }),
        fill(P.honey, circle(200, 260, 90), { shade: "ball" }),
      );
      L.push(
        fill(mix(P.sky, P.ink, 70), rect(0, 760, 1080, 200), {
          shade: "flat",
          name: "sea",
        }),
      );
      L.push(
        fill(
          mix(P.sky, P.white, 50),
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
            rect((i * 157) % 1000, 790 + ((i * 61) % 140), 75, 15),
          ),
          { clip: "sea", ...flat },
        ),
      );
      L.push(
        fill(P.white, path("M0 930Q270 900 540 930T1080 920V960H0Z"), flat),
      );
      L.push(
        fill(P.honey, path("M0 940Q540 880 1080 940V1350H0Z"), {
          shade: "rim",
          name: "sand",
        }),
      );
      L.push(
        fill(
          mix(P.honey, P.crust, 50),
          [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
            rect((i * 199) % 1060, 1000 + ((i * 113) % 320), 15, 15),
          ),
          { clip: "sand", ...flat },
        ),
      );
      L.push(
        fill(
          P.berry,
          path(
            "M880 1180Q900 1140 940 1150Q960 1180 920 1200Q890 1205 880 1180Z",
          ),
        ),
      );
      break;
    case "snow":
      L.push(
        ...sky(
          [mix(P.sky, P.white, 50), mix(P.cream, P.sky, 70), P.cream],
          0,
          960,
        ),
      );
      L.push(
        fill(
          mix(P.leaf, P.ink, 70),
          [
            path("M160 980L240 740L320 980Z"),
            path("M820 960L880 780L940 960Z"),
          ],
          { shade: "rim" },
        ),
      );
      L.push(
        fill(
          P.white,
          [
            path("M240 740L270 830L240 815L210 830Z"),
            path("M880 780L902 846L880 834L858 846Z"),
          ],
          flat,
        ),
      );
      L.push(
        fill(P.white, path("M0 960Q360 880 700 960T1080 940V1350H0Z"), {
          shade: "rim",
        }),
      );
      L.push(
        fill(
          P.white,
          Array.from({ length: 36 }, (_, i) =>
            rect(
              (i * 293) % 1080,
              (i * 157) % 1000,
              i % 4 ? 15 : 30,
              i % 4 ? 15 : 30,
            ),
          ),
          flat,
        ),
      );
      break;
    default:
      return null;
  }
  return { outline: "none", layers: L };
}

export function stickerArt(kind: Sticker): Art {
  switch (kind) {
    case "heart":
      return {
        layers: [
          fill(
            P.berry,
            path(
              "M0 14C-24 -1 -18 -18 -7 -17Q0 -16 0 -8Q0 -16 7 -17C18 -18 24 -1 0 14Z",
            ),
            { shade: "ball" },
          ),
          fill(
            P.white,
            [rect(-12, -10, 2.5, 5), rect(-9.5, -12.5, 2.5, 2.5)],
            flat,
          ),
        ],
      };
    case "star":
      return {
        layers: [
          fill(
            P.honey,
            path("M0 -17L5 -6L17 -5L8 3L11 15L0 9L-11 15L-8 3L-17 -5L-5 -6Z"),
            { shade: "ball" },
          ),
        ],
      };
    case "sparkle":
      return {
        layers: [
          fill(
            P.cream,
            path("M0 -17Q2 -2 17 0Q2 2 0 17Q-2 2 -17 0Q-2 -2 0 -17Z"),
            { shade: "flat" },
          ),
          fill(P.white, rect(-1.25, -1.25, 2.5, 2.5), flat),
        ],
      };
    case "leaf":
      return {
        layers: [
          fill(P.leaf, path("M-13 13Q-15 -11 13 -14Q14 10 -13 13Z"), {
            name: "l",
          }),
          line(
            mix(P.leaf, P.ink, 55),
            2,
            ["M-13 13L8 -8", "M-3 3L-3 -4", "M3 -3L8 1"],
            { clip: "l" },
          ),
        ],
      };
    default:
      return {
        layers: [
          line(P.sky, 3.5, ["M-4 9V-13L10 -16V5", "M-4 -6L10 -9"], {
            edge: true,
          }),
          fill(
            P.sky,
            [ellipse(-9, 10, 6, 4.5, -20), ellipse(5, 6, 6, 4.5, -20)],
            { shade: "ball" },
          ),
        ],
      };
  }
}
