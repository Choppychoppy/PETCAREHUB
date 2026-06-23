import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import AdminLayout from '@/layouts/AdminLayout'
import ClientLayout from '@/layouts/ClientLayout'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminServices from '@/pages/admin/Services'
import AdminCategories from '@/pages/admin/Categories'
import DiscountCodes from '@/pages/admin/DiscountCodes'
import Users from '@/pages/admin/Users'
import Products from '@/pages/admin/Products'
import Content from '@/pages/admin/Content'
import Inventory from '@/pages/admin/Inventory'
import Appointments from '@/pages/admin/Appointments'
import Orders from '@/pages/admin/Orders'
import Support from '@/pages/admin/Support'
import Reports from '@/pages/admin/Reports'
import Settings from '@/pages/admin/Settings'
import CreateProduct from '@/pages/admin/products/CreateProduct'
import EditProduct from '@/pages/admin/products/EditProduct'
import CreatePost from '@/pages/admin/content/CreatePost'
import EditPost from '@/pages/admin/content/EditPost'
import OrderDetail from '@/pages/admin/orders/OrderDetail'
import Profile from '@/pages/Profile'
import EditProfile from '@/pages/EditProfile'
import ChangePassword from '@/pages/ChangePassword'
import TestProfile from '@/pages/TestProfile'
import Home from '@/pages/Home'
import Contact from '@/pages/Contact'
import Services from '@/pages/Services'
import ServiceDetail from '@/pages/ServiceDetail'
import ClientProducts from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Community from '@/pages/Community'
import DogBreedPrediction from '@/pages/DogBreedPrediction'
import DogDiseaseDetection from '@/pages/DogDiseaseDetection'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import VNPayReturn from '@/pages/VNPayReturn'
import MyPets from '@/pages/MyPets'
import UserAppointments from '@/pages/Appointments'
import UserOrders from '@/pages/Orders'
import Wishlist from '@/pages/Wishlist'
import Blog from '@/pages/Blog'
import BlogDetail from '@/pages/BlogDetail'
import { authService } from '@/services'

// Tự động cuộn lên đầu trang mỗi khi chuyển route.
// Sửa lỗi: khi đang cuộn xuống danh sách sản phẩm/dịch vụ rồi bấm "Xem chi tiết"/"Đặt lịch",
// trang chi tiết giữ nguyên vị trí cuộn cũ nên trông như bị "cuộn xuống cuối trang".
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

// Protected Route wrapper
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string | string[] }) {
  const isAuthenticated = authService.isAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  // Kiểm tra phân quyền: nếu route yêu cầu vai trò cụ thể (vd: admin) mà người dùng
  // không đúng vai trò thì KHÔNG cho vào, đẩy về trang phù hợp với vai trò của họ.
  // role có thể là 1 vai trò hoặc danh sách vai trò được phép.
  if (role) {
    const userRole = authService.getUserRole()
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!userRole || !allowedRoles.includes(userRole)) {
      // admin -> dashboard admin, staff -> dashboard staff, còn lại -> trang chủ
      const fallback =
        userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'staff'
            ? '/admin/appointments'
            : '/'
      return <Navigate to={fallback} replace />
    }
  }

  return <>{children}</>
}

// Auth Route wrapper - redirect to home if already authenticated
function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated()
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}


function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes - redirect to home if already logged in */}
        <Route path="/auth/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/auth/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/auth/verify-otp" element={<AuthRoute><VerifyOtp /></AuthRoute>} />
        
        {/* Client Routes */}
        <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
        <Route path="/contact" element={<ClientLayout><Contact /></ClientLayout>} />
        <Route path="/services" element={<ClientLayout><Services /></ClientLayout>} />
        <Route path="/services/:id" element={<ClientLayout><ServiceDetail /></ClientLayout>} />
        <Route path="/products" element={<ClientLayout><ClientProducts /></ClientLayout>} />
        <Route path="/products/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />
        <Route path="/dog-breed-prediction" element={<ClientLayout><DogBreedPrediction /></ClientLayout>} />
        <Route path="/dog-disease-detection" element={<ClientLayout><DogDiseaseDetection /></ClientLayout>} />
        <Route path="/blog" element={<ClientLayout><Blog /></ClientLayout>} />
        <Route path="/blog/:id" element={<ClientLayout><BlogDetail /></ClientLayout>} />

        {/* Community Routes - Protected */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <Community />
              </ClientLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ClientLayout>
                <Profile />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/edit" 
          element={
            <ProtectedRoute>
              <ClientLayout>
                <EditProfile />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/profile/change-password"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <ChangePassword />
              </ClientLayout>
            </ProtectedRoute>
          }
        />

        {/* Cart Route */}
        <Route path="/cart" element={<ClientLayout><Cart /></ClientLayout>} />

        {/* Checkout Route - Protected */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <Checkout />
              </ClientLayout>
            </ProtectedRoute>
          }
        />

        {/* VNPay Return Route */}
        <Route
          path="/payment/vnpay-return"
          element={
            <ClientLayout>
              <VNPayReturn />
            </ClientLayout>
          }
        />

        {/* User Pages - Protected */}
        <Route
          path="/my-pets"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <MyPets />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <UserAppointments />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <UserOrders />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <ClientLayout>
                <Wishlist />
              </ClientLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/services" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <AdminServices />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/categories" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/discount-codes" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <DiscountCodes />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Products />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/content" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Content />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/inventory" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute role={['admin', 'staff']}>
              <AdminLayout>
                <Appointments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <OrderDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Support />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Product sub-routes */}
        <Route 
          path="/admin/products/create" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <CreateProduct />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products/edit/:id" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <EditProduct />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Content sub-routes */}
        <Route 
          path="/admin/content/create" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <CreatePost />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/content/edit/:id" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <EditPost />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Profile Routes */}
        <Route 
          path="/admin/profile" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/profile/edit" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <EditProfile />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/profile/change-password" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <ChangePassword />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect /admin to /admin/dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
