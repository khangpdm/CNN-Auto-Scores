import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UserPlus, Loader2, User, Mail, Lock, UserCircle,
  AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft
} from 'lucide-react';

import { authService } from '@/services/authService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ===== VALIDATION RULES =====
  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Vui lòng nhập họ và tên';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return '';

      case 'username':
        if (!value.trim()) return 'Vui lòng nhập tên đăng nhập';
        if (value.trim().length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới';
        return '';

      case 'email':
        if (!value.trim()) return 'Vui lòng nhập email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ (ví dụ: user@example.com)';
        return '';

      case 'password':
        if (!value) return 'Vui lòng nhập mật khẩu';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        if (!/(?=.*[a-z])/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
        if (!/(?=.*[A-Z])/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
        if (!/(?=.*\d)/.test(value)) return 'Mật khẩu phải có ít nhất 1 số';
        return '';

      case 'confirmPassword':
        if (!value) return 'Vui lòng xác nhận mật khẩu';
        if (value !== formData.password) return 'Mật khẩu xác nhận không khớp';
        return '';

      default:
        return '';
    }
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateAll()) {
      toast.error('Vui lòng kiểm tra lại thông tin đăng ký!');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
      });

      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/dang-nhap');
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Đăng ký thất bại. Email hoặc tên đăng nhập có thể đã được sử dụng!';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const hasError = (name) => touched[name] && errors[name];

  const getPasswordRequirements = (password) => {
    return {
      minLength: password.length >= 6,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const passwordRequirements = getPasswordRequirements(formData.password);
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7] p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 gap-0 relative">
        {/* 👉 Nút quay về trang chủ */}
        <Link
          to="/"
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#43a047] bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Về trang chủ</span>
          <span className="sm:hidden">Trang chủ</span>
        </Link>

        {/* Left - Decorative Background */}
        <div className="hidden md:flex bg-gradient-to-br from-[#66bb6a] to-[#388e3c] p-12 items-center justify-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5"></div>

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

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="full_name"
                    type="text"
                    placeholder="Họ và tên"
                    className={`w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 rounded-xl transition-all focus:outline-none ${
                      hasError('full_name')
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : touched.full_name && !errors.full_name && formData.full_name
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#43a047] focus:bg-white'
                    }`}
                    value={formData.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                  />
                  {hasError('full_name') && (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {touched.full_name && !errors.full_name && formData.full_name && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {hasError('full_name') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="username"
                    type="text"
                    placeholder="Tên đăng nhập"
                    className={`w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 rounded-xl transition-all focus:outline-none ${
                      hasError('username')
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : touched.username && !errors.username && formData.username
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#43a047] focus:bg-white'
                    }`}
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                  />
                  {hasError('username') && (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {touched.username && !errors.username && formData.username && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {hasError('username') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className={`w-full h-12 pl-12 pr-4 text-gray-700 bg-gray-50 border-2 rounded-xl transition-all focus:outline-none ${
                      hasError('email')
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : touched.email && !errors.email && formData.email
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#43a047] focus:bg-white'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                  />
                  {hasError('email') && (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {touched.email && !errors.email && formData.email && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {hasError('email') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    className={`w-full h-12 pl-12 pr-12 text-gray-700 bg-gray-50 border-2 rounded-xl transition-all focus:outline-none ${
                      hasError('password')
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : touched.password && !errors.password && formData.password
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#43a047] focus:bg-white'
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {hasError('password') && (
                    <AlertCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {hasError('password') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}

                {touched.password && formData.password && !allRequirementsMet && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Yêu cầu mật khẩu:</p>
                    <ul className="space-y-0.5">
                      <li className="flex items-center gap-1.5 text-xs">
                        {passwordRequirements.minLength ?
                          <CheckCircle className="w-3 h-3 text-green-500" /> :
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        }
                        <span className={passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}>
                          Ít nhất 6 ký tự
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        {passwordRequirements.hasLowercase ?
                          <CheckCircle className="w-3 h-3 text-green-500" /> :
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        }
                        <span className={passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}>
                          Ít nhất 1 chữ thường (a-z)
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        {passwordRequirements.hasUppercase ?
                          <CheckCircle className="w-3 h-3 text-green-500" /> :
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        }
                        <span className={passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}>
                          Ít nhất 1 chữ hoa (A-Z)
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        {passwordRequirements.hasNumber ?
                          <CheckCircle className="w-3 h-3 text-green-500" /> :
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        }
                        <span className={passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                          Ít nhất 1 số (0-9)
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu"
                    className={`w-full h-12 pl-12 pr-12 text-gray-700 bg-gray-50 border-2 rounded-xl transition-all 
                    focus:outline-none ${
                      hasError('confirmPassword')
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#43a047] focus:bg-white'
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {hasError('confirmPassword') && (
                    <AlertCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {hasError('confirmPassword') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
                {touched.confirmPassword && formData.confirmPassword && !errors.confirmPassword && (
                  <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Mật khẩu xác nhận khớp
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32]
                rounded-xl hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl
                disabled:opacity-70 disabled:cursor-not-allowed mt-2"
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