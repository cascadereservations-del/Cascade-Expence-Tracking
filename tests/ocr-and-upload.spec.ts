import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve(__dirname, '..', 'index.html');

function writeTinyPng(tmpDir: string) {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABJ2s83wAAAABJRU5ErkJggg=='; // 1x1
  const p = path.join(tmpDir, 'tiny.png');
  fs.writeFileSync(p, Buffer.from(b64, 'base64'));
  return p;
}

function writeTinyPdf(tmpDir: string) {
  // Minimal 1-page PDF bytes
  const pdfB64 = 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0vQ29udGVudHMgNCAwIFI+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCAxMDAgVGQKKChUZXN0IFBERikpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDExIDAwMDAwIG4gCjAwMDAwMDAwNjYgMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjQ2IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMjY3CiUlRU9G';
  const p = path.join(tmpDir, 'tiny.pdf');
  fs.writeFileSync(p, Buffer.from(pdfB64, 'base64'));
  return p;
}

test.beforeEach(async ({ page }) => {
  // Mock Google OAuth
  await page.addInitScript(() => {
    // @ts-ignore
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: any) => ({
            requestAccessToken() {
              setTimeout(() => cfg.callback({ access_token: 'MOCK_TOKEN', expires_in: 3600 }), 10);
            }
          })
        }
      }
    };
  });

  // Mock Tesseract recognize
  await page.addInitScript(() => {
    // @ts-ignore
    window.Tesseract = {
      recognize: async (_img: any, _lang: string, opts: any) => {
        if (opts?.logger) {
          opts.logger({ status: 'recognizing text', progress: 0.2 });
          opts.logger({ status: 'recognizing text', progress: 0.8 });
          opts.logger({ status: 'recognizing text', progress: 1.0 });
        }
        return {
          data: {
            text: 'Date: 2025-10-01\nVendor: ACME Store\nAmount: PHP 123.45\nCategory: Supplies',
            confidence: 87
          }
        };
      }
    };
  });

  // Mock PDF.js so getDocument resolves
  await page.addInitScript(() => {
    // @ts-ignore
    window.pdfjsLib = {
      GlobalWorkerOptions: {},
      getDocument: (_opts: any) => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async (_: number) => ({
            getViewport: ({ scale }: any) => ({ width: 200 * scale, height: 200 * scale }),
            render: async (_opts: any) => ({ promise: Promise.resolve() }),
          })
        })
      })
    };
  });

  // Mock fetch for Google APIs (Drive & Sheets & Gemini)
  await page.addInitScript(() => {
    const origFetch = window.fetch.bind(window);
    // @ts-ignore
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('googleapis.com/upload/drive/v3/files')) {
        return new Response(JSON.stringify({ id: 'MOCK_DRIVE_ID', name: 'expense_2025.json' }), { status: 200 });
      }
      if (url.includes('sheets.googleapis.com/v4/spreadsheets/')) {
        return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
      }
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ date: '2025-10-01', vendor: 'ACME', category: 'Supplies', amount: 123.45, currency: 'PHP' }) }] } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      try { return await origFetch(input as any, init); } catch { return new Response('', { status: 200 }); }
    };
  });
});

test('PDF Start OCR → quick-edit → Send to Form', async ({ page, tmpDir }) => {
  await page.goto('file://' + htmlPath + '?test=1');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel('Google Client ID *').fill('any.apps.googleusercontent.com');
  await page.getByText('Use Tesseract (client OCR)').locator('input').check();
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await page.getByRole('button', { name: 'Sign in to Google' }).click();
  await expect(page.getByText('Authorized ✓')).toBeVisible();

  await page.getByRole('tab', { name: 'Capture' }).click();
  const tinyPdf = writeTinyPdf(tmpDir);
  await page.locator('#fileInput').setInputFiles(tinyPdf);
  await page.getByRole('button', { name: 'Start OCR' }).click();
  await page.getByRole('button', { name: 'Send to Form' }).click();

  await expect(page.getByRole('tabpanel', { name: 'Form' })).toBeVisible();
  await expect(page.getByLabel('Date *')).toHaveValue('2025-10-01');
  await page.getByLabel('Category *').fill('Supplies');
  await page.getByLabel('Amount *').fill('123.45');
});

test('Guides are visible per tab (no button)', async ({ page }) => {
  await page.goto('file://' + htmlPath);
  await page.getByRole('tab', { name: 'Capture' }).click();
  await expect(page.locator('#panel-capture .guide')).toBeVisible();
});

test('Automatic append to Sheets on Add', async ({ page }) => {
  await page.goto('file://' + htmlPath + '?test=1');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel('Google Client ID *').fill('any.apps.googleusercontent.com');
  await page.getByLabel('Spreadsheet ID').fill('SPREADSHEET_123');
  await page.getByLabel('Sheet Name').fill('Expenses');
  await page.getByText('Append to Sheets on Add (recommended)').locator('input').check();
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await page.getByRole('button', { name: 'Sign in to Google' }).click();
  await expect(page.getByText('Authorized ✓')).toBeVisible();

  await page.getByRole('tab', { name: 'Form' }).click();
  await page.getByLabel('Date *').fill('2025-10-02');
  await page.getByLabel('Category *').fill('Utilities');
  await page.getByLabel('Amount *').fill('456.78');
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByRole('tab', { name: 'Batch' }).click();
  const recs = await page.evaluate(() => JSON.parse(localStorage.getItem('cx:records')||'[]'));
  expect(recs.at(-1).sheet_appended_at).toBeTruthy();
});
