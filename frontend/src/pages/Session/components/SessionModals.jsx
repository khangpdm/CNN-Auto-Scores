import React, { useEffect } from 'react';
import {X, Plus, Calendar, Loader2, Edit, Trash2} from 'lucide-react';

export function CreateSessionModal({
    isModalOpen,
    setIsModalOpen,
    sessionName,
    setSessionName,
    sessionStatus,
    setSessionStatus,
    handleCreateSession,
    isSubmitting,
}) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isModalOpen) {
                setIsModalOpen(false);
                setSessionName('');
                setSessionStatus('draft');
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen, setIsModalOpen, setSessionName]);

    if (!isModalOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsModalOpen(false);
            setSessionName('');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#43a047]"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Tạo đợt thi mới</h2>
                            <p className="text-xs text-gray-500">Nhập thông tin để tạo đợt thi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsModalOpen(false);
                            setSessionName('');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="px-6 py-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tên đợt thi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="VD: Đợt 1 - Lớp 12A1"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={() => {
                            setIsModalOpen(false);
                            setSessionName('');
                        }}
                        className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={isSubmitting}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleCreateSession}
                        disabled={isSubmitting || !sessionName.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-lg hover:from-[#388e3c] hover:to-[#1b5e20] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin"/>
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5"/>
                                Tạo đợt thi
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
export function EditSessionModal({
    isEditModalOpen,
    setIsEditModalOpen,
    editingSession,
    setEditingSession,
    editSessionName,
    setEditSessionName,
    editStatus,
    setEditStatus,
    handleUpdateSession,
    isEditSubmitting,
}) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isEditModalOpen) {
                setIsEditModalOpen(false);
                setEditingSession(null);
                setEditSessionName('');
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isEditModalOpen, setIsEditModalOpen, setEditingSession, setEditSessionName]);

    if (!isEditModalOpen || !editingSession) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsEditModalOpen(false);
            setEditingSession(null);
            setEditSessionName('');
        }
    };

    return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa đợt thi</h2>
                  <p className="text-xs text-gray-500">Cập nhật thông tin đợt thi</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingSession(null);
                  setEditSessionName('');
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
                    Tên đợt thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSessionName}
                    onChange={(e) => setEditSessionName(e.target.value)}
                    placeholder="VD: Đợt 1 - Lớp 12A1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateSession()}
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
                    <option value="processing">Đang diễn ra</option>
                    <option value="grading">Đang chấm điểm</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Chọn trạng thái hiện tại của đợt thi
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Thông tin đợt thi:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{editingSession.name}</span>
                    {editingSession.code && (
                      <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {editingSession.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Ngày tạo: {new Date(editingSession.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingSession(null);
                  setEditSessionName('');
                }}
                className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isEditSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdateSession}
                disabled={isEditSubmitting || !editSessionName.trim()}
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

export function DeleteSessionModal({
    isDelModalOpen,
    setIsDelModalOpen,
    selectedSession,
    handleDelModal,
    isDeleting,
}) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isDelModalOpen) {
                setIsDelModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isDelModalOpen, setIsDelModalOpen]);

    if (!isDelModalOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsDelModalOpen(false);
        }
    };

    const handleClose = () => {
    setIsDelModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Xác nhận xóa</h2>
              <button
                onClick= {handleClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa đợt thi <strong>"{selectedSession.session_name}"</strong>?
              </p>
              <p className="text-sm text-red-500">
                Hành động này sẽ xóa tất cả dữ liệu liên quan bao gồm học sinh và kết quả chấm thi.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelModal}
                  disabled={isDeleting}
                  className="px-4 py-2.5 text-white font-semibold bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xóa đợt thi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
    )
}