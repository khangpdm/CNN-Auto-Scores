import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LogIn, UserPlus, User } from 'lucide-react';
import { authService } from '@/services/authService';

export default function Header() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsLoggedIn(isAuth);
      if (isAuth) {
        setUser(authService.getCurrentUser());
      } else {
        setUser(null);
      }
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsLoggedIn(false);
      setUser(null);
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#43a047] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-gray-800 text-lg hidden sm:block">ASC</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium text-sm hidden md:block">
              Chấm trắc nghiệm
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#43a047] text-white flex items-center justify-center font-bold text-xs shadow">
                  {getInitials(user.full_name || user.username)}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {user.full_name || user.username}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dang-nhap"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#43a047] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
                <Link
                  to="/dang-ky"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#43a047] hover:bg-[#2e7d32] rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng ký</span>
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}