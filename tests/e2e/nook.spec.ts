import { expect, test, type Page } from '@playwright/test';

/** Names the pet, warms the seedpod until it hatches. */
async function hatch(page: Page, name = 'Pip') {
  await page.goto('/');
  await page.locator('#petName').fill(name);
  await page.locator('#btnAdopt').click();
  await expect(page.locator('#statusLine')).toHaveText('Something is stirring inside.');
  for (let i = 0; i < 20; i++) await page.locator('#petButton').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText(`${name} has hatched.`);
}

test('adopts, hatches and cares for a nookling', async ({ page }) => {
  await hatch(page);
  for (const need of ['fullness', 'energy', 'mood', 'tidiness']) await expect(page.locator(`#need-${need}`)).toBeVisible();

  await page.locator('#btnFeed').click();
  await expect(page.locator('[data-food="acorn-bread"]')).toBeDisabled();
  await page.locator('[data-food="oat-cake"]').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Pip ate the oat cake.');

  await page.locator('#btnPlay').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Pip had a lovely time.');
});

test('keeps the pet across a reload', async ({ page }) => {
  await hatch(page, 'Bramble');
  await page.reload();
  await expect(page.locator('#statusLine')).toContainText('Bramble');
  await expect(page.locator('#need-fullness')).toBeVisible();
});

test('the Nook with a pet has no accessibility violations', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await hatch(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('gives food from the Pantry, drags food to the pet, and renames it', async ({ page }) => {
  await hatch(page);
  const toast = page.locator('.toast-region[role="status"]');
  await page.locator('#tabPantry').click();
  await expect(page.locator('[data-give="acorn-bread"]')).toBeDisabled();
  await page.locator('[data-give="honey-drop"]').click();
  await expect(page.locator('#tabNook')).toHaveAttribute('aria-selected', 'true');
  await expect(toast).toContainText('Pip ate the honey drop.');

  await page.locator('#btnFeed').click();
  const food = page.locator('#foodTray [data-food="berry-bowl"]');
  const from = (await food.boundingBox())!;
  const to = (await page.locator('#petButton').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(from.x + ((to.x + to.width / 2 - from.x) * i) / 10, from.y + ((to.y + to.height / 2 - from.y) * i) / 10);
  await page.mouse.up();
  await expect(toast).toContainText('Pip ate the berry bowl.');

  await page.locator('#tabSettings').click();
  await page.locator('#renameInput').fill('Pipkin');
  await page.locator('#btnRename').click();
  await expect(toast).toContainText('Hello, Pipkin.');
});
