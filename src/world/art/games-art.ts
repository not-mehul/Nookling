// Pixel art for the games: hiding spots, the pond, and the little things that
// fall, float and pop. Each is drawn on a box centred on 0,0.
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
import type { Art } from "../../pixel/raster";

const flat = { shade: "flat", edge: false } as const;

/** Seek: the four hiding spots, on a 60 × 60 box at 2 units a pixel. */
export function spotArt(spot: string): Art {
  switch (spot) {
    case "cushion":
      return {
        layers: [
          fill(
            P.sage,
            path(
              "M-26 6Q-28 -14 -10 -14H10Q28 -14 26 6Q28 22 10 22H-10Q-28 22 -26 6Z",
            ),
            { shade: "ball", name: "c" },
          ),
          line(
            mix(P.sage, P.ink, 65),
            2,
            ["M-16 -2Q0 2 16 -2", "M-16 12Q0 8 16 12"],
            { clip: "c" },
          ),
          fill(P.honey, circle(0, 5, 3), { shade: "flat" }),
          fill(P.sage, [
            path("M-28 -14L-22 -18L-20 -10Z"),
            path("M28 -14L22 -18L20 -10Z"),
          ]),
        ],
      };
    case "basket":
      return {
        layers: [
          line(P.crust, 4, "M-18 -6Q0 -30 18 -6", { edge: true }),
          fill(P.crust, path("M-24 -6H24L18 22H-18Z"), { name: "b" }),
          line(
            mix(P.crust, P.ink, 60),
            2,
            [
              "M-22 2H22",
              "M-21 10H21",
              "M-12 -6L-10 22",
              "M0 -6V22",
              "M12 -6L10 22",
            ],
            { clip: "b" },
          ),
          fill(mix(P.crust, P.white, 65), rect(-26, -8, 52, 5)),
          fill(P.berry, rect(10, -16, 10, 9), { shade: "rim" }),
        ],
      };
    case "teapot":
      return {
        layers: [
          line(P.cream, 5, ["M16 0Q28 -4 26 -14", "M-17 0Q-27 2 -23 12"], {
            edge: true,
          }),
          fill(P.cream, ellipse(0, 6, 18, 15), { shade: "ball", name: "pot" }),
          fill(
            P.berry,
            [circle(-8, 6, 3.5), circle(6, 10, 3.5), circle(4, -2, 2.5)],
            { clip: "pot", ...flat },
          ),
          fill(mix(P.cream, P.crust, 60), ellipse(0, -8, 11, 3.5)),
          fill(P.cream, circle(0, -12, 4.5), { shade: "ball" }),
        ],
      };
    default:
      return {
        layers: [
          fill(P.berry, rect(-24, -16, 14, 38)),
          fill(P.leaf, rect(-8, -22, 14, 44)),
          fill(P.honey, rect(8, -14, 16, 34, { r: 7 })),
          line(P.white, 2, [
            "M-21 -10H-13",
            "M-5 -16H3",
            "M-21 14H-13",
            "M-5 16H3",
          ]),
        ],
      };
  }
}

/** Fishing: the pond, line and float, on the 100 × 133 field at 2.5 units a pixel. */
export function pondArt(): Art {
  return {
    layers: [
      fill(mix(P.sky, P.ink, 70), ellipse(50, 94, 46, 22), {
        shade: "rim",
        name: "pond",
      }),
      line(
        mix(P.sky, P.white, 35),
        1.5,
        "M20 94a30 12 0 1 0 60 0a30 12 0 1 0 -60 0",
        { clip: "pond" },
      ),
      fill(
        P.white,
        [rect(30, 88, 7.5, 2.5), rect(62, 100, 10, 2.5), rect(44, 106, 5, 2.5)],
        { clip: "pond", ...flat },
      ),
      fill(P.leaf, [ellipse(18, 100, 7, 4), ellipse(84, 88, 6, 3.5)], {
        shade: "rim",
      }),
      fill(
        mix(P.leaf, P.ink, 70),
        [rect(4, 76, 2.5, 22), rect(9, 82, 2.5, 18), rect(92, 74, 2.5, 22)],
        flat,
      ),
      fill(P.rust, [rect(3, 72, 5, 7.5), rect(91, 70, 5, 7.5)], {
        shade: "flat",
      }),
    ],
  };
}
export const FISHING_LINE: Art = {
  outline: "none",
  layers: [line(P.faint, 1.2, "M22 30Q52 10 64 86")],
};
export const FLOAT_ART: Art = {
  layers: [
    fill(P.white, path("M60 86H68Q68 92 64 92Q60 92 60 86Z"), {
      shade: "flat",
    }),
    fill(P.berry, path("M60 87Q60 80 64 80Q68 80 68 87Z"), { shade: "ball" }),
  ],
};

/** A floating bubble, on a 20 × 20 box. */
export const BUBBLE_ART: Art = {
  outline: "none",
  layers: [
    fill("rgba(var(--pet-glow-rgb), 0.16)", circle(0, 0, 9.5), flat),
    line(mix(P.sky, P.white, 45), 1.2, "M0 -9a9 9 0 1 0 0.1 0"),
    fill(P.white, [rect(-6, -5, 2, 4), rect(-4, -7, 3, 2)], flat),
    fill(mix(P.berry, P.white, 50), rect(4, 3, 2, 2), flat),
  ],
};

/** A falling berry, on a 20 × 20 box. */
export const BERRY_ART: Art = {
  layers: [
    fill(P.berry, circle(0, 2, 7.5), { shade: "ball" }),
    fill(P.leaf, path("M-4 -5L0 -9L4 -5L0 -3Z")),
    fill(P.white, rect(-4, -2, 2, 2), flat),
  ],
};

/** A note in the rhythm game, on a 20 × 20 box. */
export function noteArt(hit: boolean): Art {
  const c = hit ? P.berry : P.fur;
  return {
    layers: [
      fill(c, circle(0, 0, 8.5), { shade: "ball" }),
      fill(mix(c, P.ink, 45), [rect(-3, -3, 2, 4), rect(1, -3, 2, 4)], flat),
      fill(mix(c, P.tongue, 50), [rect(-6, 1, 2, 2), rect(4, 1, 2, 2)], flat),
    ],
  };
}
