import { test, expect } from '@playwright/test'

// Essential smoke flow. Requires the backend running on :8000.
// Run: npx playwright install chromium && npm run e2e

test('landing page loads with hero and CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/VeriTrace-X/)
  await expect(page.getByRole('heading', { name: /Trust Every Transaction/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Explore Dashboard/i }).first()).toBeVisible()
})

test('unauthenticated dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
})

test('register, then land on the dashboard', async ({ page }) => {
  const email = `e2e_${Date.now()}@test.com`
  await page.goto('/register')
  await page.getByLabel('Full name').fill('E2E User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /Create account/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})
