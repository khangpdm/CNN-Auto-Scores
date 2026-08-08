import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

export default function ExamHeader({
  isGuideOpen,
  setIsGuideOpen,
  setIsModalOpen
}) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
          <Link to="/" className="hover:text-[#43a047] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Kỳ thi</span>
        </div>

        {/* Header chính */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-[#43a047]" />
              Danh sách kỳ thi
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả các kỳ thi của bạn</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <HelpCircle className="w-5 h-5" />
              Hướng dẫn
              {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Tạo kỳ thi mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}