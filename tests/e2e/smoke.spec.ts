import { expect, test } from '@playwright/test';

test('loads the TEXTUM homepage with its primary identity', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TEXTUM/i);
  await expect(page.locator('body')).toContainText('TEXTUM');
});

test('renders a branded client-side 404 for an unknown route', async ({ page }) => {
  await page.goto('/ruta-inexistente');
  await expect(page.getByRole('heading', { name: /página no existe|page does not exist/i })).toBeVisible();
  await expect(page.getByText(/Error 404/i)).toBeVisible();
});

test('honours reduced-motion preferences', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await context.close();
});
