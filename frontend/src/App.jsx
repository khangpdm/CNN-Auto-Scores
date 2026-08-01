import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/Exam/index.jsx';

export default function App() {
  return (
    <>
      {/* Hiển thị thông báo Toast góc trên bên phải */}
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/" element={<Navigate to="/trang-chu" replace />} />
        <Route path="/trang-chu" element={<HomePage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/ky-thi" element={<ExamPage />} />

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