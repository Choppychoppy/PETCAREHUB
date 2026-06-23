import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'

// ============================================================
// Dọn phiên đăng nhập cũ khi khởi chạy web.
// Sửa lỗi: web tự "vào sẵn admin" do token JWT cũ còn lưu trong localStorage.
// Khi khởi động, nếu token đã hết hạn (hoặc không hợp lệ) thì xoá đi để
// mặc định trang web ở trạng thái CHƯA đăng nhập tài khoản nào.
// ============================================================
function clearStaleSession() {
  const token = localStorage.getItem('auth_token')
  if (!token) return

  let expired = true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp tính bằng giây; còn hạn khi exp > thời điểm hiện tại
    if (payload?.exp && payload.exp * 1000 > Date.now()) {
      expired = false
    }
  } catch {
    // Token sai định dạng -> coi như không hợp lệ
    expired = true
  }

  if (expired) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  }
}

clearStaleSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <WishlistProvider>
        <App />
      </WishlistProvider>
    </CartProvider>
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#ef4444',
          },
        },
      }}
    />
  </StrictMode>,
)
