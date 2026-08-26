import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User, Mail, UserCircle, Calendar, Shield, Edit3,
  Save, X, Loader2, Key, Phone, CheckCircle, AlertCircle,
  ArrowLeft, Home
} from 'lucide-react';
import { authService } from '@/services/authService';
import {api} from "@/api.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Lấy thông tin user
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getMe();
        const userData = response.data;
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          email: userData.email || '',
        });
      } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        if (error.response?.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          navigate('/dang-nhap');
        } else {
          toast.error('Không thể tải thông tin tài khoản!');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Cập nhật thông tin
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/api/v1/auth/profile', {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
      });
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);

      const response = await authService.getMe();
      setUser(response.data);
      authService.updateUserInfo(response.data);

    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      toast.error(error.response?.data?.detail || 'Không thể cập nhật thông tin!');
    } finally {
      setIsSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/api/v1/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      toast.error(error.response?.data?.detail || 'Không thể đổi mật khẩu!');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Quản trị viên',
      teacher: 'Giáo viên',
      student: 'Học sinh',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      teacher: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-[#43a047]" />
          <p className="mt-3 text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <p className="mt-3 text-gray-600">Không thể tải thông tin tài khoản</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 text-white bg-[#43a047] rounded-lg hover:bg-[#2e7d32]"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-[#43a047] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Thông tin tài khoản</h1>
          <p className="text-gray-500 mt-1">Quản lý thông tin cá nhân và bảo mật</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - User Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#43a047] to-[#2e7d32] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {getInitials(user.full_name || user.username)}
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-800">
                {user.full_name || user.username}
              </h2>
              <p className="text-gray-500 text-sm">@{user.username}</p>

              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="text-left space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                  {user.created_at && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[#43a047] border border-[#43a047] rounded-lg hover:bg-[#e8f5e9] transition-colors text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                <Key className="w-4 h-4" />
                Đổi mật khẩu
              </button>
            </div>
          </div>

          {/* Right - Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {isEditing ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#43a047]" />
                    Chỉnh sửa thông tin
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#43a047] focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#43a047] focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2.5 text-white font-semibold bg-[#43a047] rounded-lg hover:bg-[#2e7d32] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#43a047]" />
                    Thông tin chi tiết
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Họ và tên</p>
                        <p className="text-gray-800 font-medium mt-1">{user.full_name || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Tên đăng nhập</p>
                        <p className="text-gray-800 font-medium mt-1">@{user.username}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="text-gray-800 font-medium mt-1">{user.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Vai trò</p>
                        <p className="text-gray-800 font-medium mt-1">{getRoleLabel(user.role)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Security Info */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Bảo mật tài khoản</p>
                  <p className="text-sm text-yellow-700">
                    Để bảo vệ tài khoản, bạn nên đổi mật khẩu định kỳ và không chia sẻ với người khác.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Đổi mật khẩu
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    old_password: '',
                    new_password: '',
                    confirm_password: '',
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu cũ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-400 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      old_password: '',
                      new_password: '',
                      confirm_password: '',
                    });
                  }}
                  className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2.5 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}