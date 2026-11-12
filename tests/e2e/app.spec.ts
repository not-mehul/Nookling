import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#tabNook')).toHaveAttribute('aria-selected', 'true');
});

test('opens on the Nook and moves between tabs', async ({ page }) => {
  for (const tab of ['Pantry', 'Journal', 'Settings', 'Nook']) {
    await page.locator(`#tab${tab}`).click();
    await expect(page.locator(`#view${tab}`)).toBeAttached();
  }
});

test('remembers the theme across a reload', async ({ page }) => {
  await page.locator('#tabSettings').click();
  await page.locator('[data-theme-option="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const theme of ['dark', 'light'] as const) {
  test(`has no accessibility violations in ${theme === 'dark' ? 'Dusk' : 'Dawn'}`, async ({ page }) => {
    await page.locator('#tabSettings').click();
    await page.locator(`[data-theme-option="${theme}"]`).click();
    for (const tab of ['Nook', 'Pantry', 'Journal', 'Settings']) {
      await page.locator(`#tab${tab}`).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${tab}: ${v.id}`)).toEqual([]);
    }
  });
}
