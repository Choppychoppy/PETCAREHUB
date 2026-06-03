import { test, expect } from '@playwright/test'
import { execFileSync } from 'child_process'
import * as path from 'path'

// Test chạy với cwd = thư mục frontend
const BACKEND_DIR = path.resolve(process.cwd(), '..', 'backend')
const HELPER = path.join(BACKEND_DIR, 'test-otp-helper.js')
const PREFIX = 'petcare_otp_test_'
const PASSWORD = 'Test123456'

function getOtp(email: string): string {
  return execFileSync('node', [HELPER, 'get', email], { cwd: BACKEND_DIR })
    .toString()
    .trim()
}

test.afterAll(() => {
  // Dọn tài khoản test khỏi DB
  try {
    execFileSync('node', [HELPER, 'cleanup', PREFIX], { cwd: BACKEND_DIR })
  } catch {
    // bỏ qua lỗi cleanup
  }
})

test('Đăng ký rồi xác minh OTP thành công thì vào được hệ thống', async ({ page }) => {
  const email = `${PREFIX}${Date.now()}_a@example.com`

  // 1. Trang đăng ký
  await page.goto('/auth/register')
  await expect(page.getByRole('heading', { name: 'PetCare Hub' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/01-register.png', fullPage: true })

  // 2. Điền form và đăng ký
  await page.fill('input[name="name"]', 'Người Dùng Test')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', PASSWORD)
  await page.fill('input[name="confirmPassword"]', PASSWORD)
  await page.getByRole('button', { name: 'Đăng ký' }).click()

  // 3. Phải chuyển sang trang nhập OTP
  await page.waitForURL(/\/auth\/verify-otp/, { timeout: 15000 })
  await expect(page.getByText('Xác minh tài khoản của bạn')).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await page.screenshot({ path: 'screenshots/02-verify-otp.png', fullPage: true })

  // 4. Lấy OTP từ DB và nhập
  const otp = getOtp(email)
  expect(otp).toMatch(/^\d{6}$/)
  await page.getByLabel('Chữ số thứ 1 của mã xác minh').fill(otp)
  await page.screenshot({ path: 'screenshots/03-otp-filled.png', fullPage: true })
  await page.getByRole('button', { name: 'Xác minh' }).click()

  // 5. Xác minh xong tự đăng nhập -> rời khỏi trang OTP về trang chủ
  await page.waitForURL((url) => !url.pathname.includes('/auth/verify-otp'), {
    timeout: 15000,
  })
  expect(page.url()).not.toContain('/auth/verify-otp')

  // Token đã được lưu (tự đăng nhập)
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  expect(token).toBeTruthy()
})

test('Đăng nhập khi chưa xác minh thì bị chuyển sang trang nhập OTP', async ({ page }) => {
  const email = `${PREFIX}${Date.now()}_b@example.com`

  // Đăng ký nhưng KHÔNG xác minh
  await page.goto('/auth/register')
  await page.fill('input[name="name"]', 'Chưa Xác Minh')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', PASSWORD)
  await page.fill('input[name="confirmPassword"]', PASSWORD)
  await page.getByRole('button', { name: 'Đăng ký' }).click()
  await page.waitForURL(/\/auth\/verify-otp/, { timeout: 15000 })

  // Thử đăng nhập -> bị chặn -> chuyển về trang nhập OTP
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await page.waitForURL(/\/auth\/verify-otp/, { timeout: 15000 })
  expect(page.url()).toContain('/auth/verify-otp')
})
