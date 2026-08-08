import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/Exam/index.jsx';
import SessionPage from './pages/Session/index';
import AppLayout from "@/components/layout/AppLayout.jsx";
import GradingPage from './pages/Grading/index';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/" element={<Navigate to="/trang-chu" replace />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/trang-chu" element={<HomePage />} />

        <Route element={<AppLayout/>}>
            <Route path="/ky-thi" element={<ExamPage />} />
            <Route path="/ky-thi/:id" element={<SessionPage />} />
            <Route path="/ky-thi/:examId/session/:sessionId" element={<GradingPage />} />
        </Route>
      </Routes>
    </>
  );
}