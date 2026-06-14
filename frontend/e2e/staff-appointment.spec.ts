import { test, expect, request } from '@playwright/test'

const API = 'http://localhost:3001/api'

async function loginAndSeed(page: any, email: string) {
  const ctx = await request.newContext()
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email, password: '123456' },
  })
  const body = await res.json()
  const token = body?.data?.accessToken
  const user = body?.data?.user
  expect(token, `login ${email}`).toBeTruthy()
  await page.addInitScript(
    ([t, u]: [string, any]) => {
      localStorage.setItem('auth_token', t)
      localStorage.setItem('user_info', JSON.stringify(u))
    },
    [token, user],
  )
}

test('Admin: mo modal tao lich hen - khach co tai khoan & khach vang lai', async ({ page }) => {
  await loginAndSeed(page, 'admin@petcarehub.vn')
  await page.goto('http://localhost:5174/admin/appointments')
  await expect(page.getByRole('heading', { name: 'Quản lý lịch hẹn' })).toBeVisible()

  // Mo modal tao lich
  await page.getByRole('button', { name: 'Tạo lịch hẹn' }).first().click()
  await expect(page.getByText('Tạo lịch hẹn mới')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Khách đã có tài khoản' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Khách vãng lai' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/appt-01-admin-registered.png', fullPage: true })

  // Chuyen sang khach vang lai
  await page.getByRole('button', { name: 'Khách vãng lai' }).click()
  await expect(page.getByText('hồ sơ lưu trữ online', { exact: false })).toBeVisible()
  await expect(page.getByPlaceholder('0901234567')).toBeVisible()
  // Admin co dropdown chon nhan vien
  await expect(page.getByText('Nhân viên phụ trách', { exact: false })).toBeVisible()
  await page.screenshot({ path: 'screenshots/appt-02-admin-guest.png', fullPage: true })
})

test('Staff: truong nhan vien bi khoa ve chinh ho', async ({ page }) => {
  await loginAndSeed(page, 'bacsi.minh@petcarehub.vn')
  await page.goto('http://localhost:5174/admin/appointments')
  await expect(page.getByRole('heading', { name: 'Quản lý lịch hẹn' })).toBeVisible()
  await expect(page.getByText('được phân công cho bạn', { exact: false })).toBeVisible()

  await page.getByRole('button', { name: 'Tạo lịch hẹn' }).first().click()
  await expect(page.getByText('Tạo lịch hẹn mới')).toBeVisible()
  // Nhan vien tu phu trach (khong co dropdown chon nhan vien khac)
  await expect(page.getByText('tự phụ trách', { exact: false })).toBeVisible()
  await page.screenshot({ path: 'screenshots/appt-03-staff-locked.png', fullPage: true })
})
