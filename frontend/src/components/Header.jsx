import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { authService } from '@/services/authService';

export default function Header() {
  const user = authService.getCurrentUser() || { full_name: 'Minh Khang', username: 'khang' };

  // Tạo Avatar viết tắt (Ví dụ: Minh Khang -> MK)
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/trang-chu" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#43a047] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-gray-800 text-lg hidden sm:block">OLM</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium text-sm hidden md:block">
              Chấm trắc nghiệm
            </span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#43a047] text-white flex items-center justify-center font-bold text-xs shadow">
                {getInitials(user.full_name || user.username)}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                {user.full_name || user.username}
              </span>
            </div>

            {/* Nút Đăng xuất */}
            <button
              onClick={() => authService.logout()}
              title="Đăng xuất"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}