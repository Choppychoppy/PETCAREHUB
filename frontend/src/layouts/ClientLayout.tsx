import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Avatar, Badge } from "@/components/common";
import { Chatbot } from "@/components/chatbot";
import { authService } from "@/services";
import { useCart } from "@/contexts/CartContext";
import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Clock,
  PawPrint,
  Heart,
  Shield,
  Stethoscope,
  Scissors,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";

interface ClientLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { name: "Trang chủ", href: "/", protected: false },
  { name: "Dịch vụ", href: "/services", protected: false },
  { name: "Sản phẩm", href: "/products", protected: false },
  { name: "Blog", href: "/blog", protected: false },
  {
    name: "Nhận diện giống chó",
    href: "/dog-breed-prediction",
    protected: false,
  },
  { name: "Cộng đồng", href: "/community", protected: true },
  { name: "Liên hệ", href: "/contact", protected: false },
];

export default function ClientLayout({ children }: ClientLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAuthenticated = authService.isAuthenticated();
  const {
    items: cartItems,
    totalItems,
    totalPrice,
    removeFromCart,
  } = useCart();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigationClick = (
    e: React.MouseEvent,
    item: { href: string; protected: boolean; name: string },
  ) => {
    // Nếu route cần authentication và user chưa đăng nhập
    if (item.protected && !isAuthenticated) {
      e.preventDefault();
      toast.error(`Vui lòng đăng nhập để truy cập "${item.name}"`);
      // Redirect đến login với returnUrl
      navigate(`/auth/login?returnUrl=${encodeURIComponent(item.href)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if API call fails
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <div className="text-3xl flex-shrink-0">🐾</div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap leading-tight">
                    PetCare Hub
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1 whitespace-nowrap">
                    Chăm sóc thú cưng tận tâm
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => handleNavigationClick(e, item)}
                  className={`text-sm font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? "text-[#2E86AB]"
                      : "text-gray-700 hover:text-[#2E86AB]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden lg:block">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center hover:text-[#2E86AB] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-[#2E86AB]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </form>
              </div>

              {/* Cart */}
              <div className="relative">
                <Button
                  variant="icon"
                  className="relative"
                  onClick={() => setCartMenuOpen(!cartMenuOpen)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-[#F18F01] text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full px-1">
                      {totalItems > 99 ? "99+" : totalItems}
                    </Badge>
                  )}
                </Button>

                {/* Cart Dropdown */}
                {cartMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Giỏ hàng ({totalItems})
                      </h3>
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="p-6 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Giỏ hàng trống</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto">
                          {cartItems.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50"
                            >
                              <img
                                src={
                                  item.imageUrl || "/placeholder-product.png"
                                }
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SL: {item.quantity} ×{" "}
                                  {item.price.toLocaleString()}đ
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.productId);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {cartItems.length > 3 && (
                            <p className="text-center text-xs text-gray-500 py-2">
                              +{cartItems.length - 3} sản phẩm khác
                            </p>
                          )}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                          <div className="flex justify-between mb-3">
                            <span className="text-sm text-gray-600">
                              Tổng cộng:
                            </span>
                            <span className="font-semibold text-[#2E86AB]">
                              {totalPrice.toLocaleString()}đ
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCartMenuOpen(false);
                                navigate("/cart");
                              }}
                            >
                              Xem giỏ hàng
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setCartMenuOpen(false);
                                navigate("/checkout");
                              }}
                            >
                              Thanh toán
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Button
                variant="icon"
                className="relative"
                onClick={() => navigate("/wishlist")}
                title="Danh sách yêu thích"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </Button>

              {/* Auth Section */}
              {isAuthenticated ? (
                /* User Menu */
                <div className="relative">
                  <Button
                    variant="icon"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2"
                  >
                    <Avatar size="sm" alt="User" />
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Hồ sơ của tôi
                      </Link>
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Chỉnh sửa hồ sơ
                      </Link>
                      <Link
                        to="/profile/change-password"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Đổi mật khẩu
                      </Link>
                      <div className="border-t border-gray-100 my-2"></div>
                      <Link
                        to="/my-pets"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Thú cưng của tôi
                      </Link>
                      <Link
                        to="/appointments"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Lịch hẹn
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Đơn hàng
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Yêu thích
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Login/Register Buttons */
                <div className="flex items-center gap-2">
                  <Link to="/auth/login">
                    <Button variant="outline" size="sm">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button size="sm">Đăng ký</Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActiveRoute(item.href)
                        ? "text-[#2E86AB] bg-blue-50"
                        : "text-gray-700 hover:text-[#2E86AB] hover:bg-gray-50"
                    }`}
                    onClick={(e) => {
                      handleNavigationClick(e, item);
                      if (!item.protected || isAuthenticated) {
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">PetCare Hub</h3>
                  <p className="text-emerald-400 text-sm">
                    Chăm sóc thú cưng tận tâm
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Nền tảng chăm sóc thú cưng hàng đầu Việt Nam, cung cấp dịch vụ
                chuyên nghiệp và tận tâm cho những người bạn bốn chân.
              </p>
              <div>
                <h5 className="text-sm font-semibold text-white mb-3">
                  Theo dõi chúng tôi
                </h5>
                <div className="flex gap-3">
                  <Button
                    variant="icon"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Youtube className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-400" />
                Dịch vụ chăm sóc
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                  <Stethoscope className="w-4 h-4" />
                  <Link to="/services" className="hover:text-emerald-400">
                    Khám sức khỏe tổng quát
                  </Link>
                </li>
                <li className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                  <Scissors className="w-4 h-4" />
                  <Link to="/services" className="hover:text-emerald-400">
                    Grooming & Spa
                  </Link>
                </li>
                <li className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                  <Shield className="w-4 h-4" />
                  <Link to="/services" className="hover:text-emerald-400">
                    Tiêm phòng vaccine
                  </Link>
                </li>
                <li className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                  <Heart className="w-4 h-4" />
                  <Link to="/services" className="hover:text-emerald-400">
                    Chăm sóc đặc biệt
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-6">
                Hỗ trợ khách hàng
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    Liên hệ tư vấn
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    Hướng dẫn đặt lịch
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    Chính sách bảo hành
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold mb-6">
                Thông tin liên hệ
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 text-gray-300">
                  <Phone className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Hotline 24/7</p>
                    <p className="text-emerald-400">1900 1234</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Email hỗ trợ</p>
                    <p>support@petcarehub.com</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Địa chỉ phòng khám</p>
                    <p>
                      Số 1 Đại Cồ Việt
                      <br />
                      Quận Hai Bà Trưng, Hà Nội
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Clock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Giờ làm việc</p>
                    <p>
                      8:00 - 22:00 (T2-CN)
                      <br />
                      <span className="text-emerald-400 font-medium">
                        Cấp cứu 24/7
                      </span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                © 2025 PetCare Hub. Tất cả quyền được bảo lưu.
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <Link
                  to="#"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Chính sách bảo mật
                </Link>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Điều khoản dịch vụ
                </Link>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Chính sách Cookie
                </Link>
                <Link
                  to="#"
                  className="text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Sitemap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
