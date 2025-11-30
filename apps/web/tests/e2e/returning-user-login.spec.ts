import { test, expect, type Route } from '@playwright/test';

const USER_PROFILE = {
  id: 'user-e2e',
  studentIdHash: 'hash-e2e-123',
  class: 'CSIE_3A',
  email: 'student@example.com',
  enrollmentStatus: 'ACTIVE',
};

test.describe('Returning user login', () => {
  test('skips setup when nullifier secret exists locally', async ({ page }) => {
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

    // First-time login to generate secret
    await page.goto('/auth/callback?accessToken=token-a&refreshToken=token-b&isNewUser=1');
    await page.waitForURL('**/auth/setup');

    const secretElement = page.locator('[data-testid="nullifier-secret"]');
    const secretValue = (await secretElement.textContent())?.trim() ?? '';
    expect(secretValue).toMatch(/^[0-9a-f]{64}$/);

    await page.check('input#confirm');
    await page.click('button:has-text("繼續")');
    await expect(page).toHaveURL('**/');

    // Simulate sign-out but keep secret in secure storage
    await page.evaluate(() => {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('savote_secure_access_token');
      localStorage.removeItem('savote_secure_refresh_token');
    });

    // Second login should detect stored secret and redirect straight to dashboard
    await page.goto('/auth/callback?accessToken=token-c&refreshToken=token-d&isNewUser=0');
    await expect(page).toHaveURL('**/');
    await expect(page.locator('h1')).toContainText('NCU ESA 投票系統');

    // Secret still present for future sessions
    const storedSecret = await page.evaluate(() => localStorage.getItem('savote_secure_nullifier_secret'));
    expect(storedSecret).toBeTruthy();
  });
});
