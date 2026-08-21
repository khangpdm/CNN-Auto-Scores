import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, X, Star, ThumbsUp, Target, Zap,
  Layers, BarChart3, Download, Upload,
  Search, FileSpreadsheet, Play,
  Phone, Mail, HelpCircle, ArrowRight,
  User, LogOut, Settings
} from 'lucide-react';

// import logoImage from '@/assets/images/logo-marker-home.png';
import heroImage from '@/assets/header-image.png';
import {authService} from "@/services/authService.js";
import raw from '@/assets/raw.jpg';
import processed from '@/assets/processed.jpg';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsLoggedIn(isAuth);
      if (isAuth) {
        const userInfo = authService.getCurrentUser();
        setUser(userInfo);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const features = [
    {
      icon: ThumbsUp,
      title: 'Dễ dàng sử dụng',
      description: 'Thiết kế đơn giản, trực quan và dễ dàng sử dụng. Phù hợp cho cả thầy cô ít kinh nghiệm về giảng dạy'
    },
    {
      icon: Target,
      title: 'Độ chính xác cao',
      description: 'Ưu tiên tính chính xác, đảm bảo hỗ trợ hiệu quả cho thầy cô.'
    },
    {
      icon: Zap,
      title: 'Nhanh chóng và thuận tiện',
      description: 'Mang đến trải nghiệm tốt nhất, giúp thầy cô nhận được kết quả bài kiểm tra của học sinh gần như ngay lập tức.'
    },
    {
      icon: Layers,
      title: 'Đa dạng mẫu phiếu chấm',
      description: 'Cung cấp đầy đủ và đa dạng các mẫu phiếu phổ biến theo quy định của Bộ GD (Đặc biệt mẫu phiếu năm 2025).'
    },
    {
      icon: BarChart3,
      title: 'Thống kê thông minh',
      description: 'Thống kê thông minh, trực quan và dễ dàng đánh giá tổng quan năng lực của từng học sinh.'
    },
    {
      icon: Download,
      title: 'Xử lý kết quả đầu ra nhanh gọn',
      description: 'Xuất kết quả của học sinh thành các định dạng phổ biến (Excel, PDF), giúp việc lên điểm tiện lợi và nhanh chóng.'
    }
  ];

  const timelineSteps = [
    { step: '01', title: 'Import danh sách học sinh', icon: FileSpreadsheet },
    { step: '02', title: 'Import đáp án các mã đề', icon: Upload },
    { step: '03', title: 'Tải ảnh scan phiếu bài làm', icon: Search },
    { step: '04', title: 'Chấm bài hàng loạt', icon: FileSpreadsheet },
    { step: '05', title: 'Tải file thống kê', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-8">
              <span className="text-xl font-bold text-[#43a047]">ASC Marker</span>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Link to="/ky-thi" className="px-4 py-2 text-gray-600 hover:text-[#43a047] font-medium rounded-lg hover:bg-[#e8f5e9] transition-all">
                Kỳ thi
              </Link>
              <Link to="/huong-dan" className="px-4 py-2 text-gray-600 hover:text-[#43a047] font-medium rounded-lg hover:bg-[#e8f5e9] transition-all">
                Hướng dẫn
              </Link>
            </nav>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn && user ? (
                // ✅ ĐÃ ĐĂNG NHẬP - Hiển thị User Menu
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#43a047] to-[#2e7d32] flex items-center justify-center text-white font-semibold text-xl">
                      {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {/* Dropdown User Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to="/thong-tin-tai-khoan"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Thông tin tài khoản
                      </Link>
                      <Link
                        to="/ky-thi"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Kỳ thi của tôi
                      </Link>
                      <Link
                        to="/cai-dat"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Cài đặt
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // CHƯA ĐĂNG NHẬP - Hiển thị nút Đăng ký/Đăng nhập
                <>
                  <Link
                    to="/dang-ky"
                    className="px-5 py-2.5 text-[#43a047] font-semibold border-2 border-[#43a047] rounded-lg hover:bg-[#43a047] hover:text-white transition-all"
                  >
                    Đăng ký
                  </Link>
                  <Link
                    to="/dang-nhap"
                    className="px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-[#43a047]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4">
            <div className="flex flex-col gap-3">
              <Link to="/ky-thi" className="text-gray-700 hover:text-[#43a047] font-medium py-2">
                Kỳ thi
              </Link>
              <Link to="/huong-dan" className="text-gray-700 hover:text-[#43a047] font-medium py-2">
                Hướng dẫn
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                {isLoggedIn && user ? (
                  // ✅ Đã đăng nhập - Mobile
                  <>
                    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#43a047] to-[#2e7d32] flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/thong-tin-tai-khoan"
                      className="text-center py-2.5 text-gray-700 font-medium border border-gray-200 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Thông tin tài khoản
                    </Link>
                    <Link
                      to="/ky-thi"
                      className="text-center py-2.5 text-gray-700 font-medium border border-gray-200 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Kỳ thi của tôi
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-center py-2.5 text-red-600 font-medium border border-red-200 rounded-lg"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  // ❌ Chưa đăng nhập - Mobile
                  <>
                    <Link
                      to="/dang-ky"
                      className="text-center py-2.5 text-[#43a047] font-semibold border-2 border-[#43a047] rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng ký
                    </Link>
                    <Link
                      to="/dang-nhap"
                      className="text-center py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#e8f5e9] via-[#c8e6c9] to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
                Phần mềm chấm trắc nghiệm theo mẫu đề thi THPT cũ
              </h1>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-[#43a047] fill-[#43a047]" />
                  Giảm thiểu tối đa công sức chấm thi trắc nghiệm
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-[#43a047] fill-[#43a047]" />
                  Chấm tự động, sử dụng công nghệ xử lý ảnh độ chính xác cao
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-[#43a047] fill-[#43a047]" />
                  Đảm bảo tính công bằng trong chấm thi trắc nghiệm
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-[#43a047] fill-[#43a047]" />
                  Có công cụ chỉnh sửa ảnh lỗi, chấm lại bài thi lỗi
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-[#43a047] fill-[#43a047]" />
                  Dễ dàng quản lý, xử lý kết quả qua file thống kê (excel)
                </li>
              </ul>
              <Link
                to="/ky-thi"
                className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold bg-gradient-to-r
                from-[#43a047] to-[#2e7d32] rounded-xl hover:from-[#388e3c] hover:to-[#1b5e20] transition-all
                shadow-lg hover:shadow-xl"
              >
                <span className="Tạo text-xl">+</span>
                Tạo & quản lý kỳ thi
              </Link>
            </div>

            {/* Hero Image */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <img
                src={heroImage}
                alt="Chấm trắc nghiệm trực tuyến"
                className="w-full max-w-lg object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Các tính năng nổi bật
            </h2>
            <p className="text-gray-600">
              Phần mềm chấm trắc nghiệm ASC Marker hỗ trợ đầy đủ theo mẫu đề thi THPT 2025 của Bộ GD&ĐT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TIMELINE SECTION ===== */}
      <section className="py-20 bg-gradient-to-b from-white to-[#e8f5e9]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Quy trình chấm trắc nghiệm
            </h2>
            <p className="text-gray-600">Chấm trắc nghiệm tự động hàng loạt chỉ với 5 bước.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Connector line */}
                  {index < timelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-[#43a047]/30" />
                  )}

                  <div className="relative z-10 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 mx-auto bg-[#e8f5e9] rounded-full flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#43a047]" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{step.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== NEWS SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Bảng tin mới
              </h2>
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#43a047] font-bold">•</span>
                  <p>
                    Các mẫu trắc nghiệm chấm trên ASC Marker: {' '}
                    <a href="https://drive.google.com/drive/folders/1p-syZ-YsEzwCXVWbSUumMVD6HxwCPHdG?usp=sharing"
                     className="text-[#43a047] font-semibold hover:underline">
                      Tải các mẫu phiếu tại đây.
                    </a>
                  </p>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#43a047] font-bold">•</span>
                  <p>
                    Hướng dẫn chấm thi mẫu phiếu, chấm cùng lúc nhiều môn, nhiễu mã đề.{' '}
                    <a href="#" className="text-[#43a047] font-semibold hover:underline">
                      Xem hướng dẫn tại đây.
                    </a>
                  </p>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#43a047] font-bold">•</span>
                  <p>
                    Hướng dẫn chấm thi trắc nghiệm.{' '}
                    <a href="#" className="text-[#43a047] font-semibold hover:underline">
                      xem tại đây.
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src={processed}
                alt="Bảng tin mới"
                className="w-full max-w-md object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Video hướng dẫn
            </h2>
            <p className="text-gray-600">
              Thầy cô chưa nắm rõ cách sử dụng ASC Marker? Xem video hướng dẫn để sử dụng các tính năng tuyệt vời của phần mềm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Video 1 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src=""
                  title="Video hướng dẫn 1"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            {/* Video 2 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src=""
                  title="Video hướng dẫn 2"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SUPPORT SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Hỗ trợ
            </h2>
            <p className="text-gray-600">
              Thầy cô cần trao đổi về ứng dụng? Hãy liên hệ ngay với chúng tôi. Đội ngũ hỗ trợ ASC luôn sẵn sàng trả lời thầy cô.
            </p>
          </div>

          {/*<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">*/}
          <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-[#43a047] to-[#2e7d32] py-3 text-center">
                <h3 className="text-lg font-bold text-white">Thông tin về ASC</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-[#43a047] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Điện thoại/zalo hỗ trợ</p>
                    <p className="text-gray-600">0879954823</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-[#43a047] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Địa chỉ liên hệ</p>
                    <p className="text-gray-600">
                      Thành Phố Hồ Chí Minh.
                      <br />
                      Email: phamdangminhkhang@gmail.com
                    </p>
                  </div>
                </div>
                {/*<div className="text-center pt-2 border-t border-gray-100">*/}
                {/*  <p className="font-semibold text-gray-700 mb-2">Nhóm Zalo hỗ trợ</p>*/}
                {/*  <a*/}
                {/*    href=""*/}
                {/*    target="_blank"*/}
                {/*    rel="noopener noreferrer"*/}
                {/*    className="text-[#43a047] font-semibold hover:underline"*/}
                {/*  >*/}
                {/*    */}
                {/*  </a>*/}
                {/*</div>*/}
              </div>
            </div>

            {/* Registration Form */}
            {/*<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">*/}
            {/*  <div className="bg-[#f48220] py-3 text-center">*/}
            {/*    <h3 className="text-lg font-bold text-white">Đăng ký tư vấn</h3>*/}
            {/*  </div>*/}
            {/*  <div className="p-6">*/}
            {/*    <form className="space-y-4">*/}
            {/*      <input*/}
            {/*        type="text"*/}
            {/*        placeholder="Họ và tên *"*/}
            {/*        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all"*/}
            {/*        required*/}
            {/*      />*/}
            {/*      <input*/}
            {/*        type="tel"*/}
            {/*        placeholder="Số điện thoại *"*/}
            {/*        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all"*/}
            {/*        required*/}
            {/*      />*/}
            {/*      <textarea*/}
            {/*        placeholder="Yêu cầu thêm (nếu có)"*/}
            {/*        rows="3"*/}
            {/*        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all resize-none"*/}
            {/*      />*/}
            {/*      <button*/}
            {/*        type="submit"*/}
            {/*        className="w-full py-3 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl"*/}
            {/*      >*/}
            {/*        GỬI ĐĂNG KÝ*/}
            {/*      </button>*/}
            {/*    </form>*/}
            {/*  </div>*/}
            {/*</div>*/}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            ASC Marker là một sản phẩm giúp rút ngắn thời gian chấm thi cho giáo viên.
          </p>
          {/*<p className="text-gray-600">*/}
          {/*  Vui lòng{' '}*/}
          {/*  <a href="#" className="text-[#43a047] font-semibold hover:underline">*/}
          {/*    click vào đây*/}
          {/*  </a>{' '}*/}
          {/*  để khám phá thêm các tính năng khác.*/}
          {/*</p>*/}
        </div>
      </footer>
    </div>
  );
}