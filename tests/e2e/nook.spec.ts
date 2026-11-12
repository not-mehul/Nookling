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

});

test('plays Echo, takes a picture and finds both in the Journal', async ({ page }) => {
  await hatch(page);
  const toast = page.locator('.toast-region[role="status"]');
  await page.locator('#btnPlay').click();
  await page.locator('[data-game="echo"]').click();
  // A wrong move ends the game at once; the score still counts as play.
  await expect(page.locator('[data-move="spin"]')).toBeEnabled({ timeout: 10_000 });
  for (const move of ['spin', 'spin', 'spin']) {
    if (await page.locator('[data-move="spin"]').isEnabled()) await page.locator(`[data-move="${move}"]`).click();
  }
  await expect(toast).toContainText('Pip had a lovely time.', { timeout: 10_000 });

  await page.locator('#btnPicture').click();
  await expect(toast).toContainText('Picture saved to the Journal.');

  await page.locator('#tabJournal').click();
  await expect(page.locator('#journalAbout')).toContainText('About Pip');
  await expect(page.locator('#journalMilestones')).toContainText('Hatched.');
  await expect(page.locator('#journalAlbum img')).toHaveCount(1);
  await expect(page.locator('#journalLog [data-kind="played"]')).toContainText('Played echo.');
});

test('hide and seek runs five rounds', async ({ page }) => {
  await hatch(page);
  await page.locator('#btnPlay').click();
  await page.locator('[data-game="seek"]').click();
  for (let round = 0; round < 5; round++) {
    await expect(page.locator('[data-spot="cushion"]')).toBeEnabled({ timeout: 5_000 });
    await page.locator('[data-spot="cushion"]').click();
  }
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Pip had a lovely time.', { timeout: 10_000 });
});

test('backs up and restores', async ({ page }) => {
  await hatch(page, 'Moss');
  await page.locator('#tabSettings').click();
  const download = page.waitForEvent('download');
  await page.locator('#btnBackup').click();
  const file = await (await download).path();
  await expect(page.locator('#panelData')).toContainText('Last backed up');

  await page.locator('#renameInput').fill('Fern');
  await page.locator('#renameInput').press('Enter');
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Hello, Fern.');

  await page.locator('#restoreFile').setInputFiles(file);
  await expect(page.locator('#btnRestoreConfirm')).toBeVisible();
  await page.locator('#btnRestoreConfirm').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Moss is home.');
  await page.locator('#tabNook').click();
  await expect(page.locator('#statusLine')).toContainText('Moss');
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

test('leaves the pet with a sitter and brings it home', async ({ page }) => {
  await hatch(page);
  await page.locator('#tabSettings').click();
  await page.locator('#awayDays').selectOption('2');
  await page.locator('#btnAway').click();
  await page.locator('#tabNook').click();
  await expect(page.locator('#statusLine')).toHaveText('Pip is with the sitter, well looked after.');
  await page.locator('#btnComeBackNook').click();
  await expect(page.locator('#need-fullness')).toBeVisible();
});

test('easter eggs: the Konami code, the title and a sibling’s name', async ({ page }) => {
  await hatch(page, 'Mise');
  const toast = page.locator('.toast-region[role="status"]');
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(key);
  await expect(toast).toContainText('Mise does a somersault.');
  for (let i = 0; i < 7; i++) await page.locator('h1').click();
  await expect(toast).toContainText('Achoo.');
  await expect(page.locator('.prop.hat')).toHaveCount(1);
  await page.locator('#tabSettings').click();
  await expect(page.locator('#eggCount')).toHaveText('Easter eggs found: 3 of 4.');
  await page.locator('#renameInput').fill('Rosetta');
  await page.locator('#renameInput').press('Enter');
  await expect(toast).toContainText('in honour of Rosetta');
});
