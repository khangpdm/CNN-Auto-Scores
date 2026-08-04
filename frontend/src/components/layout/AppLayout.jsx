import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dùng chung */}
      <Header />

      {/* Nội dung trang sẽ thay đổi linh */}
      <main className="pb-12">
        <Outlet />
      </main>
    </div>
  );
}