// Renders the pet's character sheet (sheet.html) in both themes to
// docs/character-sheet-dusk.png and docs/character-sheet-dawn.png.
// Run with `npm run sheet`. Uses PLAYWRIGHT_CHROMIUM_PATH if set.

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  for (const [theme, name] of [
    ['dark', 'dusk'],
    ['light', 'dawn'],
  ]) {
    await page.goto(`http://localhost:5199/sheet.html?theme=${theme}`);
    await page.locator('.pet').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/character-sheet-${name}.png`, fullPage: true });
    console.log(`docs/character-sheet-${name}.png`);
  }
} finally {
  await browser.close();
  await server.close();
}
