import { useState, useEffect } from 'react'
import { Button, Card, Loading, Input } from '@/components/common'
import { adminService } from '@/services/admin.service'
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface RevenueDataItem {
  date: string
  orderCount: number
  revenue: number
  averageOrderValue: number
}

interface TopProduct {
  rank: number
  productId: string
  name: string
  sold: number
  revenue: number
  orderCount: number
}

interface TopCustomer {
  rank: number
  id: string
  name: string
  email: string
  orders: number
  spent: number
}

interface CustomerAnalytics {
  newCustomers: number
  totalCustomers: number
  repeatCustomers: number
  returnRate: number
  topCustomers: TopCustomer[]
}

interface RevenueSummary {
  orders: number
  revenue: number
}

interface RevenueReport {
  data: RevenueDataItem[]
  totals: {
    totalRevenue: number
    totalOrders: number
  }
  summary: {
    week: RevenueSummary
    month: RevenueSummary
    quarter: RevenueSummary
  }
}

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const [dashboardStats, setDashboardStats] = useState<any>({})
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const fetchReportsData = async () => {
    try {
      setLoading(true)

      const [revenueReport, topProductsReport, customerReport, dashboardData] = await Promise.all([
        adminService.getReport('revenue', {
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          groupBy: 'day'
        }).catch(() => null),
        adminService.getReport('top-products', {
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          limit: 5
        }).catch(() => []),
        adminService.getReport('customers', {
          dateFrom: dateRange.from,
          dateTo: dateRange.to
        }).catch(() => null),
        adminService.getDashboardStats().catch(() => ({}))
      ])

      setRevenueData(revenueReport)
      setTopProducts(topProductsReport || [])
      setCustomerAnalytics(customerReport)
      setDashboardStats(dashboardData || {})
    } catch (error) {
      console.error('Failed to fetch reports data:', error)
      toast.error('Không thể tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData()
  }, [dateRange])

  const handleDateRangeChange = (type: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [type]: value }))
  }

  const formatPrice = (price: number | string | null | undefined) => {
    const numValue = Number(price) || 0
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numValue)
  }

  const formatNumber = (num: number | string | null | undefined) => {
    const numValue = Number(num) || 0
    return new Intl.NumberFormat('vi-VN').format(numValue)
  }

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/\s+/g, '')
        const value = row[key] ?? row[h] ?? ''
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportReport = async (reportType: string) => {
    setExporting(true)
    const toastId = toast.loading(`Đang xuất báo cáo ${reportType}...`)

    try {
      switch (reportType) {
        case 'revenue':
          if (revenueData?.data && revenueData.data.length > 0) {
            const revenueExportData = revenueData.data.map(item => ({
              date: item.date,
              ordercount: item.orderCount,
              revenue: item.revenue,
              averageordervalue: Math.round(item.averageOrderValue)
            }))
            exportToCSV(revenueExportData, 'bao_cao_doanh_thu', ['date', 'orderCount', 'revenue', 'averageOrderValue'])
            toast.success('Xuất báo cáo doanh thu thành công!', { id: toastId })
          } else {
            toast.error('Không có dữ liệu doanh thu để xuất', { id: toastId })
          }
          break

        case 'products':
          if (topProducts.length > 0) {
            const productsExportData = topProducts.map(p => ({
              rank: p.rank,
              name: p.name,
              sold: p.sold,
              revenue: p.revenue,
              ordercount: p.orderCount
            }))
            exportToCSV(productsExportData, 'san_pham_ban_chay', ['rank', 'name', 'sold', 'revenue', 'orderCount'])
            toast.success('Xuất báo cáo sản phẩm thành công!', { id: toastId })
          } else {
            toast.error('Không có dữ liệu sản phẩm để xuất', { id: toastId })
          }
          break

        case 'customers':
          if (customerAnalytics?.topCustomers && customerAnalytics.topCustomers.length > 0) {
            const customersExportData = customerAnalytics.topCustomers.map(c => ({
              rank: c.rank,
              name: c.name,
              email: c.email,
              orders: c.orders,
              spent: c.spent
            }))
            exportToCSV(customersExportData, 'khach_hang_vip', ['rank', 'name', 'email', 'orders', 'spent'])
            toast.success('Xuất báo cáo khách hàng thành công!', { id: toastId })
          } else {
            toast.error('Không có dữ liệu khách hàng để xuất', { id: toastId })
          }
          break

        case 'all':
          // Export all reports
          const allData = {
            summary: {
              totalRevenue: dashboardStats.totalRevenue || 0,
              totalOrders: dashboardStats.totalOrders || 0,
              totalUsers: dashboardStats.totalUsers || 0,
              totalAppointments: dashboardStats.totalAppointments || 0,
              dateRange: `${dateRange.from} - ${dateRange.to}`
            },
            revenueByPeriod: revenueData?.summary || {},
            topProducts: topProducts,
            customerAnalytics: {
              newCustomers: customerAnalytics?.newCustomers || 0,
              returnRate: customerAnalytics?.returnRate || 0,
              topCustomers: customerAnalytics?.topCustomers || []
            }
          }

          const jsonBlob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(jsonBlob)
          link.download = `bao_cao_tong_hop_${new Date().toISOString().split('T')[0]}.json`
          link.click()
          URL.revokeObjectURL(link.href)
          toast.success('Xuất báo cáo tổng hợp thành công!', { id: toastId })
          break

        default:
          toast.error('Loại báo cáo không hợp lệ', { id: toastId })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Không thể xuất báo cáo', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-green-600">
            Doanh thu: {formatPrice(payload[0]?.value || 0)}
          </p>
          {payload[1] && (
            <p className="text-sm text-blue-600">
              Đơn hàng: {payload[1]?.value || 0}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }: any) => (
    <Card className="relative overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
            {trend !== undefined && trend !== null && trend !== 0 && (
              <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% so với tháng trước
              </p>
            )}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-full`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
            <p className="text-gray-600">Theo dõi hiệu suất kinh doanh và xu hướng</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportReport('all')} disabled={exporting}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Xuất tổng hợp (JSON)
            </Button>
          </div>
        </div>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Khoảng thời gian</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange('from', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange('to', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng doanh thu"
          value={formatPrice(dashboardStats.totalRevenue || 0)}
          icon={DollarSign}
          trend={dashboardStats.trends?.revenue}
          color="green"
        />
        <StatCard
          title="Tổng đơn hàng"
          value={formatNumber(dashboardStats.totalOrders || 0)}
          icon={ShoppingBag}
          trend={dashboardStats.trends?.orders}
          color="blue"
        />
        <StatCard
          title="Tổng lịch hẹn"
          value={formatNumber(dashboardStats.totalAppointments || 0)}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Tổng khách hàng"
          value={formatNumber(dashboardStats.totalUsers || 0)}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Biểu đồ doanh thu</h3>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-[#2E86AB] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Đường
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartType === 'bar'
                    ? 'bg-[#2E86AB] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cột
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportReport('revenue')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="h-80">
            {revenueData?.data && revenueData.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={revenueData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                        return value
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu (VND)"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orderCount"
                      name="Số đơn hàng"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={revenueData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                        return value
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu (VND)"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Hãy thử chọn khoảng thời gian khác
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Revenue Summary Table */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Tổng quan doanh thu</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khoảng thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số đơn hàng
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Tuần này</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatPrice(revenueData?.summary?.week?.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(revenueData?.summary?.week?.orders || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Tháng này</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatPrice(revenueData?.summary?.month?.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(revenueData?.summary?.month?.orders || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Quý này</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatPrice(revenueData?.summary?.quarter?.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(revenueData?.summary?.quarter?.orders || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Products and Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Sản phẩm bán chạy</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportReport('products')}>
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.productId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {product.rank || index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{formatNumber(product.sold)} đã bán</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatPrice(product.revenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu sản phẩm bán chạy
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Customer Analytics */}
        <Card>
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Phân tích khách hàng</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportReport('customers')}>
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(customerAnalytics?.newCustomers || 0)}
                </p>
                <p className="text-sm text-blue-600">Khách hàng mới (30 ngày)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {customerAnalytics?.returnRate || 0}%
                </p>
                <p className="text-sm text-green-600">Tỷ lệ quay lại</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Top khách hàng VIP</h4>
              {customerAnalytics?.topCustomers && customerAnalytics.topCustomers.length > 0 ? (
                customerAnalytics.topCustomers.slice(0, 4).map((customer, index) => (
                  <div key={customer.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                        {customer.rank || index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{formatNumber(customer.orders)} đơn hàng</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatPrice(customer.spent)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Chưa có dữ liệu khách hàng VIP
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Reports