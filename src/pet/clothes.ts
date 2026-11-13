// Clothes as pixel art, in the pet's own box (-120 to 120), on the pet's grid.
import { EYE } from "./geometry";
import { P, circle, ellipse, fill, line, mix, path, rect } from "../pixel/kit";
import type { Art, Layer } from "../pixel/raster";
import type { Outfit } from "../world/wardrobe";

const ring = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}a${r} ${r} 0 1 0 0.1 0`;

export function clothesArt(outfit: Outfit): Art {
  const L: Layer[] = [];
  const stripe = (c: string) => mix(c, P.white, 55);

  switch (outfit.neck) {
    case "scarf":
      L.push(
        fill(P.berry, path("M34 56L46 96L60 92L52 52Z"), { name: "tail" }),
      );
      L.push(
        line(stripe(P.berry), 3, ["M40 74L54 70", "M44 86L57 82"], {
          clip: "tail",
        }),
      );
      L.push(
        fill(P.berry, path("M-58 40Q0 64 58 40L60 54Q0 80 -60 54Z"), {
          name: "scarf",
        }),
      );
      L.push(
        line(stripe(P.berry), 3.5, ["M-30 50V66", "M0 55V72", "M30 50V66"], {
          clip: "scarf",
        }),
      );
      L.push(
        fill(
          mix(P.berry, P.white, 70),
          [rect(40, 94, 3, 6), rect(46, 94, 3, 6), rect(52, 92, 3, 6)],
          { shade: "flat" },
        ),
      );
      break;
    case "bow":
      L.push(
        fill(P.berry, [
          path("M0 56L-22 42Q-28 56 -22 70Z"),
          path("M0 56L22 42Q28 56 22 70Z"),
        ]),
      );
      L.push(
        line(mix(P.berry, P.ink, 60), 2.5, ["M-6 55L-18 50", "M6 55L18 50"]),
      );
      L.push(fill(P.berry, circle(0, 56, 7), { shade: "ball" }));
      break;
    case "bandana":
      L.push(fill(P.leaf, path("M-54 42Q0 60 54 42L0 84Z"), { name: "band" }));
      L.push(
        fill(
          P.white,
          [
            circle(-14, 56, 2.6),
            circle(12, 60, 2.6),
            circle(0, 70, 2.6),
            circle(-28, 52, 2.2),
            circle(28, 52, 2.2),
          ],
          { clip: "band", shade: "flat", edge: false },
        ),
      );
      break;
    case "bell":
      L.push(
        line(P.berry, 7, "M-52 46Q0 66 52 46", { edge: true, shade: "rim" }),
      );
      L.push(
        fill(P.honey, path("M-11 74Q-11 56 0 56Q11 56 11 74Z"), {
          shade: "ball",
        }),
      );
      L.push(
        fill(mix(P.honey, P.mouth, 50), rect(-12, 72, 24, 3.5), {
          shade: "flat",
        }),
      );
      L.push(fill(P.ink, circle(0, 70, 2.4), { shade: "flat", edge: false }));
      break;
  }

  switch (outfit.eyes) {
    case "round-glasses":
      L.push(
        line(mix(P.crust, P.ink, 55), 3.5, [
          ring(-EYE.x, EYE.y, 30),
          ring(EYE.x, EYE.y, 30),
          "M-4 -14Q0 -18 4 -14",
          "M-59 -14L-70 -20",
          "M59 -14L70 -20",
        ]),
      );
      L.push(
        line(P.white, 2.5, [
          `M${-EYE.x - 18} ${EYE.y - 12}l7 -7`,
          `M${EYE.x - 18} ${EYE.y - 12}l7 -7`,
        ]),
      );
      break;
    case "sunglasses":
      L.push(
        fill(
          P.ink,
          [
            path("M-58 -26H-4Q-4 4 -30 6Q-56 4 -58 -26Z"),
            path("M58 -26H4Q4 4 30 6Q56 4 58 -26Z"),
          ],
          { shade: "flat", name: "shades" },
        ),
      );
      L.push(
        line(
          mix(P.ink, P.white, 55),
          3,
          [
            "M-48 -18L-36 -18",
            "M14 -18L26 -18",
            "M-44 -10L-40 -10",
            "M18 -10L22 -10",
          ],
          { clip: "shades" },
        ),
      );
      L.push(
        line(P.ink, 3.5, ["M-4 -22H4", "M-58 -24L-70 -28", "M58 -24L70 -28"]),
      );
      break;
    case "monocle":
      L.push(line(P.honey, 3.5, ring(EYE.x, EYE.y, 30), { shade: "flat" }));
      L.push(line(mix(P.honey, P.ink, 50), 2, "M59 -6Q70 30 50 60"));
      L.push(line(P.white, 2.5, `M${EYE.x - 18} ${EYE.y - 12}l7 -7`));
      break;
  }

  switch (outfit.hat) {
    case "beret":
      L.push(
        fill(
          P.berry,
          path("M-56 -60Q-52 -96 0 -98Q54 -96 58 -62Q30 -72 -56 -60Z"),
          { shade: "ball" },
        ),
      );
      L.push(line(mix(P.berry, P.ink, 60), 4, "M2 -97L6 -108"));
      break;
    case "flower-crown":
      L.push(line(P.leaf, 4, "M-62 -48Q0 -88 62 -48", { edge: true }));
      [-48, -24, 0, 24, 48].forEach((x, i) => {
        const y = -58 - (48 - Math.abs(x)) * 0.36;
        if (i < 4) L.push(fill(P.leaf, ellipse(x + 12, y + 4, 6, 3, -30)));
        L.push(
          fill(i % 2 ? P.honey : P.berry, [
            circle(x - 5, y, 5),
            circle(x + 5, y, 5),
            circle(x, y - 5, 5),
            circle(x, y + 5, 5),
          ]),
        );
        L.push(
          fill(i % 2 ? P.berry : P.honey, circle(x, y, 3), { shade: "flat" }),
        );
      });
      break;
    case "sun-hat":
      L.push(fill(P.honey, ellipse(0, -66, 92, 16)));
      L.push(
        fill(P.honey, path("M-42 -68Q-40 -110 0 -110Q40 -110 42 -68Z"), {
          shade: "ball",
          name: "crown",
        }),
      );
      L.push(
        line(
          mix(P.honey, P.crust, 50),
          2,
          [
            "M-30 -86L-20 -100",
            "M-10 -84L0 -104",
            "M10 -84L20 -100",
            "M-60 -66L-48 -62",
            "M48 -62L60 -66",
          ],
          { clip: "crown" },
        ),
      );
      L.push(
        fill(P.berry, path("M-42 -78Q0 -70 42 -78L42 -68Q0 -60 -42 -68Z")),
      );
      L.push(fill(P.berry, [circle(34, -72, 6)], { shade: "ball" }));
      break;
    case "acorn-cap":
      L.push(
        fill(
          P.crust,
          path("M-58 -58Q-56 -104 0 -106Q56 -104 58 -58Q0 -70 -58 -58Z"),
          { shade: "ball", name: "cap" },
        ),
      );
      L.push(
        line(
          mix(P.crust, P.ink, 60),
          2.5,
          [
            "M-46 -76L-34 -86",
            "M-46 -76L-34 -66",
            "M-20 -92L-8 -82",
            "M-20 -72L-8 -82",
            "M8 -92L20 -82",
            "M8 -72L20 -82",
            "M34 -86L46 -76",
            "M34 -66L46 -76",
          ],
          { clip: "cap" },
        ),
      );
      L.push(line(mix(P.crust, P.ink, 60), 4.5, "M0 -104Q4 -116 12 -118"));
      break;
    case "woolly-hat":
      L.push(
        fill(P.sage, path("M-60 -54Q-62 -110 0 -110Q62 -110 60 -54Z"), {
          shade: "ball",
          name: "wool",
        }),
      );
      L.push(
        line(
          mix(P.sage, P.ink, 70),
          2.5,
          ["M-30 -64V-98", "M0 -64V-106", "M30 -64V-98"],
          { clip: "wool" },
        ),
      );
      L.push(fill(P.cream, rect(-64, -62, 128, 16)));
      L.push(
        line(mix(P.cream, P.ink, 75), 2, [
          "M-56 -58V-50",
          "M-40 -58V-50",
          "M-24 -58V-50",
          "M-8 -58V-50",
          "M8 -58V-50",
          "M24 -58V-50",
          "M40 -58V-50",
          "M56 -58V-50",
        ]),
      );
      L.push(fill(P.cream, circle(0, -116, 13), { shade: "ball" }));
      break;
    case "party-hat":
      L.push(
        fill(P.berry, path("M-30 -66L4 -128L34 -66Q2 -58 -30 -66Z"), {
          name: "cone",
        }),
      );
      L.push(
        line(P.honey, 5, ["M-24 -80L24 -96", "M-12 -102L16 -112"], {
          clip: "cone",
        }),
      );
      L.push(
        fill(
          P.white,
          [circle(-10, -72, 3), circle(14, -76, 3), circle(2, -90, 3)],
          { clip: "cone", shade: "flat", edge: false },
        ),
      );
      L.push(fill(P.honey, circle(4, -130, 8), { shade: "ball" }));
      break;
  }
  return { layers: L };
}
