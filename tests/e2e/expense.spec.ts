import { test, expect } from '@playwright/test';

test('add manual expense and see in preview', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('input[name="date"]').fill('2025-10-21');
  await page.locator('input[name="vendor"]').fill('NETFLIX');
  await page.locator('input[name="category"]').fill('Subscriptions – Netflix');
  await page.locator('input[name="amount"]').fill('449');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.locator('#recordCount')).toHaveText('1');
  await expect(page.locator('#previewTable tr')).toHaveCount(1);
});
