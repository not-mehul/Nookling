import { expect, test, type Page } from '@playwright/test';

// The pet sleeps from 22:30 to 07:00 by default, and care is refused while it
// does, so every test runs at midday whatever the real time is.
test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime(process.env.E2E_TIME ? new Date(process.env.E2E_TIME) : new Date(2026, 10, 12, 12, 0));
});

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
  await page.locator('[data-backdrop="night"]').click();
  await page.locator('[data-pose="cheeky"]').click();
  await page.locator('[data-sticker="star"]').click();
  await page.locator('#btnSnap').click();
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

test('cozy: back after a while, it is caught in a moment and has a find to open', async ({ page }) => {
  await hatch(page);
  await expect(page.locator('#btnGift')).toHaveCount(0);
  // Four hours later, in the afternoon.
  await page.clock.setSystemTime(new Date(2026, 10, 12, 16, 5));
  await page.reload();
  await expect(page.locator('#statusLine')).not.toContainText('content', { timeout: 5000 });
  await page.locator('#btnGift').click();
  await expect(page.locator('#foundCard')).toBeVisible();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Treasures book');
  await page.locator('#tabJournal').click();
  await expect(page.locator('#journalTreasures [data-treasure]')).toHaveCount(1);
  await expect(page.locator('#journalMoments li')).toHaveCount(1, { timeout: 8000 });

  await page.locator('#tabSettings').click();
  await expect(page.locator('[data-style-option="cozy"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#switchGentle')).toHaveCount(0);
  await page.locator('[data-style-option="tamagotchi"]').click();
  await expect(page.locator('#switchGentle')).toBeAttached();
});

test('the arcade: nine games, a game of the day, and a quick pebble stack', async ({ page }) => {
  await hatch(page);
  await page.locator('#btnPlay').click();
  await expect(page.locator('[data-game]')).toHaveCount(9);
  await expect(page.locator('#dailyBadge')).toHaveText('Game of the day');
  await page.locator('[data-game="stack"]').click();
  const field = page.locator('#stackField');
  await field.focus();
  // Drop at once: the first pebble starts at the far left and misses, which ends it.
  for (let i = 0; i < 20 && (await field.isVisible()); i++) await page.keyboard.press('Enter');
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Pip had a lovely time.', { timeout: 10_000 });
});

test('teaches a trick, chats, and fidgets', async ({ page }) => {
  await hatch(page);
  const toast = page.locator('.toast-region[role="status"]');

  await page.locator('#btnTricks').click();
  await page.locator('[data-trick="bounce"]').click();
  const pad = page.locator('#trickPad');
  await pad.focus();
  for (let lesson = 0; lesson < 3; lesson++) {
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#trickLine')).not.toHaveText('');
    await page.waitForTimeout(150);
  }
  await expect(toast).toContainText('Pip learned Bounce!');
  await page.keyboard.press('Escape');

  await page.locator('#btnChat').click();
  await expect(page.locator('#chatBubble')).toBeVisible();
  await page.locator('[data-reply="1"]').click();
  await expect(page.locator('#chatBubble')).toHaveCount(0);
  await expect(page.locator('#statusLine')).not.toHaveText('');

  await page.locator('#btnFidget').click();
  const blob = page.locator('#fidgetField');
  await expect(blob).toBeVisible();
  await page.waitForTimeout(500); // the sheet rising
  const box = (await blob.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText('1 boing', { exact: true })).toBeVisible();
});

test('decorates the nook, dresses up, and plants the garden', async ({ page }) => {
  await hatch(page);
  await page.locator('#btnDecorate').click();
  await expect(page.locator('#decorPanel')).toBeVisible();
  await expect(page.locator('[data-decor-option="ball"]')).toBeDisabled();
  await page.locator('[data-decor-option="rug"]').click();
  const rug = page.locator('.decor-layer [data-decor="rug"]');
  await expect(rug).toBeVisible();
  await rug.focus();
  await page.keyboard.press('ArrowUp');
  await page.locator('#btnDecorDone').click();
  await expect(page.locator('#decorPanel')).toHaveCount(0);
  await expect(page.locator('.decor-layer [data-decor="rug"]')).toBeVisible();

  await page.locator('#btnWardrobe').click();
  await page.locator('[data-clothes="beret"]').click();
  await expect(page.locator('[data-clothes="beret"]')).toHaveAttribute('aria-pressed', 'true');
  // Autumn, so the acorn cap is out and the woolly hat waits for winter.
  await expect(page.locator('[data-clothes="acorn-cap"]')).toBeEnabled();
  await expect(page.locator('[data-clothes="woolly-hat"]')).toBeDisabled();
  await page.keyboard.press('Escape');

  await page.locator('#tabPantry').click();
  await page.locator('[data-sow="0"]').click();
  await page.locator('[data-seed="mint"]').click();
  await expect(page.locator('[data-plot="0"]')).toContainText('Mint');
  await expect(page.locator('[data-plot="0"]')).toContainText('Ripe in 2 hours');

  await page.reload();
  await page.locator('#tabPantry').click();
  await expect(page.locator('[data-plot="0"]')).toContainText('Mint');
});

test('quiet time: the window, breathing and a bedtime story', async ({ page }) => {
  await hatch(page);
  await page.locator('#btnQuiet').click();
  await expect(page.locator('#quietWindow')).toHaveAttribute('data-sky', 'day');
  await expect(page.locator('#quietLine')).toContainText('Pip');
  await page.locator('[data-quiet="breathe"]').click();
  await page.locator('#btnBreathe').click();
  await expect(page.locator('#breatheLine')).toHaveText('Breathe in…');
  await page.locator('[data-quiet="story"]').click();
  await expect(page.locator('#btnTell')).toBeDisabled();
  for (const w of ['who:owl', 'where:attic', 'what:map']) await page.locator(`[data-word="${w}"]`).click();
  await page.locator('#btnTell').click();
  await expect(page.locator('#storyText')).toContainText('a sleepy owl');
  await page.locator('#btnTuckIn').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Pip is tucked in.');
  await expect(page.locator('#btnLights')).toContainText('Lights on');
});

test('a visitor drops by, and a favour brings a find', async ({ page }) => {
  await hatch(page);
  // Seat a visitor, as if one came while the app was closed.
  await page.evaluate(async () => {
    const req = indexedDB.open('nookling');
    const db: IDBDatabase = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tx = db.transaction('world', 'readwrite');
    const store = tx.objectStore('world');
    const w = await new Promise<Record<string, unknown>>((r) => {
      const g = store.get('world');
      g.onsuccess = () => r(g.result);
    });
    store.put({ ...w, visit: { id: 'bramble', at: Date.now(), favour: { food: 'pear-slice' } }, visitors: { bramble: { met: 1, favours: 0 } } });
    await new Promise((r) => (tx.oncomplete = r));
  });
  await page.reload();
  await page.locator('#btnVisitor').click();
  await expect(page.locator('#visitorCard')).toContainText('Bramble the snail dropped by');
  await page.locator('#btnFavour').click();
  await expect(page.locator('.toast-region[role="status"]')).toContainText('Bramble the snail says thank you');
  await expect(page.locator('#btnGift')).toBeVisible();
  await page.locator('#tabJournal').click();
  await expect(page.locator('#journalVisitors')).toContainText('Bramble the snail');
});
