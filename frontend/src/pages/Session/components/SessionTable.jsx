import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Edit, Trash2, Plus, Loader2,
  Calendar, Search, X
} from 'lucide-react';

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

export default function SessionTable({
  sessions = [],
  examId,
  loading = false,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState(sessions);

  // Tìm kiếm đợt thi
  const handleSearch = (keyword) => {
    setSearchTerm(keyword);
    if (!keyword.trim()) {
      setFilteredSessions(sessions);
      return;
    }
    const filtered = sessions.filter(session =>
      (session.session_name || session.name || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (session.code || '').toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredSessions(filtered);
  };

  // Cập nhật khi sessions thay đổi
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = sessions.filter(session =>
        (session.session_name || session.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  }, [sessions, searchTerm]);

  const getStatusBadge = (session) => {
    const status = session.status || 'processing';
    const statusMap = {
      completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      grading: { label: 'Đang chấm', color: 'bg-purple-100 text-purple-800' },
      processing: { label: 'Đang diễn ra', color: 'bg-blue-100 text-blue-800' },
      active: { label: 'Đang diễn ra', color: 'bg-blue-100 text-blue-800' },
      draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800' },
    };
    return statusMap[status] || statusMap.processing;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
        <p className="mt-2 text-gray-500">Đang tải danh sách đợt thi...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header của bảng - chỉ phần tiêu đề và tìm kiếm */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#43a047]" />
            Danh sách đợt thi
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredSessions.length} đợt)
            </span>
          </h2>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#43a047] text-white rounded-lg hover:bg-[#2e7d32] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tạo đợt thi
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đợt thi theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nội dung danh sách */}
      <div className="p-6">
        {filteredSessions.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-600">
              {searchTerm ? 'Không tìm thấy đợt thi' : 'Chưa có đợt thi nào'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Tạo đợt thi để bắt đầu tổ chức thi'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#43a047] text-white rounded-lg hover:bg-[#2e7d32] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo đợt thi đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSessions.map((session) => {
              const statusBadge = getStatusBadge(session);
              const sessionName = session.session_name || session.name || `Đợt thi ${session.code || session.id}`;

              return (
                <div
                  key={session.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-[#43a047] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          to={`/ky-thi/${examId}/session/${session.id}`}
                          className="font-semibold text-gray-800 hover:text-[#43a047] transition-colors"
                        >
                          {sessionName}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {session.code && (
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                            {session.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
                        <span>Ngày tạo: {formatDate(session.created_at)}</span>
                        <span>•</span>
                        <span>Học sinh: {session.student_count || 0}</span>
                        <span>•</span>
                        <span>Đã chấm: {session.graded_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/ky-thi/${examId}/session/${session.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[#43a047] border border-[#43a047] rounded-lg hover:bg-[#43a047] hover:text-white transition-all text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </Link>
                      <button
                        onClick={() => onEditClick(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => onDeleteClick(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}