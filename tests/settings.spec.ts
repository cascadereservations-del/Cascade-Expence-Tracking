import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve(__dirname, '..', 'index.html');

test('Guides toggle hides guides', async ({ page }) => {
  await page.goto('file://' + htmlPath);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByText('Show Quick Guides').locator('input').uncheck();
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await page.getByRole('tab', { name: 'Capture' }).click();
  await expect(page.locator('#panel-capture .guide')).toBeHidden();
});
