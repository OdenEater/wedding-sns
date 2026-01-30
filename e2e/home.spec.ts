import { test, expect } from '@playwright/test';

test('homepage smoke test', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Wedding SNS/i);
});
