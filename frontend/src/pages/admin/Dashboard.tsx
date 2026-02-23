import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, StatusBadge, Table, Loading } from '@/components/common'
import { adminService } from '@/services'
import { formatVND } from '@/utils'

interface DashboardStats {
  totalRevenue: number
  totalAppointments: number
  totalOrders: number
  totalUsers: number
  totalProducts?: number
  recentAppointments: any[]
  recentOrders: any[]
  thisMonth?: {
    orders: number
    revenue: number
    newUsers: number
  }
  trends?: {
    orders: number
    revenue: number
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Đang tải dữ liệu dashboard..." />
      </div>
    )
  }

  const appointmentColumns = [
    {
      key: 'user',
      label: 'Khách hàng',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">
            👤
          </div>
          <div>
            <div className="font-medium">{value?.profile?.name || value?.email || 'N/A'}</div>
            <div className="text-xs text-gray-500">{row?.pet?.name || row?.petName || 'Thú cưng'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Dịch vụ',
      render: (value: any) => value?.name || 'N/A'
    },
    {
      key: 'dateTime',
      label: 'Thời gian',
      render: (value: string) => value ? new Date(value).toLocaleString('vi-VN') : 'N/A'
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: string) => <StatusBadge status={value as any} />
    }
  ]

  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Mã đơn',
      render: (value: string, row: any) => `#${value || row?.id?.slice(-6) || 'N/A'}`
    },
    {
      key: 'user',
      label: 'Khách hàng',
      render: (value: any) => value?.profile?.name || value?.email || 'N/A'
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      render: (value: number) => (
        <span className="font-medium text-[#2E86AB]">
          {formatVND(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: string) => <StatusBadge status={value as any} />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hoạt động kinh doanh</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/reports')}>
          📊 Xem báo cáo chi tiết
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatVND(stats?.totalRevenue || 0)}
              </p>
              <p className={`text-sm mt-1 ${(stats?.trends?.revenue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.trends?.revenue || 0) >= 0 ? '+' : ''}{stats?.trends?.revenue || 0}% từ tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lịch hẹn</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalAppointments || 0}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Tổng số lịch hẹn
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              📅
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalOrders || 0}
              </p>
              <p className={`text-sm mt-1 ${(stats?.trends?.orders || 0) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {(stats?.trends?.orders || 0) >= 0 ? '+' : ''}{stats?.trends?.orders || 0}% từ tháng trước
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người dùng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {stats?.thisMonth?.newUsers || 0} mới trong tháng
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card padding="none">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lịch hẹn gần đây</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate('/admin/appointments')}>
                Xem tất cả
              </Button>
            </div>
          </div>
          {stats?.recentAppointments?.length ? (
            <Table
              columns={appointmentColumns}
              data={stats.recentAppointments.slice(0, 5)}
              className="shadow-none border-0"
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              Không có lịch hẹn nào
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card padding="none">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate('/admin/orders')}>
                Xem tất cả
              </Button>
            </div>
          </div>
          {stats?.recentOrders?.length ? (
            <Table
              columns={orderColumns}
              data={stats.recentOrders.slice(0, 5)}
              className="shadow-none border-0"
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              Không có đơn hàng nào
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="secondary"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/admin/services')}
            >
              <span className="text-2xl">🏥</span>
              <span>Thêm dịch vụ</span>
            </Button>

            <Button
              variant="secondary"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/admin/products/create')}
            >
              <span className="text-2xl">🛍️</span>
              <span>Thêm sản phẩm</span>
            </Button>

            <Button
              variant="secondary"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/admin/users')}
            >
              <span className="text-2xl">👥</span>
              <span>Quản lý người dùng</span>
            </Button>

            <Button
              variant="secondary"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/admin/reports')}
            >
              <span className="text-2xl">📈</span>
              <span>Xem báo cáo</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}