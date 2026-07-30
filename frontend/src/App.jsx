import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <>
      {/* Hiển thị thông báo Toast góc trên bên phải */}
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard tạm thời */}
        <Route
          path="/dashboard"
          element={
            <div className="p-8 text-center text-2xl font-bold">
              Trang Dashboard Quản Lý (Đã Đăng Nhập)
            </div>
          }
        />
      </Routes>
    </>
  );
}