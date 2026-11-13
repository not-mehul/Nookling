// Renders the pet's character sheet (sheet.html) and the art sheet
// (art.html) in both themes to docs/character-sheet-*.png and
// docs/art-sheet-*.png.
// Run with `npm run sheet`. Uses PLAYWRIGHT_CHROMIUM_PATH if set.

import { chromium } from "@playwright/test";
import { createServer } from "vite";

const server = await createServer({
  server: { port: 5199, strictPort: true },
  logLevel: "error",
});
await server.listen();
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  for (const [theme, name] of [
    ["dark", "dusk"],
    ["light", "dawn"],
  ]) {
    for (const [html, file] of [
      ["sheet.html", `docs/character-sheet-${name}.png`],
      ["art.html", `docs/art-sheet-${name}.png`],
    ]) {
      await page.goto(`http://localhost:5199/${html}?theme=${theme}`);
      await page.locator("svg").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
