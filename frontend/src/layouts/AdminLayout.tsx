import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Avatar } from '@/components/common'
import { authService, adminService } from '@/services'
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
    path: '/admin/appointments',
    staffAllowed: true
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

// Tính thời gian tương đối từ một mốc thời gian (vd: "Vừa xong", "5 phút trước")
function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  const diffMs = Date.now() - date.getTime()
  if (isNaN(diffMs)) return ''
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'Vừa xong'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} phút trước`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ trước`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

interface AdminNotification {
  id: string
  type: 'appointment' | 'order' | 'support'
  title: string
  description: string
  createdAt?: string | Date
  link: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const currentUser = authService.getCachedUser()

  // Lấy thông báo thật từ lịch hẹn mới, đơn hàng mới và yêu cầu hỗ trợ mới
  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        const [appointmentsRes, ordersRes, supportRes] = await Promise.allSettled([
          adminService.getAppointments({ status: 'pending', limit: 5 }),
          adminService.getOrders({ status: 'pending', limit: 5 }),
          adminService.getSupportTickets({ status: 'open', limit: 5 }),
        ])

        const items: AdminNotification[] = []

        if (appointmentsRes.status === 'fulfilled') {
          const list = (appointmentsRes.value as any)?.data || []
          list.forEach((a: any) => {
            items.push({
              id: `appointment-${a.id}`,
              type: 'appointment',
              title: 'Lịch hẹn mới',
              description: 'Có lịch hẹn mới cần xử lý',
              createdAt: a.createdAt,
              link: '/admin/appointments',
            })
          })
        }

        if (ordersRes.status === 'fulfilled') {
          const list = (ordersRes.value as any)?.data || []
          list.forEach((o: any) => {
            items.push({
              id: `order-${o.id}`,
              type: 'order',
              title: 'Đơn hàng mới',
              description: o.orderNumber
                ? `Đơn hàng ${o.orderNumber} cần xác nhận`
                : 'Có đơn hàng mới cần xác nhận',
              createdAt: o.createdAt,
              link: '/admin/orders',
            })
          })
        }

        if (supportRes.status === 'fulfilled') {
          const list = (supportRes.value as any)?.data || []
          list.forEach((s: any) => {
            items.push({
              id: `support-${s.id}`,
              type: 'support',
              title: 'Yêu cầu hỗ trợ',
              description: s.subject || 'Có yêu cầu hỗ trợ mới',
              createdAt: s.createdAt,
              link: '/admin/support',
            })
          })
        }

        // Sắp xếp mới nhất lên đầu
        items.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })

        if (mounted) setNotifications(items)
      } catch (error) {
        console.error('Không thể tải thông báo:', error)
      }
    }

    fetchNotifications()
    // Cập nhật lại mỗi 60s để thời gian hiển thị luôn chính xác
    const timer = setInterval(fetchNotifications, 60000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const notificationCount = notifications.length

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
              {menuItems
                .filter((item) =>
                  // Nhân viên chỉ thấy các mục được phép (vd: Quản lý lịch hẹn)
                  authService.getUserRole() === 'staff' ? (item as any).staffAllowed : true,
                )
                .map((item) => {
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
                {/* Đã ẩn icon chuông thông báo theo yêu cầu */}

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
              <a
                href="mailto:support@petcarehub.com?subject=Y%C3%AAu%20c%E1%BA%A7u%20tr%E1%BB%A3%20gi%C3%BAp%20PetCareHub"
                className="hover:text-blue-600 transition-colors font-medium"
              >
                Trợ giúp
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}