import React, {useEffect, useState} from 'react';
import {Upload, X, Download, FileSpreadsheet, Loader2, KeyRound, AlertTriangle, Edit3, Save} from "lucide-react";
import {toast} from "sonner";

export function ImportStudentModal ({
    isOpen,
    onClose,
    onUpload,
    downloadTemplate,
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if(!isOpen) return null;

    const handleClose = () => {
        setSelectedFile(null);
        onClose();
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type) &&
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')) {
        toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    };

    const handleImport = async () => {
        if (!selectedFile) {
          toast.error('Vui lòng chọn file để import!');
          return;
        }

        setIsUploading(true);
        try {
          await onUpload(selectedFile);
          toast.success('Import học sinh thành công!');
          handleClose();
        } catch (error) {

        } finally {
          setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#43a047]" />
                Import danh sách học sinh
              </h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Hướng dẫn */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">📌 Hướng dẫn:</p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc pl-5">
                  <li>Tải mẫu file import để biết định dạng</li>
                  <li>File import phải là định dạng .xlsx hoặc .xls</li>
                  <li>Các cột bắt buộc: SBD, Họ và tên</li>
                  <li>Dữ liệu trùng sẽ được bỏ qua</li>
                </ul>
              </div>

              {/* Tải mẫu */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Tải mẫu file import
              </button>

              {/* Zone Chọn file / Kéo thả */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#43a047] transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#43a047]" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Kéo thả file vào đây hoặc</p>
                    <label className="cursor-pointer">
                      <span className="text-[#43a047] font-medium hover:underline">
                        chọn file từ máy tính
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      Hỗ trợ: .xlsx, .xls
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2.5 text-white font-semibold bg-[#43a047] rounded-lg hover:bg-[#2e7d32] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}

export function ImportAnswerModal({
    isOpen,
    onClose,
    onUpload,
    onSuccess,
}){
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

        const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (!validTypes.includes(file.type) &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls')) {
            toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            e.target.value = '';
            return;
        }
        setSelectedFile(file);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Vui lòng chọn file để import!');
            return;
        }

        setIsUploading(true);
        try{
            if (onUpload) await onUpload(selectedFile);
            setSelectedFile(null);
            if (onSuccess) onSuccess();
        } catch (error) {

        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        onClose();
    };


    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/public/dap_an.xlsx';
        link.download = 'dap_an.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#43a047]" />
                Import đáp án
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Hướng dẫn */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">📌 Hướng dẫn:</p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc pl-5">
                  <li>Tải file mẫu để biết cấu trúc</li>
                  <li>File phải có định dạng .xlsx hoặc .xls</li>
                  <li>Hỗ trợ import nhiều mã đề trong 1 file</li>
                </ul>
              </div>

              {/* Tải mẫu */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Tải mẫu file import
              </button>

              {/* Chọn file */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#43a047] transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#43a047]" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Kéo thả file vào đây hoặc</p>
                    <label className="cursor-pointer">
                      <span className="text-[#43a047] font-medium hover:underline text-sm">
                        chọn file từ máy tính
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Hỗ trợ: .xlsx, .xls</p>
                  </div>
                )}
              </div>

              {/* Nút action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2.5 text-white font-semibold bg-[#43a047] hover:bg-[#388e3c] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
    )
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Bạn có chắc chắn muốn xóa không?",
  confirmText = "Xóa",
  isDanger = false // true nếu muốn style màu đỏ đậm cho hành động nguy hiểm (như Xóa tất cả)
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg max-w-md w-full p-6 shadow-xl ${isDanger ? 'border-t-4 border-red-800' : ''}`}>
        <h2 className={`text-xl font-bold mb-2 ${isDanger ? 'text-red-700' : 'text-gray-900'}`}>
          {title}
        </h2>

        <p className="text-gray-600 mb-6">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition"
          >
            Hủy
          </button>

          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md font-medium transition ${
              isDanger 
                ? 'bg-red-800 hover:bg-red-900' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditResultModal({
  isOpen,
  result,
  formData,
  isSubmitting,
  isFetchingStudent,
  isFetchingAnswerKey,
  onClose,
  onStudentCodeChange,
  onTestCodeChange,
  onAnswerChange,
  onSave,
  calculateScore,
  getScoreColor,
}){
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-600" />
            Chỉnh sửa chi tiết thông minh
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SBD <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.student_code || ''}
                  onChange={(e) => onStudentCodeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
                  placeholder="VD: 312341"
                />
                {isFetchingStudent && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Nhập SBD để tự động tìm tên học sinh
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.student_name || ''}
                onChange={(e) => onStudentCodeChange(e.target.value, 'name')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã đề <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.test_code || ''}
                onChange={(e) => onTestCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
                placeholder="VD: 156"
              />
              {isFetchingAnswerKey && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Nhập mã đề để tự động lấy đáp án và chấm lại
            </p>
          </div>

          {/* Đáp án từng câu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Đáp án từng câu
              </label>
              <span className="text-xs text-gray-400">
                {Object.keys(formData.answers || {}).length} câu
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto border border-gray-200">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {Object.entries(formData.answers || {}).map(([question, answer]) => (
                  <div key={question} className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Câu {question}:</span>
                    <input
                      type="text"
                      maxLength={1}
                      value={answer || ''}
                      onChange={(e) => onAnswerChange(question, e.target.value)}
                      className="w-10 px-1 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 text-sm font-bold uppercase"
                      placeholder="?"
                    />
                  </div>
                ))}
              </div>
              {Object.keys(formData.answers || {}).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">
                  Chưa có đáp án. Nhập mã đề để tự động lấy đáp án.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Sửa đáp án từng câu để cập nhật điểm tự động
            </p>
          </div>

          {/* Điểm tính tự động */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Điểm tự động:</span>
              <span className={`text-lg font-bold ${getScoreColor(calculateScore())}`}>
                {calculateScore().toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Điểm được tính tự động dựa trên số câu đã nhập đáp án
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700 flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong>
                <br />• Sửa SBD sẽ tự động tìm tên học sinh
                <br />• Sửa mã đề sẽ tự động lấy đáp án và cập nhật điểm
                <br />• Sửa đáp án từng câu sẽ tự động tính lại điểm
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-white font-semibold bg-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageModal({ isOpen, imageUrl, title, onClose }){
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Hàm lấy URL mới để tránh cache
  const getFreshImageUrl = (url) => {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${new Date().getTime()}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative max-w-5xl max-h-[90vh] mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-700">{title || 'Ảnh bài làm'}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <img
              src={imageUrl ? getFreshImageUrl(imageUrl) : '/placeholder-image.png'}
              alt={title || 'Ảnh bài làm'}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}