const { test, expect } = require('@playwright/test');

test('index.html loads and submits form', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../index.html');
  await page.fill('#job-title', 'Frontend Developer');
  await page.click('#submitBtn');
  const alertText = await page.evaluate(() => alertText); // Intercept alert (if any)
  expect(alertText).toContain('Job saved');
});
