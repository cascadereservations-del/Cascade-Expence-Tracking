import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { headless: true, baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npx http-server -c-1 -p 5173 .',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
