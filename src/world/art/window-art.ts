// The view from the nook's window, as pixel art: a 300 × 220 box at 3 units a
// pixel. The sky is stepped bands with dithered seams, the way pixel art does
// a gradient. Rain and snow are drawn separately so they can fall.
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
import type { Season } from "../treasures";
import type { Sky, Weather } from "../weather";

export const WINDOW_GRID = { x: 0, y: 0, w: 300, h: 220, u: 3 };
const flat = { shade: "flat", edge: false } as const;
const inSky = { clip: "pane", shade: "flat", edge: false } as const;

/** Top to bottom, the sky's bands. */
const SKY: Record<Sky, [string, string, string]> = {
  dawn: [
    mix(P.berry, P.white, 45),
    mix(P.honey, P.berry, 60),
    mix(P.honey, P.white, 60),
  ],
  day: [
    mix(P.sky, P.ink, 85),
    mix(P.sky, P.white, 70),
    mix(P.sky, P.white, 40),
  ],
  dusk: [
    mix(P.ink, P.berry, 55),
    mix(P.berry, P.rust, 50),
    mix(P.honey, P.rust, 55),
  ],
  night: [mix(P.ink, P.sky, 92), mix(P.ink, P.sky, 80), mix(P.ink, P.sky, 68)],
};

const TREE: Record<Season, string> = {
  spring: mix(P.berry, P.white, 60),
  summer: P.leaf,
  autumn: P.rust,
  winter: P.leaf,
};

export function windowArt(sky: Sky, season: Season, weather: Weather): Art {
  const L: Layer[] = [];
  const [top, mid, low] = SKY[sky];
  L.push(fill(top, rect(20, 14, 260, 176), { name: "pane", ...flat }));
  L.push(fill(mid, rect(20, 60, 260, 130), { ...inSky, dither: true }));
  L.push(fill(mid, rect(20, 72, 260, 118), inSky));
  L.push(fill(low, rect(20, 112, 260, 78), { ...inSky, dither: true }));
  L.push(fill(low, rect(20, 124, 260, 66), inSky));

  if (sky === "night") {
    const stars: [number, number][] = [
      [60, 40],
      [120, 62],
      [200, 36],
      [250, 96],
      [90, 100],
      [170, 90],
      [40, 76],
      [140, 30],
    ];
    L.push(
      fill(
        P.cream,
        stars.flatMap(([x, y], i) =>
          i % 3
            ? [rect(x, y, 3, 3)]
            : [rect(x - 3, y, 9, 3), rect(x, y - 3, 3, 9)],
        ),
        inSky,
      ),
    );
    L.push(
      fill("rgba(var(--pet-glow-rgb), 0.18)", circle(226, 54, 28), {
        ...inSky,
        over: true,
      }),
    );
    L.push(
      fill(P.cream, circle(226, 54, 16), {
        clip: "pane",
        shade: "ball",
        name: "moon",
      }),
    );
    L.push(fill(top, circle(234, 47, 13), { clip: "moon", ...flat }));
  } else {
    const sx = sky === "dawn" ? 70 : sky === "dusk" ? 230 : 210;
    const sy = sky === "day" ? 50 : 132;
    L.push(
      fill("rgba(var(--pet-glow-rgb), 0.22)", circle(sx, sy, 40), {
        ...inSky,
        over: true,
      }),
    );
    L.push(
      fill("rgba(var(--pet-glow-rgb), 0.3)", circle(sx, sy, 29), {
        ...inSky,
        over: true,
      }),
    );
    L.push(fill(P.honey, circle(sx, sy, 19), { clip: "pane", shade: "ball" }));
  }

  if (weather === "cloudy" || weather === "rain") {
    const cloud = (x: number, y: number, w: number) => [
      ellipse(x, y, w, w * 0.32),
      circle(x - w * 0.3, y - w * 0.18, w * 0.34),
      circle(x + w * 0.2, y - w * 0.26, w * 0.42),
    ];
    const c = weather === "rain" ? mix(P.cream, P.ink, 70) : P.cream;
    L.push(
      fill(c, [...cloud(90, 56, 40), ...cloud(200, 72, 46)], {
        clip: "pane",
        shade: "rim",
      }),
    );
  }

  // Far hills, near hill, trees.
  L.push(
    fill(
      mix(P.leaf, sky === "night" ? P.ink : P.sky, 55),
      path("M20 150Q60 122 110 138Q170 112 230 132Q260 126 280 130V190H20Z"),
      inSky,
    ),
  );
  if (season !== "winter") {
    for (const [x, base, h, w] of [
      [70, 152, 28, 16],
      [232, 150, 22, 12],
      [120, 150, 16, 9],
    ] as const) {
      L.push(
        fill(
          mix(P.crust, P.ink, 70),
          rect(x - 2, base - h * 0.6, 5, h * 0.6 + 4),
          { clip: "pane", shade: "flat" },
        ),
      );
      L.push(
        fill(
          TREE[season],
          [
            ellipse(x, base - h, w, h * 0.7),
            circle(x - w * 0.6, base - h * 0.7, w * 0.6),
            circle(x + w * 0.6, base - h * 0.75, w * 0.55),
          ],
          { clip: "pane", shade: "ball" },
        ),
      );
      if (season === "autumn")
        L.push(
          fill(
            P.honey,
            [rect(x - 6, base - h - 6, 3, 3), rect(x + 4, base - h + 2, 3, 3)],
            inSky,
          ),
        );
      if (season === "spring")
        L.push(
          fill(
            P.white,
            [
              rect(x - 6, base - h - 4, 3, 3),
              rect(x + 3, base - h + 3, 3, 3),
              rect(x - 1, base - h - 10, 3, 3),
            ],
            inSky,
          ),
        );
    }
  } else {
    for (const [x, base, h] of [
      [70, 152, 34],
      [232, 150, 26],
    ] as const) {
      L.push(
        fill(
          mix(P.leaf, P.ink, 70),
          path(`M${x} ${base - h}L${x + h * 0.45} ${base}H${x - h * 0.45}Z`),
          { clip: "pane", shade: "rim" },
        ),
      );
      L.push(
        fill(
          P.white,
          path(
            `M${x} ${base - h}L${x + h * 0.18} ${base - h * 0.6}L${x} ${base - h * 0.66}L${x - h * 0.18} ${base - h * 0.6}Z`,
          ),
          inSky,
        ),
      );
    }
  }
  L.push(
    fill(
      season === "winter" ? P.white : P.leaf,
      path("M20 162Q90 130 160 152Q220 172 280 146V190H20Z"),
      { clip: "pane", shade: "rim" },
    ),
  );
  if (season !== "winter")
    L.push(
      fill(
        mix(P.leaf, P.white, 60),
        [
          rect(50, 156, 3, 3),
          rect(86, 150, 3, 3),
          rect(190, 166, 3, 3),
          rect(250, 160, 3, 3),
        ],
        inSky,
      ),
    );
  if (season === "spring")
    L.push(
      fill(
        P.berry,
        [rect(60, 162, 3, 3), rect(140, 160, 3, 3), rect(214, 170, 3, 3)],
        inSky,
      ),
    );

  if (weather === "mist") {
    L.push(
      fill(P.cream, [rect(20, 108, 260, 18), rect(20, 140, 260, 22)], {
        ...inSky,
        dither: true,
      }),
    );
  }

  // The frame, its cross bars and the sill, in wood.
  L.push(
    fill(
      P.crust,
      path(
        "M14 8H286V196H14ZM23 17V99H147V17ZM153 17V99H277V17ZM23 105V187H147V105ZM153 105V187H277V105Z",
      ),
      { shade: "rim", name: "frame" },
    ),
  );
  L.push(
    line(
      mix(P.crust, P.ink, 70),
      1.5,
      ["M30 12H110", "M180 12H260", "M17 40V80", "M283 130V170"],
      { clip: "frame" },
    ),
  );
  L.push(fill(P.crust, rect(4, 190, 292, 14), { shade: "rim", name: "sill" }));
  L.push(
    fill(mix(P.crust, P.white, 70), rect(4, 190, 292, 3), {
      clip: "sill",
      ...flat,
    }),
  );
  return { layers: L };
}

/** Rain or snow, as one tile that falls and repeats. */
export function weatherArt(weather: Weather): Art | null {
  if (weather !== "rain" && weather !== "snow") return null;
  const drops = Array.from(
    { length: 24 },
    (_, i) => [30 + ((i * 37) % 250), 20 + ((i * 53) % 150)] as const,
  );
  if (weather === "rain")
    return {
      outline: "none",
      layers: [
        fill(
          mix(P.cream, P.sky, 60),
          drops.flatMap(([x, y]) => [
            rect(x, y, 3, 6),
            rect(x - 3, y + 6, 3, 6),
          ]),
          flat,
        ),
      ],
    };
  return {
    outline: "none",
    layers: [
      fill(
        P.white,
        drops.map(([x, y]) => rect(x, y, 3, 3)),
        flat,
      ),
    ],
  };
}
