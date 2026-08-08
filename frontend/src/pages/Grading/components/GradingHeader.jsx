import React from 'react';
import {ArrowLeft} from 'lucide-react';
import {Link} from "react-router-dom";
import {
    FileText,
    Users, TrendingUp,
    CheckCircle
} from 'lucide-react';
// Cấu hình trạng thái
const statusConfig = {
    draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800'},
    active: { label: 'Đang diên ra', color: 'bg-blue-100 text-blue-800'},
    grading: { label: 'Đang chấm điểm', color: 'bg-purple-100 text-purple-800'},
    completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800'},
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
    session,
    totalStudents = 0,
    totalGraded = 0,
    examId,
}) {
  if (!session) return null;

  const statusBadge = statusConfig[session.status] || statusConfig.draft;

  return (
      <>
        {/* ===== BREADCRUMB ===== */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-[#43a047]">Trang chủ</Link>
          <span>/</span>
          <Link to="/ky-thi" className="hover:text-[#43a047]">Kỳ thi</Link>
          <span>/</span>
          <Link to={`/ky-thi/${examId}`} className="hover:text-[#43a047]">
            {session.exam_name || 'Kỳ thi'}
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {session.session_name || 'Đợt thi'}
          </span>
        </div>

        {/* ===== NÚT QUAY LẠI ===== */}
        <Link
          to={`/ky-thi/${examId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#43a047] font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại kỳ thi
        </Link>

        {/* ===== HEADER THÔNG TIN ĐỢT THI ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-800 truncate">
                    {session.session.session_name || 'Đợt thi'}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  {session.code && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {session.session.session_code}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Kỳ thi: {session.exam_name}
                </p>
                <p className="text-sm text-gray-500">
                  Ngày tạo: {formatDate(session.session.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* ===== THỐNG KÊ NHANH ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalStudents || 0}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Học sinh
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalGraded || 0}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Đã chấm
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{session.total_questions || 0}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Câu hỏi
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{session.max_score || 10}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Điểm tối đa
              </p>
            </div>
          </div>
        </div>
      </>
  );
}