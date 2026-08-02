import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Eye, Edit, Trash2, Copy, Plus, Loader2,
  ChevronLeft, ChevronRight, Clock, CheckCircle
} from 'lucide-react';

const statusConfig = {
  draft: {
    label: 'Nháp',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  published: {
    label: 'Xuất bản',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  grading: {
    label: 'Đang chấm điểm',
    color: 'bg-purple-100 text-purple-800',
    icon: Clock,
  },
  completed: {
    label: 'Đã hoàn thành',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
};

const getStatusBadge = (exam) => {
  const status = exam.status || 'draft';
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const getStatusDot = (exam) => {
  const status = exam.status || 'draft';
  const colors = {
    draft: 'bg-yellow-500 border-yellow-300 text-yellow-800',
    published: 'bg-blue-500 border-blue-300 text-blue-800',
    grading: 'bg-purple-500 border-purple-300 text-purple-800',
    completed: 'bg-green-500 border-green-300 text-green-800',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.draft}`} />;
};

const formatDate = (dateString) => {
  if (!dateString) return '---';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN');
  } catch {
    return dateString;
  }
};

export default function ExamTable({
  loading,
  currentExams,
  filteredExams,
  totalPages,
  currentPage,
  setCurrentPage,
  indexOfFirstItem,
  indexOfLastItem,
  setIsModalOpen,
  handleOpenEditModal,
  handleDeleteExam,
}) {
  if (loading) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
        <p className="mt-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (currentExams.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-600">Không tìm thấy kỳ thi nào</p>
        <p className="text-sm text-gray-400 mt-1">Hãy tạo kỳ thi mới để bắt đầu</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Tạo kỳ thi mới
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỳ thi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#43a047]" />
                    </div>
                    <div>
                      <Link
                        to={`/ky-thi/${exam.id}`}
                        className="font-semibold text-gray-800 hover:text-[#43a047] transition-colors"
                      >
                        {exam.exam_name || exam.name || 'Chưa có tên'}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        CODE: {exam.exam_code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusDot(exam)}
                    {getStatusBadge(exam)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {exam.exam_code || exam.code || '---'}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(exam.created_at || exam.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/ky-thi/${exam.id}`}
                      className="p-2 text-gray-400 hover:text-[#43a047] rounded-lg hover:bg-[#e8f5e9] transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </Link>
                    <button
                      onClick={() => handleOpenEditModal(exam)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                      title="Sao chép"
                    >
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.exam_name || exam.name)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredExams.length)} trong {filteredExams.length} kỳ thi
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#43a047] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}