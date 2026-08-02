import React, { useEffect } from 'react';
import { X, Plus, FileText, Loader2, Edit } from 'lucide-react';

// Modal Tạo mới
export function CreateExamModal({
  isModalOpen,
  setIsModalOpen,
  examName,
  setExamName,
  handleCreateExam,
  isSubmitting,
  handleOverlayClick,
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setExamName('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, setIsModalOpen, setExamName]);

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#43a047]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Tạo kỳ thi mới</h2>
              <p className="text-xs text-gray-500">Nhập thông tin để tạo kỳ thi</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(false);
              setExamName('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên kỳ thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="VD: Kỳ thi thử THPT Quốc gia 2025"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateExam()}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Mã kỳ thi sẽ được tự động tạo từ tên bạn nhập.
              </p>
            </div>

            {examName.trim() && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Mã kỳ thi sẽ là:</p>
                <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1 rounded border border-gray-200">
                  {examName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .substring(0, 30)}
                </code>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              setIsModalOpen(false);
              setExamName('');
            }}
            className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleCreateExam}
            disabled={isSubmitting || !examName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Tạo kỳ thi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Chỉnh sửa
export function EditExamModal({
  isEditModalOpen,
  setIsEditModalOpen,
  editingExam,
  setEditingExam,
  editExamName,
  setEditExamName,
  editStatus,
  setEditStatus,
  handleUpdateExam,
  isEditSubmitting,
}) {
  if (!isEditModalOpen || !editingExam) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsEditModalOpen(false);
          setEditingExam(null);
          setEditExamName('');
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa kỳ thi</h2>
              <p className="text-xs text-gray-500">Cập nhật thông tin kỳ thi</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingExam(null);
              setEditExamName('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên kỳ thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editExamName}
                onChange={(e) => setEditExamName(e.target.value)}
                placeholder="VD: Kỳ thi thử THPT Quốc gia 2025"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateExam()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng thái
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="draft">Nháp</option>
                <option value="published">Xuất bản</option>
                <option value="grading">Đang chấm điểm</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                Chọn trạng thái hiện tại của kỳ thi
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Mã kỳ thi:</p>
              <code className="text-sm font-mono text-gray-700">
                {editingExam?.exam_code || '---'}
              </code>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingExam(null);
              setEditExamName('');
            }}
            className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isEditSubmitting}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleUpdateExam}
            disabled={isEditSubmitting || !editExamName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Edit className="w-5 h-5" />
                Cập nhật
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}