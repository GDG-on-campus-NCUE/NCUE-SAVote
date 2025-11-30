import { test, expect } from '@playwright/test';

test('First-time user login flow', async ({ page }) => {
  // 1. Navigate to login page
  await page.goto('/auth/login');
  
  // 2. Click login button (redirects to SAML IdP - mocked)
  await page.click('button:has-text("Login")');
  
  // 3. Handle SAML callback (mocked or real if possible)
  // In E2E, we might need to mock the backend response or use a test IdP
  // For now, assume we are redirected back to callback page with tokens
  
  // 4. Verify redirection to setup page (since no nullifier secret)
  await expect(page).toHaveURL(/\/auth\/setup/);
  
  // 5. Verify nullifier secret is displayed
  const secretElement = await page.waitForSelector('[data-testid="nullifier-secret"]');
  const secretText = await secretElement.innerText();
  expect(secretText).toMatch(/^[0-9a-f]{64}$/);
  
  // 6. Confirm and save
  await page.check('input[type="checkbox"]'); // I have saved my secret
  await page.click('button:has-text("Continue")');
  
  // 7. Verify redirection to dashboard
  await expect(page).toHaveURL('/');
  await expect(page.locator('h1')).toContainText('NCU ESA 投票系統');
  
  // 8. Verify secret is in localStorage
  const storedSecret = await page.evaluate(() => {
    // Accessing secure storage might be tricky from outside if it uses closure
    // But we can check if the key exists in localStorage
    return localStorage.getItem('savote_secure_nullifier_secret');
  });
  expect(storedSecret).toBeTruthy();
});
