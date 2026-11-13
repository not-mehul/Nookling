// Small pixel art: foods, treasures and the gift bundle. Each is drawn on its
// own box centred on 0,0 (foods 48 across, treasures 40, the gift 60) and
// sampled at 2 units a pixel.
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
import type { Food } from "../../domain/foods";
import type { Treasure } from "../treasures";

const flat = { shade: "flat", edge: false } as const;
const steam = (xs: number[], y = -14) =>
  line(
    P.faint,
    2,
    xs.map((x) => `M${x} ${y}q-3 -4 0 -7q3 -3 0 -6`),
  );

/** A bowl, with what is in it drawn over its rim. */
function bowl(inside: Layer[]): Layer[] {
  return [
    ...inside,
    fill(P.cream, path("M-20 0H20Q18 17 0 18Q-18 17 -20 0Z"), { name: "bowl" }),
    fill(P.sky, rect(-20, 5, 40, 3), { clip: "bowl", ...flat }),
  ];
}

const tint = (c: Food["colour"]) => `var(--pet-food-${c})`;

export function foodArt(food: Food): Art {
  const c = tint(food.colour);
  switch (food.id) {
    case "milk-drop":
      return {
        layers: [
          fill(
            P.white,
            path("M0 -18Q14 -2 13 7A13 13 0 0 1 -13 7Q-14 -2 0 -18Z"),
            { shade: "ball" },
          ),
          fill(mix(P.honey, P.white, 40), ellipse(2, 10, 8, 4), { ...flat }),
          fill(P.white, rect(-7, 0, 4, 4), flat),
        ],
      };
    case "oat-cake":
      return {
        layers: [
          fill(P.crust, ellipse(0, 6, 19, 10), { name: "side" }),
          fill(mix(P.crust, P.white, 75), ellipse(0, 1, 19, 10), {
            shade: "rim",
            name: "top",
          }),
          fill(
            P.honey,
            [
              rect(-10, -2, 2, 2),
              rect(-2, -5, 2, 2),
              rect(6, 0, 2, 2),
              rect(-4, 4, 2, 2),
              rect(10, -4, 2, 2),
            ],
            { clip: "top", ...flat },
          ),
        ],
      };
    case "berry-bowl":
      return {
        layers: bowl([
          fill(
            P.berry,
            [
              circle(-10, -1, 6),
              circle(0, -5, 6.5),
              circle(10, -1, 6),
              circle(-4, 2, 5),
              circle(6, 2, 5),
            ],
            { shade: "rim" },
          ),
          fill(P.leaf, path("M0 -11Q4 -18 10 -16Q6 -10 0 -11Z")),
        ]),
      };
    case "acorn-bread":
      return {
        layers: [
          fill(
            P.crust,
            path("M-20 14Q-22 -8 -8 -12Q0 -16 8 -12Q22 -8 20 14Z"),
            { shade: "ball", name: "loaf" },
          ),
          line(
            mix(P.crust, P.white, 60),
            2.5,
            ["M-12 -2l6 -6", "M-3 -4l6 -6", "M6 -2l6 -6"],
            { clip: "loaf" },
          ),
          fill(
            mix(P.crust, P.ink, 60),
            path("M8 -14Q8 -20 14 -20Q20 -20 20 -14Z"),
          ),
          fill(P.honey, path("M9 -14H19Q19 -6 14 -6Q9 -6 9 -14Z"), {
            shade: "ball",
          }),
        ],
      };
    case "moss-soup":
      return {
        layers: [
          steam([-6, 4], -10),
          ...bowl([
            fill(P.leaf, ellipse(0, 0, 18, 6), { shade: "flat", name: "soup" }),
            fill(
              mix(P.leaf, P.white, 55),
              [rect(-8, -3, 4, 2), rect(4, -1, 4, 2)],
              { clip: "soup", ...flat },
            ),
          ]),
        ],
      };
    case "clover-salad":
      return {
        layers: bowl([
          fill(P.leaf, [
            circle(-10, -3, 5),
            circle(-5, -8, 5),
            circle(4, -6, 5),
            circle(10, -2, 5),
            circle(0, -1, 5),
          ]),
          fill(
            mix(P.leaf, P.ink, 70),
            [circle(-5, -8, 1.5), circle(4, -6, 1.5)],
            flat,
          ),
          fill(P.berry, [circle(7, -9, 2.5)], { shade: "flat" }),
        ]),
      };
    case "pear-slice":
      return {
        layers: [
          fill(P.honey, path("M-18 12Q-16 -16 14 -18Q20 2 -18 12Z"), {
            name: "skin",
          }),
          fill(
            mix(P.honey, P.white, 40),
            path("M-13 8Q-11 -11 10 -13Q14 0 -13 8Z"),
            { ...flat, name: "flesh" },
          ),
          fill(
            P.mouth,
            [ellipse(-1, -1, 2, 3, 40), ellipse(4, -5, 2, 3, 40)],
            flat,
          ),
        ],
      };
    case "plum":
      return {
        layers: [
          line(mix(P.crust, P.ink, 60), 2.5, "M1 -12Q2 -18 6 -20"),
          fill(
            P.berry,
            path("M0 -12Q16 -16 16 4Q16 18 0 18Q-16 18 -16 4Q-16 -16 0 -12Z"),
            { shade: "ball" },
          ),
          line(mix(P.berry, P.ink, 55), 2, "M0 -10Q-4 2 0 14"),
          fill(P.leaf, path("M4 -16Q12 -24 20 -18Q12 -12 4 -16Z")),
        ],
      };
    case "pumpkin-seeds":
      return {
        layers: [
          fill(
            P.cream,
            [
              ellipse(-8, 4, 6, 9, -20),
              ellipse(6, -4, 6, 9, 15),
              ellipse(9, 11, 5, 8, 70),
            ],
            { shade: "rim" },
          ),
          fill(
            mix(P.cream, P.honey, 50),
            [ellipse(-8, 4, 3, 6, -20), ellipse(6, -4, 3, 6, 15)],
            flat,
          ),
        ],
      };
    case "cheese-crumb":
      return {
        layers: [
          fill(P.honey, path("M-18 10L14 -14L18 10Z"), { name: "wedge" }),
          fill(
            mix(P.honey, P.white, 50),
            path("M-18 10L14 -14L16 -12L-14 10Z"),
            { clip: "wedge", ...flat },
          ),
          fill(
            mix(P.honey, P.crust, 50),
            [circle(6, 2, 3), circle(12, -6, 2), circle(-2, 7, 2)],
            { clip: "wedge", ...flat },
          ),
        ],
      };
    case "honey-drop":
      return {
        layers: [
          fill(
            P.honey,
            path("M0 -18Q14 -2 13 7A13 13 0 0 1 -13 7Q-14 -2 0 -18Z"),
            { shade: "ball" },
          ),
          fill(P.white, [rect(-7, 0, 3, 5), rect(-4, -4, 2, 3)], flat),
        ],
      };
    case "star-jelly":
      return {
        layers: [
          fill(P.cream, ellipse(0, 14, 20, 5)),
          fill(
            P.berry,
            path("M0 -18L5 -6L18 -5L8 3L11 15L0 9L-11 15L-8 3L-18 -5L-5 -6Z"),
            { shade: "ball" },
          ),
          fill(P.white, [rect(-5, -6, 2, 4), rect(-3, -8, 2, 2)], flat),
        ],
      };
    case "mint-sprig":
      return {
        layers: [
          line(mix(P.leaf, P.ink, 60), 2.5, "M0 18V-14"),
          fill(P.leaf, [
            path("M0 6Q-18 4 -16 -8Q-4 -6 0 6Z"),
            path("M0 0Q18 -2 16 -14Q4 -12 0 0Z"),
            path("M0 -10Q-10 -20 0 -22Q10 -20 0 -10Z"),
          ]),
          line(mix(P.leaf, P.white, 55), 1.5, ["M-2 4L-12 -4", "M2 -2L12 -10"]),
        ],
      };
    case "strawberry":
      return {
        layers: [
          fill(P.berry, path("M-16 -6Q0 -14 16 -6Q14 12 0 20Q-14 12 -16 -6Z"), {
            shade: "ball",
            name: "berry",
          }),
          fill(
            P.honey,
            [
              rect(-8, -2, 2, 2),
              rect(2, -4, 2, 2),
              rect(8, 2, 2, 2),
              rect(-4, 6, 2, 2),
              rect(4, 10, 2, 2),
              rect(-10, 4, 2, 2),
            ],
            { clip: "berry", ...flat },
          ),
          fill(
            P.leaf,
            path("M-12 -8L-4 -10L0 -16L4 -10L12 -8L4 -6L0 -2L-4 -6Z"),
          ),
        ],
      };
    case "pea-pod":
      return {
        layers: [
          fill(P.leaf, path("M-20 6Q-10 -14 18 -10Q14 10 -20 6Z"), {
            name: "pod",
          }),
          fill(
            mix(P.leaf, P.white, 70),
            [circle(-8, 0, 4.5), circle(1, -3, 4.5), circle(10, -5, 4.5)],
            { clip: "pod", shade: "ball" },
          ),
          line(mix(P.leaf, P.ink, 60), 2.5, "M18 -10Q20 -16 16 -18"),
        ],
      };
    case "baby-carrot":
      return {
        layers: [
          fill(P.leaf, [
            path("M2 -10Q-6 -22 -2 -24Q4 -18 2 -10Z"),
            path("M2 -10Q8 -24 14 -20Q8 -14 2 -10Z"),
          ]),
          fill(P.honey, path("M-6 -12Q4 -16 10 -8L-14 18Z"), { name: "root" }),
          line(mix(P.honey, P.crust, 40), 1.5, ["M-2 -4l4 2", "M-6 4l4 2"], {
            clip: "root",
          }),
        ],
      };
    case "little-pumpkin":
      return {
        layers: [
          line(mix(P.leaf, P.ink, 50), 3.5, "M0 -10Q0 -16 5 -18"),
          fill(P.honey, [ellipse(-8, 4, 10, 12), ellipse(8, 4, 10, 12)]),
          fill(P.honey, ellipse(0, 4, 9, 13), { shade: "ball" }),
          fill(P.leaf, path("M2 -14Q10 -20 16 -14Q10 -10 2 -14Z")),
        ],
      };
  }
  // A dish from a sibling app, or a food with no picture of its own: by kind.
  switch (food.kind) {
    case "meal":
      return {
        layers: [
          steam([-6, 3], -12),
          ...bowl([fill(c, ellipse(0, 0, 17, 9), { shade: "ball" })]),
        ],
      };
    case "fruit":
      return {
        layers: [
          fill(c, [circle(-6, 4, 11), circle(8, 7, 9)], { shade: "ball" }),
          fill(P.leaf, path("M2 -10Q10 -20 18 -14Q10 -6 2 -10Z")),
        ],
      };
    case "snack":
      return {
        layers: [
          fill(
            c,
            [
              ellipse(-9, 4, 7, 9, -20),
              ellipse(5, -4, 7, 9, 15),
              ellipse(9, 11, 6, 8, 70),
            ],
            { shade: "rim" },
          ),
        ],
      };
    default:
      return {
        layers: [
          fill(c, path("M0 -18Q14 -2 13 7A13 13 0 0 1 -13 7Q-14 -2 0 -18Z"), {
            shade: "ball",
          }),
          fill(P.white, rect(-7, 0, 3, 5), flat),
        ],
      };
  }
}

const TREASURE_FILL: Record<Treasure["colour"], string> = {
  berry: P.berry,
  leaf: P.leaf,
  crust: P.crust,
  honey: P.honey,
  sage: P.sage,
  cream: P.cream,
  rust: P.rust,
  fur: "var(--pet-fur)",
};

export function treasureArt(treasure: Treasure, hidden = false): Art {
  const f = TREASURE_FILL[treasure.colour];
  const dark = mix(f, P.ink, 55);
  const light = mix(f, P.white, 45);
  const L: Layer[] = [];
  switch (treasure.shape) {
    case "shell":
      L.push(
        fill(
          f,
          path(
            "M0 15C-12 15 -16 4 -14 -4Q-10 -15 0 -16Q10 -15 14 -4C16 4 12 15 0 15Z",
          ),
          { shade: "ball", name: "s" },
        ),
        line(
          dark,
          1.6,
          ["M0 14V-14", "M-7 13Q-9 0 -6 -13", "M7 13Q9 0 6 -13"],
          { clip: "s" },
        ),
        fill(f, rect(-5, 12, 10, 5)),
      );
      break;
    case "button":
      L.push(
        fill(f, circle(0, 0, 14), { shade: "ball" }),
        line(dark, 1.6, "M0 -10a10 10 0 1 0 0.1 0"),
        fill(
          dark,
          [
            circle(-3.5, -3.5, 2),
            circle(3.5, -3.5, 2),
            circle(-3.5, 3.5, 2),
            circle(3.5, 3.5, 2),
          ],
          flat,
        ),
      );
      break;
    case "leaf":
      L.push(
        fill(f, path("M-13 13Q-16 -10 13 -14Q14 10 -13 13Z"), { name: "l" }),
        line(dark, 1.6, ["M-13 13L8 -8", "M-4 4L-4 -4", "M2 -2L7 2"], {
          clip: "l",
        }),
      );
      break;
    case "pebble":
      L.push(
        fill(
          f,
          path("M-15 3Q-15 -10 -2 -11Q13 -12 15 0Q15 11 0 11Q-15 12 -15 3Z"),
          { shade: "ball" },
        ),
        fill(light, [rect(-8, -6, 6, 2)], flat),
      );
      break;
    case "key":
      L.push(
        fill(f, path("M-3 -2L13 12L10 15L7 12L5 14L3 12L5 10L-6 0Z")),
        fill(f, circle(-8, -6, 7.5), { shade: "ball" }),
        fill(mix(f, P.ink, 30), circle(-8, -6, 2.5), flat),
      );
      break;
    case "feather":
      L.push(
        fill(f, path("M-12 15Q-14 -4 12 -16Q10 6 -12 15Z"), { name: "fe" }),
        line(light, 1.4, ["M-6 6L-10 2", "M0 0L-3 -5", "M2 4L7 2"], {
          clip: "fe",
        }),
        line(dark, 1.8, "M-14 17L10 -13"),
      );
      break;
    case "marble":
      L.push(
        fill(f, circle(0, 0, 13), { shade: "ball", name: "m" }),
        line(light, 2, ["M-8 6Q-2 -6 9 -4"], { clip: "m" }),
        line(dark, 2, ["M-6 -8Q2 2 6 9"], { clip: "m" }),
        fill(P.white, rect(-7, -8, 3, 3), flat),
      );
      break;
    case "acorn":
      L.push(
        fill(f, path("M-10 -2Q-10 14 0 16Q10 14 10 -2Z"), { shade: "ball" }),
        fill(P.crust, path("M-13 -1Q-13 -12 0 -12Q13 -12 13 -1Z"), {
          name: "cap",
        }),
        line(
          mix(P.crust, P.ink, 55),
          1.4,
          ["M-8 -4L-4 -10", "M-2 -4L2 -10", "M4 -4L8 -10"],
          { clip: "cap" },
        ),
        line(mix(P.crust, P.ink, 55), 2.4, "M0 -12V-16"),
      );
      break;
    case "clover":
      L.push(
        line(dark, 2, "M0 0Q4 10 10 16"),
        fill(f, [
          circle(-6, -6, 6),
          circle(6, -6, 6),
          circle(-6, 6, 6),
          circle(6, 6, 6),
        ]),
        fill(
          light,
          [
            rect(-8, -8, 2, 2),
            rect(4, -8, 2, 2),
            rect(-8, 4, 2, 2),
            rect(4, 4, 2, 2),
          ],
          flat,
        ),
      );
      break;
    case "cap":
      L.push(
        fill(
          f,
          path(
            "M-14 0L-12 -4L-14 -8L-9 -10L-8 -14L-3 -13L0 -16L3 -13L8 -14L9 -10L14 -8L12 -4L14 0L12 4L14 8L9 10L8 14L3 13L0 16L-3 13L-8 14L-9 10L-14 8L-12 4Z",
          ),
          { shade: "ball" },
        ),
        line(dark, 1.6, "M0 -7a7 7 0 1 0 0.1 0"),
      );
      break;
    case "ribbon":
      L.push(
        fill(f, [
          path("M-2 1L-9 15L-5 13L-3 16L0 3Z"),
          path("M2 1L9 15L5 13L3 16L0 3Z"),
        ]),
        fill(f, [
          path("M0 0Q-12 -14 -15 -6Q-14 4 0 0Z"),
          path("M0 0Q12 -14 15 -6Q14 4 0 0Z"),
        ]),
        fill(f, circle(0, 0, 3.5), { shade: "flat" }),
      );
      break;
    case "star":
      L.push(
        fill(
          f,
          path("M0 -15L4 -5L15 -4L6 3L9 14L0 8L-9 14L-6 3L-15 -4L-4 -5Z"),
          { shade: "ball" },
        ),
      );
      break;
    case "glass":
      L.push(
        fill(f, path("M-12 -6L-4 -14L10 -10L14 4L4 14L-10 10Z"), {
          shade: "rim",
          name: "g",
        }),
        line(P.white, 2.4, ["M-6 -6L2 -9", "M6 6L8 2"], { clip: "g" }),
      );
      break;
    case "coin":
      L.push(
        fill(f, circle(0, 0, 14), { shade: "ball" }),
        line(dark, 1.6, [
          "M0 -10.5a10.5 10.5 0 1 0 0.1 0",
          "M-3 -5H3",
          "M0 -5V6",
          "M-4 6H4",
        ]),
      );
      break;
    case "thimble":
      L.push(
        fill(f, path("M-10 14L-8 -8Q-8 -14 0 -14Q8 -14 8 -8L10 14Z"), {
          shade: "ball",
          name: "t",
        }),
        fill(
          dark,
          [
            circle(-3, -6, 1.3),
            circle(3, -6, 1.3),
            circle(0, -1, 1.3),
            circle(-4, 4, 1.3),
            circle(4, 4, 1.3),
          ],
          { clip: "t", ...flat },
        ),
        fill(mix(f, P.white, 60), rect(-11, 9, 22, 4)),
      );
      break;
    case "flower":
      L.push(
        fill(
          f,
          [0, 72, 144, 216, 288].map((a) =>
            ellipse(
              8 * Math.sin((a * Math.PI) / 180),
              -8 * Math.cos((a * Math.PI) / 180),
              5.5,
              7.5,
              a,
            ),
          ),
        ),
        fill(P.honey, circle(0, 0, 4.5), { shade: "ball" }),
      );
      break;
    case "snowflake":
      L.push(
        line(
          f,
          3,
          [
            "M0 -15V15",
            "M-13 -7.5L13 7.5",
            "M-13 7.5L13 -7.5",
            "M-4 -12L0 -8L4 -12",
            "M-4 12L0 8L4 12",
          ],
          { edge: true },
        ),
      );
      break;
    default:
      L.push(
        fill(f, ellipse(0, 0, 11, 14), { shade: "ball", name: "egg" }),
        fill(
          dark,
          [
            circle(-4, -4, 1.6),
            circle(3, 2, 1.3),
            circle(-2, 7, 1.5),
            circle(5, -7, 1.1),
          ],
          { clip: "egg", ...flat },
        ),
      );
  }
  if (hidden)
    return {
      outline: P.soft,
      layers: L.map((l) => ({
        ...l,
        fill: P.soft,
        shade: "flat",
        edge: false,
      })),
    };
  return { layers: L };
}

export const GIFT_ART: Art = {
  layers: [
    fill(
      P.leaf,
      path("M-22 -2Q-24 20 0 24Q24 20 22 -2Q12 -10 0 -6Q-12 -10 -22 -2Z"),
      { shade: "ball", name: "wrap" },
    ),
    line(
      mix(P.leaf, P.ink, 60),
      2,
      ["M0 -6V24", "M-14 4L-4 10", "M14 4L4 10"],
      { clip: "wrap" },
    ),
    line(P.honey, 3.5, "M-21 2Q0 12 21 2", { clip: "wrap" }),
    fill(P.honey, [
      path("M-1 -6Q-16 -22 -18 -12Q-14 -4 -1 -6Z"),
      path("M1 -6Q16 -22 18 -12Q14 -4 1 -6Z"),
    ]),
    fill(P.honey, circle(0, -6, 4), { shade: "ball" }),
  ],
};
