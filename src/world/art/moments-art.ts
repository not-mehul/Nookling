// The little-moment props as pixel art, in the pet's own box (-120 to 120)
// and on its grid, so they sit in the scene at the pet's resolution.
import {
  P,
  circle,
  ellipse,
  fill,
  line,
  mix,
  path,
  place,
  rect,
} from "../../pixel/kit";
import type { Art, Layer } from "../../pixel/raster";
import type { MomentProp } from "../moments";

const flat = { shade: "flat", edge: false } as const;

export function momentArt(prop: MomentProp): Art {
  const L: Layer[] = [];
  switch (prop) {
    case "moth":
      L.push(
        ...place(
          [
            fill(
              P.cream,
              [
                path("M0 0Q-18 -18 -22 -2Q-16 8 0 0Z"),
                path("M0 0Q18 -18 22 -2Q16 8 0 0Z"),
              ],
              { name: "wings" },
            ),
            fill(
              mix(P.cream, P.crust, 55),
              [circle(-12, -5, 3.5), circle(12, -5, 3.5)],
              { clip: "wings", ...flat },
            ),
            fill(P.crust, ellipse(0, 1, 3, 7)),
            line(mix(P.crust, P.ink, 50), 2, ["M0 -5L-5 -12", "M0 -5L5 -12"]),
          ],
          { x: 70, y: -88 },
        ),
      );
      break;
    case "teacup":
      L.push(
        ...place(
          [
            line(P.faint, 2.5, [
              "M-6 -22Q-10 -28 -5 -34",
              "M6 -22Q2 -28 7 -36",
            ]),
            line(P.cream, 4.5, "M19 -8Q30 -8 28 2Q26 8 18 6", { edge: true }),
            fill(P.cream, path("M-20 -14H20Q20 12 0 14Q-20 12 -20 -14Z"), {
              name: "cup",
            }),
            fill(P.berry, [rect(-20, -6, 40, 4)], { clip: "cup", ...flat }),
            fill(P.crust, ellipse(0, -14, 19, 3), { shade: "flat" }),
            fill(P.cream, path("M-27 13H27Q23 21 0 21Q-23 21 -27 13Z")),
          ],
          { x: -92, y: 66 },
        ),
      );
      break;
    case "book":
      L.push(
        ...place(
          [
            fill(P.berry, path("M-28 -10L0 -4L28 -10V12L0 18L-28 12Z")),
            fill(P.white, path("M-24 -11L0 -6L24 -11V8L0 13L-24 8Z"), {
              shade: "rim",
            }),
            line(mix(P.white, P.ink, 60), 1.5, [
              "M-19 -4L-5 -1",
              "M-19 1L-5 4",
              "M-19 6L-9 8",
              "M5 -1L19 -4",
              "M5 4L19 1",
            ]),
            line(mix(P.berry, P.ink, 60), 2.5, "M0 -5V14"),
            fill(P.honey, path("M8 12V22L11 19L14 22V12Z"), { shade: "flat" }),
          ],
          { x: -88, y: 74 },
        ),
      );
      break;
    case "dandelion": {
      const seeds: Layer[] = [
        line(P.leaf, 3.5, "M0 0Q-4 40 2 80", { edge: true }),
      ];
      const spokes: string[] = [];
      const puffs = [];
      for (let a = 0; a < 360; a += 30) {
        const r = (a * Math.PI) / 180;
        spokes.push(`M0 0L${15 * Math.sin(r)} ${-15 * Math.cos(r)}`);
        puffs.push(circle(18 * Math.sin(r), -18 * Math.cos(r), 3));
      }
      seeds.push(
        line(mix(P.cream, P.ink, 75), 1.4, spokes),
        fill(P.cream, puffs, flat),
        fill(P.cream, circle(0, 0, 4)),
      );
      L.push(...place(seeds, { x: 86, y: -20 }));
      break;
    }
    case "ladybug":
      L.push(
        ...place(
          [
            fill(P.ink, circle(-11, 0, 5), { shade: "flat" }),
            fill(P.berry, ellipse(0, 0, 11, 9), {
              shade: "ball",
              name: "shell",
            }),
            line(P.ink, 2, "M-1 -9V9", { clip: "shell" }),
            fill(
              P.ink,
              [
                circle(-5, -3, 2.2),
                circle(5, 3, 2.2),
                circle(4, -4, 1.6),
                circle(-4, 4, 1.6),
              ],
              { clip: "shell", ...flat },
            ),
          ],
          { x: 34, y: -66, r: 20 },
        ),
      );
      break;
    case "leaves":
      for (const [x, y, r, c] of [
        [-80, 92, 20, P.rust],
        [-58, 86, -30, P.honey],
        [64, 90, 40, P.rust],
        [84, 94, -10, P.leaf],
        [-96, 90, 70, P.honey],
      ] as const) {
        L.push(
          ...place(
            [
              fill(c, path("M-12 6Q-14 -8 12 -9Q12 8 -12 6Z")),
              line(mix(c, P.ink, 55), 1.5, "M-10 5L9 -7"),
            ],
            { x, y, r },
          ),
        );
      }
      break;
    case "puddle":
      L.push(
        fill(mix(P.sage, P.white, 70), ellipse(0, 88, 98, 14), {
          shade: "flat",
          name: "water",
        }),
      );
      L.push(
        fill(mix(P.sage, P.ink, 85), ellipse(10, 91, 70, 8), {
          clip: "water",
          ...flat,
        }),
      );
      L.push(
        line(P.white, 2.5, ["M-60 84Q-40 81 -20 84", "M30 92Q44 89 58 92"], {
          clip: "water",
        }),
      );
      return { outline: "none", layers: L };
    case "yarn":
      L.push(line(P.berry, 2.5, "M16 8Q60 26 90 18"));
      L.push(
        ...place(
          [
            fill(P.berry, circle(0, 0, 18), { shade: "ball", name: "ball" }),
            line(
              mix(P.berry, P.ink, 60),
              2,
              ["M-14 -10Q0 0 -6 16", "M-4 -17Q10 -4 4 17", "M8 -15Q16 0 14 10"],
              { clip: "ball" },
            ),
            line(mix(P.berry, P.white, 55), 2, ["M-10 -12Q-2 -16 6 -15"], {
              clip: "ball",
            }),
            line(P.honey, 3, "M-20 14L-30 10L-26 4", { edge: true }),
          ],
          { x: -86, y: 62 },
        ),
      );
      break;
    case "bubbles":
      for (const [x, y, r] of [
        [60, -70, 12],
        [84, -40, 8],
        [70, -106, 6],
        [-70, -84, 9],
        [-88, -54, 5],
      ] as const) {
        L.push(
          line(
            mix(P.sky, P.white, 50),
            2.5,
            `M${x} ${y - r}a${r} ${r} 0 1 0 0.1 0`,
          ),
        );
        L.push(
          fill(
            P.white,
            [
              rect(x - r * 0.55, y - r * 0.55, 2.5, 2.5),
              rect(x - r * 0.55 + 2.5, y - r * 0.55 - 2.5, 2.5, 2.5),
            ],
            flat,
          ),
        );
      }
      return { outline: "none", layers: L };
    case "sunbeam":
      L.push(
        fill(
          "rgba(var(--accent-bright-rgb), 0.12)",
          path("M-60 -120L20 -120L110 100L-30 100Z"),
          { ...flat, over: true },
        ),
      );
      L.push(
        fill(
          "rgba(var(--accent-bright-rgb), 0.12)",
          path("M-40 -120L0 -120L80 100L10 100Z"),
          { ...flat, over: true },
        ),
      );
      L.push(
        fill(
          "rgba(var(--accent-bright-rgb), 0.55)",
          [
            rect(30, -40, 2.5, 2.5),
            rect(-10, -70, 2.5, 2.5),
            rect(60, 20, 2.5, 2.5),
            rect(0, 40, 2.5, 2.5),
          ],
          flat,
        ),
      );
      return { outline: "none", layers: L };
    case "blanket":
      L.push(
        fill(P.rust, path("M-90 40Q-60 10 0 24Q60 10 90 40L84 96H-84Z"), {
          name: "quilt",
        }),
      );
      L.push(
        fill(
          P.honey,
          [
            rect(-70, 50, 20, 18),
            rect(-10, 50, 20, 18),
            rect(50, 50, 20, 18),
            rect(-40, 72, 20, 18),
            rect(20, 72, 20, 18),
          ],
          { clip: "quilt", shade: "flat" },
        ),
      );
      L.push(
        line(
          mix(P.rust, P.white, 60),
          1.5,
          ["M-86 46Q-60 18 0 30Q60 18 86 46"],
          { clip: "quilt" },
        ),
      );
      break;
    case "cloud":
      L.push(
        fill(
          P.white,
          path(
            "M40 -84Q40 -100 56 -100Q64 -114 80 -106Q96 -110 98 -94Q110 -90 104 -78H44Q36 -78 40 -84Z",
          ),
          { shade: "rim" },
        ),
      );
      break;
    case "snow":
      for (const [x, y] of [
        [-80, -90],
        [-40, -110],
        [10, -100],
        [60, -96],
        [96, -70],
        [-100, -40],
        [90, -20],
        [-60, -60],
      ] as const) {
        L.push(
          fill(
            P.white,
            [
              rect(x - 1.25, y - 3.75, 2.5, 7.5),
              rect(x - 3.75, y - 1.25, 7.5, 2.5),
            ],
            flat,
          ),
        );
      }
      return { outline: "none", layers: L };
    case "flower": {
      const petals = [0, 72, 144, 216, 288].map((a) =>
        ellipse(
          9 * Math.sin((a * Math.PI) / 180),
          -9 * Math.cos((a * Math.PI) / 180),
          6,
          9,
          a,
        ),
      );
      L.push(
        ...place(
          [
            line(P.leaf, 3.5, "M0 0V60", { edge: true }),
            fill(P.leaf, path("M0 36Q12 24 20 30Q12 42 0 36Z")),
            fill(P.berry, petals),
            fill(P.honey, circle(0, 0, 5), { shade: "ball" }),
          ],
          { x: 88, y: 30 },
        ),
      );
      break;
    }
    case "mirror":
      L.push(
        ...place(
          [
            fill(P.crust, [rect(-2.5, 26, 5, 38), rect(-12, 62, 24, 5)]),
            fill(P.honey, ellipse(0, 0, 20, 28), { shade: "ball" }),
            fill(mix(P.sage, P.white, 60), ellipse(0, 0, 14, 21), {
              name: "glass",
              shade: "flat",
            }),
            line(P.white, 3, ["M-8 -8L0 -16", "M-6 2L6 -10"], {
              clip: "glass",
            }),
          ],
          { x: -92, y: 20 },
        ),
      );
      break;
    default:
      L.push(
        line(P.dim, 3.5, [
          "M72 -70V-96L92 -100V-74",
          "M-80 -86V-108Q-74 -104 -70 -100",
        ]),
      );
      L.push(
        fill(
          P.dim,
          [
            ellipse(67, -70, 6, 4.5, -20),
            ellipse(87, -74, 6, 4.5, -20),
            ellipse(-85, -86, 6, 4.5, -20),
          ],
          { shade: "flat" },
        ),
      );
  }
  return { layers: L };
}
