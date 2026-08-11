import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    KeyRound, Plus, FileCheck, Upload, Download, Loader2,
    X, FileSpreadsheet, Trash2, Edit3
} from "lucide-react";

export default function AnswerKeyTab({
    sessionId,
    answerKeys = [],
    loading = false,
    onUpload,
    onDelete,
    onRefresh,
}) {
    const [selectedKeyId, setSelectedKeyId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (answerKeys.length > 0){
            const exists = answerKeys.some(k => k.id === selectedKeyId);
            if (!selectedKeyId || !exists) {
                setSelectedKeyId(answerKeys[0].id);
            }
        } else {
            setSelectedKeyId(null);
        }
    }, [answerKeys, selectedKeyId]);

    const currentKey = answerKeys.find(k => k.id === selectedKeyId) || answerKeys[0];
    const answerEntries = currentKey?.answers ? Object.entries(currentKey.answers) : [];

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
            await onUpload(selectedFile);
            setIsModalOpen(false);
            setSelectedFile(null);
            if (onRefresh) onRefresh();
        } catch (error) {

        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteCurrentKey = async () => {
        if (!currentKey) return;
        if (!window.confirm(`Bạn có chắc muốn xóa đáp án của mã đề "${currentKey.test_code}"?`)) return;

        try{
            await onDelete(currentKey.id);
        } catch (error) {

        }
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
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#43a047]" />
            Quản lý Đáp án
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cấu hình đáp án cho các mã đề thi để hệ thống tự động chấm điểm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#43a047] hover:bg-[#388e3c] rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm đáp án
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
          <p className="text-sm text-gray-500 mt-2">Đang tải danh sách đáp án...</p>
        </div>
      ) : answerKeys.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <FileCheck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h4 className="text-base font-semibold text-gray-700">Chưa có đáp án nào</h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
            Đợt thi này chưa được cấu hình đáp án. Vui lòng tải file Excel đáp án.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#43a047] bg-[#e8f5e9] rounded-lg hover:bg-[#c8e6c9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm đáp án ngay
          </button>
        </div>
      ) : (
        /* Main Layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Mã đề */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Danh sách mã đề ({answerKeys.length})
            </span>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {answerKeys.map((key) => {
                const isSelected = currentKey?.id === key.id;
                const answerCount = key.answers ? Object.keys(key.answers).length : 0;

                return (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKeyId(key.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#e8f5e9] border-[#43a047] text-[#2e7d32] font-semibold shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck className={`w-4 h-4 ${isSelected ? 'text-[#43a047]' : 'text-gray-400'}`} />
                      Mã đề: {key.code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 font-normal">
                      {answerCount} câu
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết câu hỏi */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-3">
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  Đáp án chi tiết - Mã đề: <span className="text-[#43a047]">{currentKey?.code}</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tổng số: {currentKey?.total_questions || answerEntries.length} câu trắc nghiệm
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.info(`Sửa đáp án mã đề ${currentKey?.code}`)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleDeleteCurrentKey}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa
                </button>
              </div>
            </div>

            {/* Hiển thị đáp án dạng grid */}
            {answerEntries.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {answerEntries.map(([qNum, answer]) => (
                  <div
                    key={qNum}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm hover:border-[#43a047] transition-colors"
                  >
                    <span className="font-semibold text-gray-600">Câu {qNum}:</span>
                    <span className="font-bold text-[#2e7d32] bg-[#e8f5e9] px-2.5 py-0.5 rounded-md border border-[#a5d6a7]">
                      {answer}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                Không tìm thấy danh sách câu hỏi cho mã đề này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL IMPORT ===== */}
      {isModalOpen && (
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
      )}
    </div>
  );
}