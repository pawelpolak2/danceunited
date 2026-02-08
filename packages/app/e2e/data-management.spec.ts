import { execSync } from 'child_process'
import { expect, test } from '@playwright/test'

const managerEmail = `manager.${Math.random().toString(36).substring(7)}@example.com`
const password = 'Password123!'

test.describe('Data Management', () => {
  test.describe.configure({ mode: 'serial' })

  // ... setup

  // Setup: Create a manager user
  test.beforeAll(async () => {
    // Create a user via Prisma
    // We need to hash the password.
    // Importing hashPassword from app/src/lib/auth.server might be tricky due to dependencies.
    // It's easier to just create a user with a known hash or register via UI and update role.
    // Let's use UI registration for simplicity and then update role via Prisma.
    // Actually, we can't use UI in beforeAll easily because it doesn't give us 'page'.
    // We can do it in a setup step or just inside the first test.
    // Or we can use a separate setup project in Playwright.
    // For now, let's just do it inside the test or use a helper.
  })

  test('should allow manager to create and edit a user', async ({ page }) => {
    // 1. Register a new user to become manager
    // 1. Register a new user to become manager
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    const randomSuffix = Math.random().toString(36).substring(7)
    await page.getByLabel('First name').fill(`Manager ${randomSuffix}`)
    await page.getByLabel('Last name').fill(`Test ${randomSuffix}`)
    await page.getByLabel('Email address').fill(managerEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByLabel(/I accept the Terms of Service/i).check({ force: true })
    await page.getByLabel(/I accept the Privacy Policy/i).check({ force: true })

    await expect(page.getByLabel(/I accept the Terms of Service/i)).toBeChecked()
    await expect(page.getByLabel(/I accept the Privacy Policy/i)).toBeChecked()

    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL('/')

    // 2. Elevate user to MANAGER via DB helper
    try {
      execSync(`npx tsx e2e/fixtures/db-helper.ts make-manager "${managerEmail}"`, {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
    } catch (e) {
      console.error('Failed to promote user via db-helper', e)
      throw e
    }

    // 3. Logout and Login again to refresh session/role claims if needed?
    // Session might store role. If so, we need to relogin.
    // Let's check session implementation. 'createSessionCookie' stores role.
    // So yes, we need to relogin.

    // Logout? No logout button found in immediate view, but we can clear cookies.
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel('Email address').fill(managerEmail)
    await page.getByLabel('Password').fill(password)

    await page.getByRole('button', { name: 'Sign in' }).click({ force: true })
    await page.waitForLoadState('networkidle')
    // Verify admin access
    await expect(page).toHaveURL('/admin/dashboard')

    // 4. Create User
    await page.goto('/admin/users')
    await page.getByRole('button', { name: 'Add User' }).click()

    const newDancerEmail = `dancer.${Math.random().toString(36).substring(7)}@example.com`
    await page.fill('input[name="firstName"]', 'New')
    await page.fill('input[name="lastName"]', 'Dancer')
    await page.fill('input[name="email"]', newDancerEmail)
    await page.selectOption('select[name="role"]', 'DANCER')
    await page.fill('input[name="password"]', password)
    await page.getByRole('button', { name: 'Create User' }).click()

    // Verify user in list
    await expect(page.locator('table')).toContainText(newDancerEmail)

    // 5. Edit User
    // Find the row with the email and click edit.
    // We can use locator filtering.
    await page.getByRole('row', { name: newDancerEmail }).getByTitle('Edit User').click()
    await page.fill('input[name="firstName"]', 'Edited')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Verify change
    await expect(page.getByRole('row', { name: newDancerEmail })).toContainText('Edited')
  })

  test('should allow manager to create a class template', async ({ page }) => {
    // Reuse manager login from previous test?
    // Playwright isolates contexts. We need to login again.
    // We can put login in beforeEach.

    await page.goto('/login')
    await page.getByLabel('Email address').fill(managerEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/admin/dashboard') // Verify login success and routing

    await page.goto('/admin/configuration/templates')
    await page.waitForLoadState('networkidle') // Wait for hydration/data
    await expect(page).toHaveURL('/admin/configuration/templates')
    await expect(page.getByRole('heading', { name: 'Class Templates' })).toBeVisible()

    // Wait a bit more for event listeners
    await page.waitForTimeout(500)

    await page.getByRole('button', { name: /create template/i }).click()
    await expect(page.getByRole('dialog', { name: 'Create Template' })).toBeVisible()

    const templateName = `Salsa Class ${Math.random().toString(36).substring(7)}`
    await page.fill('input[name="name"]', templateName)
    // Select style - assuming there is at least one style. If not, we might fail.
    // We might need to seed a style too if DB is empty.
    // But let's assume some styles exist or selecting the first option.
    // The select likely has options.
    // We can try to select by index or value.
    // Or check if we can create a style first?
    // 'admin.configuration.styles.tsx' exists.
    // Let's assume there's a style. If not, we should probably check DB and create one.

    // Let's verify if styles exist.
    const styleData = JSON.parse(
      execSync('npx tsx e2e/fixtures/db-helper.ts get-or-create-style', {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim()
    )

    // Get manager user ID
    const managerData = JSON.parse(
      execSync(`npx tsx e2e/fixtures/db-helper.ts get-user-id "${managerEmail}"`, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim()
    )

    // Interact with Style Combobox
    await page.getByPlaceholder('Select Style').click()
    await page.getByRole('button', { name: styleData.name }).click({ force: true })

    // Interact with Trainer Combobox
    await page.getByPlaceholder('Select Trainer').click()
    await page.getByRole('button', { name: managerData.name }).click({ force: true })

    await page.getByRole('button', { name: 'Create', exact: true }).click({ force: true })

    // Verify
    await expect(page.locator('table')).toContainText(templateName)
  })
})
