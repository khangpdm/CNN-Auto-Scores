import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/Exam/index.jsx';
import SessionPage from './pages/Session/index';
import AppLayout from "@/components/layout/AppLayout.jsx";
import GradingPage from './pages/Grading/index';
import ProfilePage from "@/pages/ProfilePage.jsx";

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<PublicRoute />}>
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/thong-tin-tai-khoan" element={<ProfilePage />} />
          <Route path="/ky-thi" element={<ExamPage />} />
          <Route path="/ky-thi/:id" element={<SessionPage />} />
          <Route path="/ky-thi/:examId/session/:sessionId" element={<GradingPage />} />
          {/*<Route path="/thong-tin-tai-khoan" element={<ProfilePage />} />*/}
          {/*<Route path="/cai-dat" element={<SettingsPage />} />*/}
        </Route>

        {/* Fallback - 404 */}
        {/*<Route path="*" element={<NotFoundPage />} />*/}
      </Routes>
    </>
  );
}