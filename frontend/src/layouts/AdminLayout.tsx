import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Avatar, Badge } from '@/components/common'
import { authService } from '@/services'
import {
  BarChart3,
  Calendar,
  Package,
  ShoppingBag,
  FolderOpen,
  Users,
  Tag,
  ClipboardList,
  FileText,
  MessageSquare,
  TrendingUp,
  Settings,
  Hospital,
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
  X
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    path: '/admin/dashboard'
  },
  {
    title: 'Quản lý dịch vụ',
    icon: Hospital,
    path: '/admin/services'
  },
  {
    title: 'Quản lý lịch hẹn',
    icon: Calendar,
    path: '/admin/appointments'
  },
  {
    title: 'Quản lý đơn hàng',
    icon: Package,
    path: '/admin/orders'
  },
  {
    title: 'Quản lý sản phẩm',
    icon: ShoppingBag,
    path: '/admin/products'
  },
  {
    title: 'Quản lý danh mục',
    icon: FolderOpen,
    path: '/admin/categories'
  },
  {
    title: 'Quản lý người dùng',
    icon: Users,
    path: '/admin/users'
  },
  {
    title: 'Mã giảm giá',
    icon: Tag,
    path: '/admin/discount-codes'
  },
  {
    title: 'Quản lý kho',
    icon: ClipboardList,
    path: '/admin/inventory'
  },
  {
    title: 'Nội dung & Blog',
    icon: FileText,
    path: '/admin/content'
  },
  {
    title: 'Hỗ trợ khách hàng',
    icon: MessageSquare,
    path: '/admin/support'
  },
  {
    title: 'Báo cáo',
    icon: TrendingUp,
    path: '/admin/reports'
  },
  {
    title: 'Cài đặt',
    icon: Settings,
    path: '/admin/settings'
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const currentUser = authService.getCachedUser()

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout even if API call fails
      localStorage.clear()
      window.location.href = '/auth/login'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'} flex-shrink-0 border-r border-slate-200/60`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/60">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🐾
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-slate-900 font-bold text-xl tracking-tight">PetCare Hub</h1>
                  <p className="text-slate-500 text-sm font-medium">Admin Panel</p>
                </div>
              )}
            </Link>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="space-y-2 px-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon
                const isActive = isActiveRoute(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <IconComponent 
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                      }`} 
                    />
                    {!sidebarCollapsed && (
                      <span className="tracking-wide">{item.title}</span>
                    )}
                    {!sidebarCollapsed && isActive && (
                      <div className="ml-auto w-2 h-2 bg-white/30 rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/50">
              <div className="relative">
                <Avatar size="md" alt="Admin" className="border-2 border-white shadow-md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-semibold text-sm truncate">
                    {currentUser?.profile?.name || 'Admin User'}
                  </p>
                  <p className="text-slate-500 text-xs font-medium">{currentUser?.email || 'admin@petcare.com'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center gap-4">
                <Button
                  variant="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hover:bg-slate-100 rounded-lg p-2 transition-colors"
                >
                  {sidebarCollapsed ? (
                    <Menu className="w-5 h-5 text-slate-600" />
                  ) : (
                    <X className="w-5 h-5 text-slate-600" />
                  )}
                </Button>
                
                {/* Breadcrumb */}
                <nav className="hidden md:flex items-center space-x-2 text-sm">
                  <Link to="/admin/dashboard" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">
                    Dashboard
                  </Link>
                  {location.pathname !== '/admin/dashboard' && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-800 font-semibold capitalize bg-slate-100 px-3 py-1 rounded-lg">
                        {location.pathname.split('/')[2]?.replace('-', ' ')}
                      </span>
                    </>
                  )}
                </nav>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="icon"
                    className="relative hover:bg-slate-100 rounded-lg p-2 transition-colors"
                    onClick={() => setNotificationOpen(!notificationOpen)}
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg">
                      3
                    </div>
                  </Button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/60 py-2 backdrop-blur-md z-50">
                      <div className="px-4 py-3 border-b border-slate-200/60">
                        <h3 className="font-semibold text-slate-900">Thông báo</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <Link
                          to="/admin/appointments"
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          onClick={() => setNotificationOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Lịch hẹn mới</p>
                            <p className="text-xs text-slate-500 truncate">Có lịch hẹn mới cần xử lý</p>
                            <p className="text-xs text-slate-400 mt-1">Vừa xong</p>
                          </div>
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          onClick={() => setNotificationOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Đơn hàng mới</p>
                            <p className="text-xs text-slate-500 truncate">Có đơn hàng mới cần xác nhận</p>
                            <p className="text-xs text-slate-400 mt-1">5 phút trước</p>
                          </div>
                        </Link>
                        <Link
                          to="/admin/support"
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          onClick={() => setNotificationOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Yêu cầu hỗ trợ</p>
                            <p className="text-xs text-slate-500 truncate">Có yêu cầu hỗ trợ mới</p>
                            <p className="text-xs text-slate-400 mt-1">10 phút trước</p>
                          </div>
                        </Link>
                      </div>
                      <div className="px-4 py-3 border-t border-slate-200/60">
                        <Link
                          to="/admin/dashboard"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          onClick={() => setNotificationOpen(false)}
                        >
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="icon"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-100 border border-slate-200/50 transition-all duration-200 shadow-sm"
                  >
                    <div className="relative">
                      <Avatar size="sm" alt="Admin" className="border-2 border-white shadow-md" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-slate-900">
                        {currentUser?.profile?.name || 'Admin User'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">Quản trị viên</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 py-2 backdrop-blur-md">
                      <Link 
                        to="/admin/profile" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        Hồ sơ cá nhân
                      </Link>
                      <Link 
                        to="/admin/profile/change-password" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Đổi mật khẩu
                      </Link>
                      <div className="border-t border-slate-200/60 my-2"></div>
                      <Link 
                        to="/admin/settings" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Cài đặt hệ thống
                      </Link>
                      <div className="border-t border-slate-200/60 mt-2 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/60 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="font-medium">
              © 2025 PetCare Hub. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span className="px-2 py-1 bg-slate-100 rounded-md font-semibold text-slate-600">Version 1.0.0</span>
              <span className="text-slate-300">•</span>
              <Link to="/admin/help" className="hover:text-blue-600 transition-colors font-medium">
                Trợ giúp
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}