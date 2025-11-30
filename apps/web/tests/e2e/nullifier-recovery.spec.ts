import { test, expect, type Route } from '@playwright/test';

const USER_PROFILE = {
  id: 'user-e2e',
  studentIdHash: 'hash-e2e-123',
  class: 'CSIE_3A',
  email: 'student@example.com',
  enrollmentStatus: 'ACTIVE',
};

test.describe('Nullifier recovery', () => {
  test('prompts user to re-enter secret when missing', async ({ page }) => {
    await page.route('**/users/me', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: USER_PROFILE }),
      })
    );
    await page.route('**/elections', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // First-time setup to capture nullifier secret
    await page.goto('/auth/callback?accessToken=r1&refreshToken=s1&isNewUser=1');
    await page.waitForURL('**/auth/setup');
    const secretValue = (await page.locator('[data-testid="nullifier-secret"]').textContent())?.trim() ?? '';
    expect(secretValue).toMatch(/^[0-9a-f]{64}$/);
    await page.check('#confirm');
    await page.click('button:has-text("繼續")');
    await expect(page).toHaveURL('**/');

    // Simulate device reset: clear tokens + stored secret
    await page.evaluate(() => {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('savote_secure_access_token');
      localStorage.removeItem('savote_secure_refresh_token');
      localStorage.removeItem('savote_secure_nullifier_secret');
    });

    // Second login should trigger recovery UI
    await page.goto('/auth/callback?accessToken=r2&refreshToken=s2&isNewUser=0');
    const recovery = page.locator('[data-testid="nullifier-recovery"]');
    await expect(recovery).toBeVisible();

    await page.fill('textarea#nullifier', secretValue);
    await page.click('button:has-text("確認並恢復")');
    await expect(page).toHaveURL('**/');
    await expect(page.locator('h1')).toContainText('NCU ESA 投票系統');
  });
});
