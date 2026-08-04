import React from 'react';
import {ArrowLeft} from 'lucide-react';
import {Link} from "react-router-dom";
import {Clock, CheckCircle} from 'lucide-react';
// Cấu hình trạng thái
const statusConfig = {
  draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  published: { label: 'Xuất bản', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  grading: { label: 'Đang chấm điểm', color: 'bg-purple-100 text-purple-800', icon: Clock },
  completed: { label: 'Đã hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const formatDate = (dateString) => {
  if (!dateString) return '---';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function SessionHeader({
    exam,
    sessions = [],
    totalStudents = 0,
    totalGraded = 0,
}) {
  if (!exam) return null;

  const status = exam.status || 'pending';
  const statusConfigItem = statusConfig[status] || statusConfig.draft;
  const StatusIcon = statusConfigItem.icon;

  return (
      <>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-[#43a047] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/ky-thi" className="hover:text-[#43a047] transition-colors">Kỳ thi</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{exam.exam_name}</span>
        </div>

        <Link
          to="/ky-thi"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#43a047] font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>

        {/* Thông tin kỳ thi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-800">{exam.exam_name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfigItem.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfigItem.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Mã: {exam.exam_code || '---'}</p>
                <p className="text-sm text-gray-500">Ngày tạo: {formatDate(exam.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
              <p className="text-sm text-gray-500">Đợt thi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
              <p className="text-sm text-gray-500">Học sinh</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalGraded}</p>
              <p className="text-sm text-gray-500">Đã chấm</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Hoàn thành</p>
            </div>
          </div>
        </div>
      </>
  );
}