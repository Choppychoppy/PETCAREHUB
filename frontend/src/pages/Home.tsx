import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Loading } from "@/components/common";
import { publicService } from "@/services";
import { useCart } from "@/contexts/CartContext";
import { formatVND, formatDiscountPercentage, formatSavings } from "@/utils";
import {
  Heart,
  Shield,
  Calendar,
  ShoppingBag,
  Users,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Award,
  Stethoscope,
  Scissors,
  HomeIcon,
  ChevronRight,
  PawPrint,
  Clock,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

// Ảnh thay thế khi ảnh sản phẩm bị lỗi/thiếu (tránh hiển thị ảnh vỡ)
const PRODUCT_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop";

const Home = () => {
  const { addToCart } = useCart();
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.imageUrl,
      stockQuantity: product.stockQuantity,
    });
  };

  useEffect(() => {
    fetchServices();
    fetchProducts();
  }, []);

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const response = await publicService.getServices();
      const servicesData = response.data || response || [];
      setServices(servicesData.slice(0, 6)); // Lấy 6 dịch vụ đầu
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await publicService.getProducts({ limit: 6 });
      const productsData =
        response.data?.data || response.data || response || [];
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setProductsLoading(false);
    }
  };

  const fallbackServices = [
    {
      icon: Stethoscope,
      title: "Khám sức khỏe",
      description: "Kiểm tra sức khỏe định kỳ và chẩn đoán bệnh cho thú cưng",
      price: "Từ 200.000đ",
      popular: true,
    },
    {
      icon: Scissors,
      title: "Grooming & Spa",
      description: "Cắt tỉa lông, tắm gội và chăm sóc làm đẹp chuyên nghiệp",
      price: "Từ 150.000đ",
      popular: false,
    },
    {
      icon: Shield,
      title: "Tiêm phòng",
      description: "Tiêm phòng đầy đủ các loại vaccine bảo vệ sức khỏe",
      price: "Từ 100.000đ",
      popular: false,
    },
    {
      icon: Heart,
      title: "Chăm sóc răng miệng",
      description: "Vệ sinh răng miệng và điều trị các bệnh về răng",
      price: "Từ 300.000đ",
      popular: false,
    },
  ];

  const fallbackProducts = [
    {
      image:
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop",
      name: "Thức ăn Royal Canin",
      price: 450000,
      comparePrice: 500000,
      stockQuantity: 120,
      rating: 4.8,
      category: "Thức ăn",
    },
    {
      image:
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop",
      name: "Đồ chơi bóng tennis",
      price: 85000,
      comparePrice: 100000,
      stockQuantity: 60,
      rating: 4.5,
      category: "Đồ chơi",
    },
    {
      image:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=300&fit=crop",
      name: "Vòng cổ thời trang",
      price: 120000,
      comparePrice: null,
      stockQuantity: 85,
      rating: 4.7,
      category: "Phụ kiện",
    },
    {
      image:
        "https://images.unsplash.com/photo-1544568100-847a948585b9?w=300&h=300&fit=crop",
      name: "Giường ngủ êm ái",
      price: 280000,
      comparePrice: 350000,
      stockQuantity: 40,
      rating: 4.9,
      category: "Phụ kiện",
    },
  ];

  const testimonials = [
    {
      name: "Chị Lan Anh",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      comment:
        "Dịch vụ tuyệt vời! Nhân viên rất chuyên nghiệp và yêu thương động vật. Mèo nhà mình rất thích đến đây.",
      pet: "Mèo Milo",
    },
    {
      name: "Anh Minh Tuấn",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      comment:
        "Đặt lịch online rất tiện lợi. Bác sĩ tư vấn kỹ lưỡng và giá cả hợp lý.",
      pet: "Chó Golden Bobby",
    },
    {
      name: "Chị Thu Hương",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      comment:
        "Spa cho chó ở đây tuyệt vời lắm! Sau khi grooming, bé Luna trông xinh đẹp và thơm tho.",
      pet: "Chó Poodle Luna",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Khách hàng tin tưởng", icon: Users },
    { number: "50,000+", label: "Lượt khám thành công", icon: Heart },
    { number: "98%", label: "Khách hàng hài lòng", icon: Star },
    { number: "24/7", label: "Hỗ trợ khẩn cấp", icon: Shield },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* Main Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Pet care background"
          className="w-full h-full object-cover opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/50 to-blue-50/30"></div>
      </div>

      {/* Animated Background Icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {/* Floating Icons */}
        <div
          className="absolute top-20 left-10 text-emerald-200/30 animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        >
          <Heart className="w-8 h-8" />
        </div>
        <div
          className="absolute top-32 right-20 text-blue-200/30 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        >
          <Stethoscope className="w-10 h-10" />
        </div>
        <div
          className="absolute top-48 left-1/4 text-emerald-200/20 animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "2s" }}
        >
          <Calendar className="w-6 h-6" />
        </div>
        <div
          className="absolute top-64 right-1/3 text-amber-200/30 animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
        >
          <Scissors className="w-9 h-9" />
        </div>
        <div
          className="absolute bottom-40 left-16 text-emerald-200/30 animate-pulse"
          style={{ animationDelay: "1.5s", animationDuration: "2.5s" }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <div
          className="absolute bottom-56 right-16 text-blue-200/20 animate-bounce"
          style={{ animationDelay: "2.5s", animationDuration: "4s" }}
        >
          <Star className="w-7 h-7" />
        </div>
        <div
          className="absolute bottom-32 left-1/3 text-emerald-200/30 animate-pulse"
          style={{ animationDelay: "0.8s", animationDuration: "3s" }}
        >
          <PawPrint className="w-6 h-6" />
        </div>

        {/* Floating Particles */}
        <div
          className="absolute top-16 right-1/4 text-emerald-100/40 animate-ping"
          style={{ animationDelay: "2s", animationDuration: "4s" }}
        >
          <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
        </div>
        <div
          className="absolute bottom-20 left-1/5 text-blue-100/40 animate-ping"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        >
          <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
        </div>
        <div
          className="absolute top-40 left-1/2 text-amber-100/40 animate-ping"
          style={{ animationDelay: "1s", animationDuration: "5s" }}
        >
          <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
        </div>
      </div>

      {/* Hero Section - Clean & Minimal */}
      <section className="relative pt-20 pb-16 z-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-gray-900">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-8">
                <span className="text-gray-900">Chăm sóc thú cưng</span>
                <span className="block text-emerald-600 mt-2">
                  với tình yêu
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                Dịch vụ chăm sóc thú cưng chuyên nghiệp với đội ngũ bác sĩ thú y
                giàu kinh nghiệm và trang thiết bị hiện đại.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/services">
                  <Button
                    size="lg"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Đặt lịch hẹn
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    Liên hệ tư vấn
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    10K+
                  </div>
                  <div className="text-sm text-gray-600">Khách hàng</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    98%
                  </div>
                  <div className="text-sm text-gray-600">Hài lòng</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl font-bold text-emerald-600">
                      4.9
                    </span>
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="text-sm text-gray-600">Đánh giá</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative">
                <div className="bg-emerald-50/80 backdrop-blur-sm rounded-3xl p-8">
                  <img
                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=500&fit=crop&crop=faces"
                    alt="Professional pet care"
                    className="rounded-2xl shadow-2xl w-full object-cover h-96"
                  />
                </div>

                {/* Floating card */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Lịch hẹn được xác nhận
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. Sarah Johnson - 14:30
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality badges */}
                <div className="absolute top-4 -right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Chứng nhận ISO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/95 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="text-center p-6 bg-white shadow-lg rounded-2xl border border-gray-100"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white/95 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ chăm sóc toàn diện
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Từ khám sức khỏe định kỳ đến chăm sóc đặc biệt, chúng tôi cung cấp
              mọi dịch vụ mà thú cưng của bạn cần.
            </p>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(services.length > 0 ? services : fallbackServices).map(
                (service, index) => (
                  <Card
                    key={index}
                    className="group hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white relative overflow-hidden"
                  >
                    <div className="p-4">
                      {/* Header with icon and category */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            {service.icon ? (
                              <service.icon className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <Stethoscope className="w-6 h-6 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <Link to={`/services/${service.id || index}`}>
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-emerald-600 transition-colors">
                                {service.name || service.title}
                              </h3>
                            </Link>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              Dịch vụ chăm sóc
                            </span>
                          </div>
                        </div>
                        {service.popular && (
                          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                            Phổ biến
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-2">
                        {service.description}
                      </p>

                      {/* Service details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration || "30-60 phút"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Phù hợp: Chó, Mèo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="w-4 h-4" />
                          <span>Bảo hiểm: Có hỗ trợ</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">
                          (4.8)
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          120 đánh giá
                        </span>
                      </div>

                      {/* Price and action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-2xl font-bold text-emerald-600">
                            {service.price
                              ? typeof service.price === "number"
                                ? formatVND(service.price)
                                : service.price
                              : "Liên hệ"}
                          </span>
                          {service.comparePrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {typeof service.comparePrice === "number"
                                ? formatVND(service.comparePrice)
                                : service.comparePrice}
                            </span>
                          )}
                        </div>
                        <Link to={`/services/${service.id || index}`}>
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            Đặt lịch
                            <Calendar className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ),
              )}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/services">
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                Xem tất cả dịch vụ
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Sản phẩm chất lượng cao
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Các sản phẩm chăm sóc thú cưng được tuyển chọn kỹ lưỡng từ những
                thương hiệu uy tín.
              </p>
            </div>
            <Link to="/products">
              <Button
                variant="outline"
                className="hidden md:flex border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                Xem tất cả
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div
                          key={j}
                          className="w-4 h-4 bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(products.length > 0 ? products : fallbackProducts).map(
                (product, index) => (
                  <Card
                    key={product.id || index}
                    className="group hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden bg-white"
                  >
                    <div className="relative">
                      <Link
                        to={`/products/${product.id || index}`}
                        className="block"
                      >
                        <img
                          src={
                            product.images?.[0]?.imageUrl ||
                            product.image ||
                            PRODUCT_FALLBACK_IMG
                          }
                          alt={product.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              PRODUCT_FALLBACK_IMG;
                          }}
                          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {product.category?.name ||
                          product.category ||
                          "Sản phẩm"}
                      </div>
                      {product.comparePrice &&
                        product.comparePrice > product.price && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            {formatDiscountPercentage(
                              product.comparePrice,
                              product.price,
                            )}
                          </div>
                        )}
                      {product.stockQuantity > 0 ? (
                        <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          Còn hàng
                        </div>
                      ) : (
                        <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          Hết hàng
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Product name and brand */}
                      <div className="mb-4">
                        <Link to={`/products/${product.id || index}`}>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight hover:text-emerald-600 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        {product.brand && (
                          <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                            {product.brand}
                          </span>
                        )}
                      </div>

                      {/* Short description */}
                      {product.shortDescription && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      )}

                      {/* Product features */}
                      {product.features && product.features.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {product.features
                              .slice(0, 2)
                              .map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                            {product.features.length > 2 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                +{product.features.length - 2} khác
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i <= Math.floor(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({product.rating || 4.5})
                        </span>
                        <span className="text-xs text-gray-500">
                          • 127 đánh giá
                        </span>
                      </div>

                      {/* Weight/Size info */}
                      {product.weight && (
                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                          <Package className="w-4 h-4" />
                          <span>Khối lượng: {product.weight}kg</span>
                        </div>
                      )}

                      {/* Price and actions */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-emerald-600">
                                {product.price
                                  ? formatVND(product.price)
                                  : "Liên hệ"}
                              </span>
                              {product.comparePrice &&
                                product.comparePrice > product.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatVND(product.comparePrice)}
                                  </span>
                                )}
                            </div>
                            {product.comparePrice &&
                              product.comparePrice > product.price && (
                                <span className="text-xs text-green-600 font-medium">
                                  {formatSavings(
                                    product.comparePrice,
                                    product.price,
                                  )}
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            to={`/products/${product.id || index}`}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            >
                              Xem chi tiết
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4"
                            disabled={product.stockQuantity <= 0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            title="Thêm vào giỏ hàng"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ),
              )}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/products">
              <Button
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                Xem tất cả sản phẩm
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white/95 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ của
              chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 border border-gray-100 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Chủ nhân của {testimonial.pet}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden z-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Pet care"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gray-900/70"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Sẵn sàng chăm sóc thú cưng của bạn?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Liên hệ ngay hôm nay và trải nghiệm dịch vụ chăm sóc thú cưng tốt
              nhất tại PetCare Hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button
                  size="lg"
                  className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Đặt lịch ngay
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  <Phone className="w-5 h-5 mr-2" />
                  Liên hệ tư vấn
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-6 h-6" />
              <div>
                <p className="font-semibold">Hotline 24/7</p>
                <p className="text-white/80">1900 1234</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-6 h-6" />
              <div>
                <p className="font-semibold">Email hỗ trợ</p>
                <p className="text-white/80">support@petcarehub.com</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-6 h-6" />
              <div>
                <p className="font-semibold">Địa chỉ</p>
                <p className="text-white/80">
                  Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
