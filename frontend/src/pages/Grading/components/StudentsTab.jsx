import React, {useState} from 'react';
import { Users, Upload, Trash2, Search, X, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { ImportStudentModal, ConfirmDeleteModal } from './GradingModals';

export default function StudentsTab({
  sessionId,
  students = [],
  loading = false,
  pagination = null,
  onSearch,
  onUpload,
  onDelete,
  onDeleteAll,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        student: null,
        isDanger: false,
        isDeleting: false,
    });

    const handleSearch = (e) => {
      e.preventDefault();
      onSearch(searchTerm);
    };

    const handleClearSearch = () => {
      setSearchTerm('');
      onSearch('');
    };

    const handleDeleteClick = (student) => {
        setDeleteModal({
            isOpen: true,
            student: student,
            isDanger: false,
            isDeleting: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.student) return;

        setDeleteModal(prev => ({...prev, isDeleting: true}));
        try {
            await onDelete(deleteModal.student.id);
            setDeleteModal({
                isOpen:false,
                student: null,
                isDanger: false,
                isDeleting: false
            });
        } catch (errror) {

        } finally {
            setDeleteModal(prev => ({...prev, isDeleting: false}));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({isOpen: false, student: null, isDanger: false, isDeleting: false });
    };

    const handleDeleteAllClick = () => {
        if (students.length === 0) {
            toast.warning('Không có học sinh nào để xóa!');
            return;
        }

        setDeleteModal({
            isOpen: true,
            student: null,
            isDanger: true,
            isDeleting: false,
        });
    };

    const handleDeleteAllConfirm = async () => {
        setDeleteModal(prev => ({...prev, isDeleting: true}));
        try {
            await onDeleteAll();
            setDeleteModal({
                isOpen: false,
                student: null,
                isDanger: false,
                isDeleting: false,
            });
        } catch (error) {

        } finally {
            setDeleteModal(prev => ({...prev, isDeleting: false}));
        }
    };

    const downloadTemplate = () => {
      const link = document.createElement('a');
      link.href = '../../public/ds_thi_sinh.xlsx';
      link.download = 'ds_thi_sinh.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const formatDate = (date) => {
      if (!date) return '---';
      try {
        return new Date(date).toLocaleDateString('vi-VN');
      } catch {
        return date;
      }
    };


  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-[#43a047]" />
            Danh sách học sinh
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pagination?.total_records|| students.length || 0} học sinh)
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý danh sách học sinh tham gia đợt thi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải mẫu
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#43a047] text-white rounded-lg hover:bg-[#2e7d32] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={handleDeleteAllClick}
            disabled={isDeleting || students.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc SBD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43a047] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 text-white bg-[#43a047] rounded-lg hover:bg-[#2e7d32] transition-all"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
          <p className="mt-2 text-gray-500">Đang tải danh sách...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-600">Chưa có học sinh nào</p>
          <p className="text-sm text-gray-400 mt-1">
            Tải mẫu file import và nhập danh sách học sinh để bắt đầu
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải mẫu
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#43a047] text-white rounded-lg hover:bg-[#2e7d32] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import danh sách
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SBD</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giới tính</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {pagination ? (pagination.current_page - 1) * pagination.page_size + index + 1 : index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {student.student_code || student.sbd || '---'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {student.full_name || student.name || 'Chưa có tên'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.gender || '---'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.room || '---'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(student.dob || student.birthday)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteClick(student)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiển thị {students.length} / {pagination.total_records} học sinh
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => onSearch(searchTerm, pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.current_page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() => onSearch(searchTerm, pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={deleteModal.isDanger ? handleDeleteAllConfirm : handleDeleteConfirm}
        title={deleteModal.isDanger ? "Xóa tất cả học sinh" : "Xác nhận xóa"}
        description={
          deleteModal.isDanger
            ? "Bạn có chắc chắn muốn xóa TẤT CẢ học sinh trong danh sách? Hành động này không thể hoàn tác!"
            : `Bạn có chắc chắn muốn xóa học sinh "${deleteModal.student?.full_name || 'chưa có tên'}" (SBD: ${deleteModal.student?.student_code || '---'})?`
        }
        confirmText={deleteModal.isDanger ? "Xóa tất cả" : "Xóa"}
        isDanger={deleteModal.isDanger}
      />

      <ImportStudentModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onUpload={onUpload}
        downloadTemplate={downloadTemplate}
      />
    </div>
  );
}