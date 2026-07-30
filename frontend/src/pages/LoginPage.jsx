import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { LogIn, Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { authService } from "@/services/authService.js";

export default function LoginPage() {
  const [username, setUsername] = useState('');  // ✅ Giữ username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);  // 👈 THÊM
  const [rememberMe, setRememberMe] = useState(true);       // 👈 THÊM
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // ✅ Kiểm tra username và password
    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ Username và Mật khẩu!');
      return;
    }

    setLoading(true);
    try {
      // ✅ Gọi login với username
      await authService.login(username, password);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {
      // ✅ Sửa lỗi chính tả: response (không phải respones)
      const errorMsg = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
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
              Đăng nhập để bắt đầu quản lý
            </p>
          </div>
        </div>

        {/* Right - Login Form */}
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
                Đăng nhập
              </h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tên đăng nhập hoặc email"
                  className="w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  className="w-full h-12 pl-12 pr-12 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#43a047] focus:bg-white focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#43a047] border-gray-300 rounded focus:ring-[#43a047]"
                  />
                  <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#43a047] font-semibold hover:text-[#2e7d32] hover:underline"
                >
                  Quên mật khẩu
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-xl hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="inline mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  className="text-[#43a047] font-semibold hover:text-[#2e7d32] hover:underline"
                >
                  Đăng ký
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}