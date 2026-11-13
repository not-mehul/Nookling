// Pixel art for the nook's things, the garden and the visitors.
//   Decor: a 100 × 100 box at 2.5 units a pixel (40 across).
//   Plants: 60 × 70 at 2 units a pixel.
//   Visitors: 80 × 80 at 2.5 units a pixel (32 across).
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
import type { DecorId } from "../decor";
import type { Growth, SeedId } from "../garden";
import type { VisitorId } from "../visitors";

const flat = { shade: "flat", edge: false } as const;
const star5 = (cx: number, cy: number, r: number) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.46 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return path(`${d}Z`);
};

export function decorArt(id: DecorId): Art {
  const L: Layer[] = [];
  switch (id) {
    case "rug":
      L.push(
        fill(mix(P.berry, P.cream, 70), ellipse(0, 10, 48, 16), {
          name: "rug",
        }),
      );
      L.push(
        line(P.honey, 3, "M-38 10a38 11 0 1 0 76 0a38 11 0 1 0 -76 0", {
          clip: "rug",
        }),
      );
      L.push(
        fill(P.cream, ellipse(0, 10, 24, 6), { clip: "rug", shade: "flat" }),
      );
      L.push(
        fill(
          P.berry,
          [rect(-3, 8, 6, 4), rect(-16, 9, 4, 2.5), rect(12, 9, 4, 2.5)],
          { clip: "rug", ...flat },
        ),
      );
      L.push(
        line(mix(P.berry, P.cream, 70), 2, [
          "M-48 6l-4 0",
          "M-48 14l-4 0",
          "M48 6l4 0",
          "M48 14l4 0",
        ]),
      );
      break;
    case "cushion":
      L.push(
        fill(
          P.sage,
          path(
            "M-40 14Q-44 -14 -20 -16H20Q44 -14 40 14Q42 30 20 30H-20Q-42 30 -40 14Z",
          ),
          { shade: "ball", name: "c" },
        ),
      );
      L.push(
        line(
          mix(P.sage, P.ink, 70),
          2.5,
          ["M-26 -2Q0 6 26 -2", "M-26 20Q0 14 26 20"],
          { clip: "c" },
        ),
      );
      L.push(fill(P.honey, circle(0, 7, 4), { shade: "ball" }));
      L.push(
        fill(P.sage, [
          path("M-42 -14L-36 -18L-34 -10Z"),
          path("M42 -14L36 -18L34 -10Z"),
          path("M-42 30L-36 34L-34 26Z"),
          path("M42 30L36 34L34 26Z"),
        ]),
      );
      break;
    case "plant":
      L.push(
        fill(P.leaf, path("M0 14Q-30 -10 -24 -38Q-4 -24 0 14Z"), { name: "a" }),
      );
      L.push(
        fill(P.leaf, path("M0 14Q26 -14 30 -34Q8 -30 0 14Z"), { name: "b" }),
      );
      L.push(
        fill(mix(P.leaf, P.white, 80), path("M0 14Q-6 -30 4 -48Q12 -24 0 14Z")),
      );
      L.push(
        line(mix(P.leaf, P.ink, 60), 2, [
          "M0 12Q-14 -8 -22 -32",
          "M0 12Q14 -10 26 -30",
          "M1 12Q0 -20 4 -42",
        ]),
      );
      L.push(fill(P.crust, path("M-18 14H18L13 46H-13Z"), { name: "pot" }));
      L.push(fill(mix(P.crust, P.white, 70), rect(-20, 12, 40, 7)));
      L.push(line(mix(P.crust, P.ink, 60), 2, "M-12 30H12", { clip: "pot" }));
      break;
    case "lamp":
      L.push(
        fill(P.crust, path("M-14 40H14Q14 47 0 47Q-14 47 -14 40Z"), {
          shade: "ball",
        }),
      );
      L.push(fill(mix(P.crust, P.ink, 60), rect(-2, -12, 4, 52)));
      L.push(
        fill(P.honey, path("M-23 -10L-12 -40H12L23 -10Z"), { name: "shade" }),
      );
      L.push(
        line(mix(P.honey, P.white, 50), 2.5, ["M-20 -14H20"], {
          clip: "shade",
        }),
      );
      L.push(
        line(
          mix(P.honey, P.crust, 50),
          2,
          ["M-6 -36L-10 -14", "M6 -36L10 -14"],
          { clip: "shade" },
        ),
      );
      break;
    case "books":
      L.push(fill(P.honey, rect(-36, 22, 72, 14), { name: "b3" }));
      L.push(fill(P.berry, rect(-34, 8, 68, 14), { name: "b2" }));
      L.push(fill(P.leaf, rect(-30, -6, 60, 14), { name: "b1" }));
      L.push(
        fill(
          P.white,
          [rect(30, -4, 3, 10), rect(34, 10, 3, 10), rect(36, 24, 3, 10)],
          flat,
        ),
      );
      L.push(
        line(
          mix(P.white, P.honey, 60),
          2.5,
          ["M-26 1H-14", "M-20 15H-8", "M-28 29H-16"],
          {},
        ),
      );
      L.push(fill(P.cream, [rect(-14, -14, 14, 8)], { shade: "rim" }));
      L.push(fill(P.berry, rect(-4, -14, 2.5, 12), flat));
      break;
    case "mobile":
      L.push(line(mix(P.crust, P.ink, 40), 2.5, ["M0 -50V-30", "M-36 -30H36"]));
      L.push(line(P.faint, 1.5, ["M-34 -30V-12", "M0 -30V4", "M34 -30V-10"]));
      L.push(fill(P.honey, star5(-34, -2, 10), { shade: "ball" }));
      L.push(
        fill(P.cream, path("M6 6A9 9 0 1 0 6 20A7 7 0 1 1 6 6Z"), {
          shade: "ball",
        }),
      );
      L.push(
        fill(P.sage, path("M34 -10Q44 0 34 10Q24 0 34 -10Z"), {
          shade: "ball",
        }),
      );
      break;
    case "ball":
      L.push(fill(P.berry, circle(0, 0, 30), { shade: "ball", name: "ball" }));
      L.push(
        fill(P.white, path("M-30 -4Q0 -18 30 -4L30 4Q0 -10 -30 4Z"), {
          clip: "ball",
          shade: "ball",
        }),
      );
      L.push(
        fill(P.honey, path("M-14 -30Q0 0 -14 30L-6 30Q8 0 -6 -30Z"), {
          clip: "ball",
          shade: "ball",
        }),
      );
      L.push(fill(P.white, circle(-12, -14, 3.5), flat));
      break;
    case "teacup":
      L.push(line(P.cream, 5, "M23 -8Q36 -8 34 4Q32 10 22 8", { edge: true }));
      L.push(
        fill(P.cream, path("M-24 -16H24Q24 16 0 18Q-24 16 -24 -16Z"), {
          shade: "ball",
          name: "cup",
        }),
      );
      L.push(
        fill(P.berry, [circle(-10, 0, 4), circle(8, 4, 4)], {
          clip: "cup",
          shade: "flat",
        }),
      );
      L.push(
        fill(P.leaf, [circle(-4, 4, 2.5), circle(14, -2, 2.5)], {
          clip: "cup",
          ...flat,
        }),
      );
      L.push(fill(P.crust, ellipse(0, -16, 23, 4), { shade: "flat" }));
      L.push(fill(P.cream, path("M-31 18H31Q27 26 0 26Q-27 26 -31 18Z")));
      L.push(
        line(P.faint, 2.5, [
          "M-8 -24q-4 -6 0 -10q4 -4 0 -10",
          "M6 -24q-4 -6 0 -10q4 -4 0 -10",
        ]),
      );
      break;
    case "lights":
      L.push(
        line(mix(P.leaf, P.ink, 50), 2.5, "M-50 -30Q-25 -6 0 -24Q25 -6 50 -30"),
      );
      [-38, -20, 0, 20, 38].forEach((x, i) => {
        const y = -18 + Math.abs(x) * -0.12 + (i % 2) * 4;
        L.push(fill(mix(P.leaf, P.ink, 50), rect(x - 2.5, y - 8, 5, 4), flat));
        L.push(
          fill(
            [P.honey, P.berry, P.leaf, P.honey, P.berry][i]!,
            ellipse(x, y, 5, 6.5),
            { shade: "ball" },
          ),
        );
      });
      break;
    case "frame":
      L.push(fill(P.crust, rect(-30, -36, 60, 72), { name: "f" }));
      L.push(
        line(mix(P.crust, P.white, 60), 2, ["M-28 -34H28", "M-28 -34V34"], {
          clip: "f",
        }),
      );
      L.push(
        fill(mix(P.sky, P.white, 60), rect(-22, -28, 44, 56), {
          shade: "flat",
          name: "pic",
        }),
      );
      L.push(
        fill(P.leaf, path("M-22 28V14Q-10 6 0 12Q12 4 22 12V28Z"), {
          clip: "pic",
          shade: "flat",
        }),
      );
      L.push(fill(P.fur, circle(0, 2, 11), { clip: "pic", shade: "ball" }));
      L.push(fill(P.ink, [rect(-5, -2, 2.5, 4), rect(3, -2, 2.5, 4)], flat));
      L.push(fill(P.honey, circle(12, -18, 4), { clip: "pic", ...flat }));
      break;
    case "blanket":
      L.push(
        fill(
          P.rust,
          path(
            "M-46 -10Q-20 -22 0 -10Q20 2 46 -10L44 24Q20 34 0 22Q-20 10 -44 24Z",
          ),
          { name: "q" },
        ),
      );
      L.push(
        fill(
          P.honey,
          [
            rect(-36, -8, 12, 12),
            rect(-12, 4, 12, 12),
            rect(12, 4, 12, 12),
            rect(30, -4, 12, 12),
          ],
          { clip: "q", shade: "flat" },
        ),
      );
      L.push(
        line(mix(P.rust, P.white, 60), 1.5, "M-40 0Q-20 -10 0 2Q20 14 40 2", {
          clip: "q",
        }),
      );
      break;
    default:
      L.push(
        fill(mix(P.crust, P.ink, 60), [
          rect(-36, 18, 5, 14),
          rect(31, 18, 5, 14),
        ]),
      );
      L.push(fill(P.crust, rect(-46, 10, 92, 9)));
      L.push(
        fill(P.sage, path("M-34 10Q-36 -6 -26 -6Q-16 -6 -18 10Z"), {
          shade: "ball",
        }),
      );
      L.push(
        fill(P.leaf, [ellipse(-30, -8, 4, 6, -30), ellipse(-22, -8, 4, 6, 30)]),
      );
      L.push(
        fill(P.cream, path("M-4 10Q-14 -10 2 -10Q16 -10 6 10Z"), {
          shade: "ball",
        }),
      );
      L.push(fill(P.honey, star5(30, 2, 9), { shade: "ball" }));
  }
  return { layers: L };
}

/** The lamp's pool of light, and the fairy lights' glow: shown when lit. */
export function decorGlow(id: DecorId): Art | null {
  const g = (a: number) => `rgba(var(--pet-glow-rgb), ${a})`;
  if (id === "lamp")
    return {
      outline: "none",
      layers: [
        fill(g(0.12), circle(0, -22, 46), flat),
        fill(g(0.2), circle(0, -22, 34), flat),
        fill(g(0.3), circle(0, -22, 22), flat),
      ],
    };
  if (id === "lights")
    return {
      outline: "none",
      layers: [-38, -20, 0, 20, 38].map((x, i) =>
        fill(
          g(0.35),
          circle(x, -18 + Math.abs(x) * -0.12 + (i % 2) * 4, 10),
          flat,
        ),
      ),
    };
  return null;
}

/** A plot: soil, and what grows in it (nothing, for a bare plot). */
export function plantArt(seed: SeedId | null, stage: Growth): Art {
  const L: Layer[] = [];
  const stem = mix(P.leaf, P.ink, 70);
  // Behind the soil: roots and bulbs that sit low.
  if (stage === "ripe" && seed === "carrot") {
    L.push(
      fill(P.honey, path("M-8 12L0 32L8 12Z"), { name: "root" }),
      line(mix(P.honey, P.crust, 40), 1.5, ["M-4 18l3 1", "M1 24l3 -1"], {
        clip: "root",
      }),
    );
  }
  // The soil mound.
  L.push(fill(P.crust, path("M-26 18Q0 8 26 18L22 30H-22Z"), { name: "soil" }));
  L.push(
    fill(
      mix(P.crust, P.ink, 70),
      [
        rect(-14, 20, 2, 2),
        rect(6, 22, 2, 2),
        rect(-4, 25, 2, 2),
        rect(14, 24, 2, 2),
      ],
      { clip: "soil", ...flat },
    ),
  );
  if (!seed) return { layers: L };
  if (stage === "seed") {
    L.push(
      fill(mix(P.crust, P.white, 60), ellipse(0, 13, 5, 3.5), {
        shade: "ball",
      }),
    );
    return { layers: L };
  }
  if (stage === "sprout") {
    L.push(line(stem, 2.5, "M0 16V2"));
    L.push(
      fill(P.leaf, [
        path("M0 4Q-12 -4 -14 4Q-6 10 0 4Z"),
        path("M0 4Q12 -4 14 4Q6 10 0 4Z"),
      ]),
    );
    return { layers: L };
  }
  L.push(line(stem, 2.5, "M0 16V-18"));
  L.push(
    fill(P.leaf, [
      path("M0 -2Q-18 -12 -20 -2Q-10 6 0 -2Z"),
      path("M0 -8Q18 -18 20 -8Q10 0 0 -8Z"),
      path("M0 8Q-12 2 -14 10Q-6 14 0 8Z"),
    ]),
  );
  L.push(
    line(mix(P.leaf, P.white, 60), 1.5, ["M-4 -3L-14 -4", "M4 -9L14 -10"]),
  );
  if (stage === "bud") {
    L.push(fill(P.leaf, path("M-5 -18Q0 -14 5 -18L0 -12Z")));
    L.push(fill(P.cream, ellipse(0, -22, 5, 6), { shade: "ball" }));
    return { layers: L };
  }
  // Ripe.
  switch (seed) {
    case "pumpkin":
      L.push(fill(P.honey, [ellipse(-7, 6, 9, 11), ellipse(7, 6, 9, 11)]));
      L.push(fill(P.honey, ellipse(0, 6, 8, 12), { shade: "ball" }));
      L.push(line(stem, 3, "M0 -6Q2 -10 5 -10"));
      break;
    case "carrot":
      L.push(
        fill(P.leaf, [
          path("M0 14Q-8 -14 -4 -26Q2 -10 0 14Z"),
          path("M0 14Q8 -14 4 -26Q-2 -10 0 14Z"),
        ]),
      );
      break;
    case "mint":
      L.push(
        fill(P.leaf, [
          path("M0 -16Q-14 -30 -12 -36Q2 -30 0 -16Z"),
          path("M0 -16Q14 -30 12 -36Q-2 -30 0 -16Z"),
        ]),
      );
      L.push(
        fill(
          mix(P.leaf, P.white, 70),
          path("M0 -18Q-6 -30 0 -34Q6 -30 0 -18Z"),
        ),
      );
      break;
    case "pea":
      L.push(
        fill(P.leaf, [
          path("M-16 -20Q-10 -30 0 -26Q-6 -16 -16 -20Z"),
          path("M4 -22Q12 -32 20 -26Q12 -16 4 -22Z"),
        ]),
      );
      L.push(
        fill(
          mix(P.leaf, P.white, 70),
          [
            circle(-9, -23, 2.5),
            circle(-4, -24, 2.5),
            circle(10, -24, 2.5),
            circle(15, -25, 2.5),
          ],
          flat,
        ),
      );
      L.push(
        line(stem, 1.5, ["M0 -18Q6 -30 14 -32", "M0 -14Q-10 -16 -14 -12"]),
      );
      break;
    case "strawberry": {
      const berry = (x: number, y: number) => [
        fill(
          P.berry,
          path(
            `M${x - 6} ${y - 3}Q${x} ${y - 7} ${x + 6} ${y - 3}Q${x + 5} ${y + 5} ${x} ${y + 8}Q${x - 5} ${y + 5} ${x - 6} ${y - 3}Z`,
          ),
          { shade: "ball" },
        ),
        fill(
          P.honey,
          [rect(x - 3, y - 1, 1.5, 1.5), rect(x + 1, y + 2, 1.5, 1.5)],
          flat,
        ),
        fill(
          P.leaf,
          path(`M${x - 5} ${y - 4}L${x} ${y - 8}L${x + 5} ${y - 4}Z`),
        ),
      ];
      L.push(...berry(-10, -18), ...berry(10, -22), ...berry(0, -30));
      break;
    }
  }
  return { layers: L };
}

export function visitorArt(id: VisitorId): Art {
  const L: Layer[] = [];
  const eye = (x: number, y: number, r = 2.6) =>
    fill(P.ink, circle(x, y, r), { shade: "flat" });
  const shine = (x: number, y: number) => fill(P.white, rect(x, y, 2, 2), flat);
  switch (id) {
    case "bramble": // a snail
      L.push(
        fill(
          P.sage,
          path(
            "M-34 26Q-30 14 -14 14H24Q34 14 34 24Q34 30 26 30H-30Q-36 30 -34 26Z",
          ),
          { shade: "rim" },
        ),
      );
      L.push(line(P.sage, 3, ["M26 14L30 0", "M32 16L38 4"], { edge: true }));
      L.push(eye(30, 0, 2.8), eye(38, 4, 2.8));
      L.push(fill(P.crust, circle(0, 0, 21), { shade: "ball", name: "shell" }));
      L.push(
        line(
          mix(P.crust, P.ink, 55),
          2.5,
          "M-12 0a12 12 0 1 0 12 -12M-5 0a5 5 0 1 0 5 -5",
          { clip: "shell" },
        ),
      );
      L.push(fill(mix(P.sage, P.tongue, 60), [ellipse(24, 22, 3, 2)], flat));
      break;
    case "lumen": // a moth
      L.push(
        fill(
          P.cream,
          [
            path("M0 4Q-34 -26 -34 4Q-30 22 0 8Z"),
            path("M0 4Q34 -26 34 4Q30 22 0 8Z"),
          ],
          { name: "w" },
        ),
      );
      L.push(
        fill(
          mix(P.cream, P.honey, 50),
          [circle(-20, -2, 6), circle(20, -2, 6)],
          { clip: "w", shade: "flat" },
        ),
      );
      L.push(
        fill(P.honey, [circle(-20, -2, 2.5), circle(20, -2, 2.5)], {
          clip: "w",
          ...flat,
        }),
      );
      L.push(
        line(mix(P.crust, P.ink, 50), 2, [
          "M-2 -10Q-8 -24 -14 -26",
          "M2 -10Q8 -24 14 -26",
        ]),
      );
      L.push(fill(P.honey, ellipse(0, 6, 6.5, 16), { shade: "ball" }));
      L.push(line(mix(P.honey, P.crust, 50), 1.5, ["M-5 8H5", "M-5 14H5"]));
      L.push(eye(-3, -4, 1.8), eye(3, -4, 1.8));
      break;
    case "tock": // a beetle
      L.push(
        line(P.ink, 2.5, [
          "M-20 24L-28 32",
          "M20 24L28 32",
          "M-26 12L-34 14",
          "M26 12L34 14",
        ]),
      );
      L.push(
        fill(P.rust, ellipse(0, 8, 26, 20), { shade: "ball", name: "shell" }),
      );
      L.push(line(mix(P.rust, P.ink, 50), 2.5, "M0 -12V28", { clip: "shell" }));
      L.push(
        fill(
          mix(P.rust, P.ink, 50),
          [
            circle(-12, 10, 4),
            circle(12, 10, 4),
            circle(-8, 20, 3),
            circle(8, 20, 3),
          ],
          { clip: "shell", ...flat },
        ),
      );
      L.push(fill(P.sage, circle(0, -14, 10.5), { shade: "ball" }));
      L.push(eye(-4, -15, 2.2), eye(4, -15, 2.2));
      break;
    case "fennel": // a frog
      L.push(
        fill(P.leaf, ellipse(0, 12, 28, 18), { shade: "ball", name: "body" }),
      );
      L.push(
        fill(mix(P.leaf, P.white, 60), ellipse(0, 18, 16, 10), {
          clip: "body",
          shade: "flat",
        }),
      );
      L.push(fill(P.leaf, [circle(-14, -6, 10.5), circle(14, -6, 10.5)]));
      L.push(
        fill(P.white, [circle(-14, -7, 6), circle(14, -7, 6)], {
          shade: "flat",
        }),
      );
      L.push(eye(-13, -6, 3), eye(15, -6, 3), shine(-14, -9), shine(14, -9));
      L.push(line(mix(P.leaf, P.ink, 40), 2.5, "M-10 12Q0 18 10 12"));
      L.push(
        fill(
          mix(P.leaf, P.tongue, 55),
          [ellipse(-18, 8, 4, 2.5), ellipse(18, 8, 4, 2.5)],
          flat,
        ),
      );
      break;
    default: // wisp, a dandelion puff
      L.push(
        fill(
          P.cream,
          path(
            "M-26 10Q-34 -6 -18 -12Q-14 -28 2 -24Q18 -30 22 -12Q36 -6 28 10Q30 26 10 24Q0 32 -10 24Q-30 26 -26 10Z",
          ),
          { shade: "ball", name: "puff" },
        ),
      );
      L.push(
        line(P.white, 2, ["M-20 -6l-4 -4", "M-6 -20l-2 -4", "M14 -18l3 -4"], {
          clip: "puff",
        }),
      );
      L.push(eye(-7, 0), eye(7, 0), shine(-8, -2), shine(6, -2));
      L.push(line(P.mouth, 2, "M-4 8Q0 11 4 8"));
      L.push(
        fill(
          mix(P.cream, P.tongue, 60),
          [ellipse(-14, 6, 4, 2.5), ellipse(14, 6, 4, 2.5)],
          flat,
        ),
      );
  }
  return { layers: L };
}
