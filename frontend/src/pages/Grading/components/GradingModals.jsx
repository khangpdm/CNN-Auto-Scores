import React, {useEffect, useState} from 'react';
import {Upload, X, Download, FileSpreadsheet, Loader2, KeyRound} from "lucide-react";
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