import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus, Loader2, User, Mail, Lock, UserCircle } from 'lucide-react';

import { authService } from '@/services/authService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });

      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/dang-nhap');
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Đăng ký thất bại. Email có thể đã được sử dụng!';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7] p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 gap-0">
        {/* Left - Decorative Background */}
        <div className="hidden md:flex bg-gradient-to-br from-[#66bb6a] to-[#388e3c] p-12 items-center justify-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Hệ thống chấm thi AI
            </h2>
            <p className="text-white/80 text-lg">
              Đăng ký tài khoản để bắt đầu
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12 lg:p-16">
          <div className="max-w-sm mx-auto">
            {/* Logo và tiêu đề */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#43a047] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Đăng ký
              </h1>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="full_name"
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Username */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="username"
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="Mật khẩu"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-xl hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 h-5 w-5 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <UserPlus className="inline mr-2 h-5 w-5" /> Đăng ký
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600 pt-2">
                Đã có tài khoản?{' '}
                <Link
                  to="/dang-nhap"
                  className="text-[#43a047] font-semibold hover:text-[#2e7d32] hover:underline"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}