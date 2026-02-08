import { expect, test } from '@playwright/test'

test('sample test', async ({ page }) => {
  await page.goto('https://google.com')
  await expect(page).toHaveTitle(/Google/)
})
