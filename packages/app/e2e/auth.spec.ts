import { expect, test } from '@playwright/test'

const randomString = Math.random().toString(36).substring(7)
const email = `test.user.${randomString}@example.com`
const password = 'Password123!'

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register')

    // Fill registration form
    await page.getByLabel('First name').fill('Test')
    await page.getByLabel('Last name').fill('User')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password').fill(password)

    // Listen to browser console logs
    page.on('console', (_msg) => {})

    // Accept consents
    const tos = page.getByLabel(/I accept the Terms of Service/i)
    const privacy = page.getByLabel(/I accept the Privacy Policy/i)

    await tos.check({ force: true })
    await privacy.check({ force: true })

    // Verify they are checked
    await expect(tos).toBeChecked()
    await expect(privacy).toBeChecked()

    await page.getByRole('button', { name: 'Create account' }).click()

    // Debugging: Check for errors if redirect doesn't happen quickly
    try {
      await expect(page).toHaveURL('/', { timeout: 3000 })
    } catch (e) {
      const _errors = await page.locator('.text-red-500, .text-red-400, .form-error').allTextContents()
      await page.screenshot({ path: 'auth-failure.png' })
      throw e
    }
    // Check for a logout button or user profile to confirm login state
    // Simple check: cookie set? or maybe text on page.
    // Let's check if we can see the "Schedule" link which is likely only for logged in users
    // OR check that we are NOT on register page anymore.
  })

  test('should login with existing user', async ({ page }) => {
    // We reuse the user created in the previous test?
    // Tests might run in parallel or order is not guaranteed if we don't configure it.
    // For stability, it is better to create a new user for login test OR rely on a seeded user.
    // Since I don't have a seeder yet, I'll register a NEW user for this test specifically to be safe,
    // or just assume the previous one exists if I run them serially.
    // Actually, let's just use the same email/password from top of file, but we need to ensure run order.
    // Playwright runs files in parallel but tests within a file in order by default unless fullyParallel is on.
    // "fullyParallel: true" is in the config I created. So they run in parallel.
    // I should probably make them independent.

    const loginEmail = `login.test.${Math.random().toString(36).substring(7)}@example.com`

    // Register first to have a user to login with
    await page.goto('/register')
    await page.getByLabel('First name').fill('Login')
    await page.getByLabel('Last name').fill('Tester')
    await page.getByLabel('Email address').fill(loginEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByLabel(/I accept the Terms of Service/i).check()
    await page.getByLabel(/I accept the Privacy Policy/i).check()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL('/')

    // Now Logout (if there is a logout button, or just clear cookies)
    await page.context().clearCookies()
    await page.goto('/login')

    // Perform Login
    await page.getByLabel('Email address').fill(loginEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).not.toHaveURL('/login')
    // await expect(page).toHaveURL('/schedule'); // or /dashboard depending on role
  })
})
