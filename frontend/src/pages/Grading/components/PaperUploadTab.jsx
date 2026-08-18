import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Image, Upload, FileArchive, Loader2,
  X, CheckCircle, AlertCircle, FileImage,
  Trash2, Eye, File, FolderArchive,
  RefreshCw
} from 'lucide-react';

export default function PaperUploadTab({
  sessionId,
  papers = [],
  loading = false,
  scanBatchId = null,
  scanStatus = null,
  isScanning = false,
  onScan,
  onRefresh,
}) {
  // ===== STATE =====
  const [uploadMode, setUploadMode] = useState('single');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState(null);

  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);

  // Quản lý Blob Object URL preview để tránh Memory Leak
  useEffect(() => {
    if (uploadMode === 'zip' || selectedFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup memory khi chọn file mới hoặc tháo component
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles, uploadMode]);

  // ===== HANDLERS =====

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const isZip = files.some((f) => f.name.toLowerCase().endsWith('.zip'));
    if (isZip) {
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith('.zip'));
      handleZipUpload(zipFile);
    } else {
      const imageFiles = files.filter(
        (f) =>
          f.type.startsWith('image/') ||
          f.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
      );
      if (imageFiles.length > 0) {
        setSelectedFiles(imageFiles);
        setUploadMode(imageFiles.length === 1 ? 'single' : 'multiple');
      } else {
        toast.error('Vui lòng chọn file ảnh hoặc file ZIP!');
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imageFiles = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    );

    if (imageFiles.length === 0) {
      toast.error('Vui lòng chọn file ảnh hợp lệ!');
      return;
    }

    setSelectedFiles(imageFiles);
    setUploadMode(imageFiles.length === 1 ? 'single' : 'multiple');
  };

  const handleZipSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleZipUpload(file);
  };

  const handleZipUpload = (file) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Vui lòng chọn file ZIP!');
      return;
    }
    setSelectedFiles([file]);
    setUploadMode('zip');
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  // Upload file lên server
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn file để upload!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const isZip = uploadMode === 'zip';

    // Mô phỏng tiến độ upload
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Bỏ tham số isZip vì Backend FastAPI tự phân loại file ZIP qua field files
      await onScan(selectedFiles);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(isZip ? 'Đã gửi file ZIP đi xử lý!' : 'Đã gửi bài làm đi xử lý!');

      setTimeout(() => {
        clearSelectedFiles();
        setUploadProgress(0);
        if (onRefresh) onRefresh();
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Lỗi upload:', error);

      // Hiển thị thông báo chi tiết nếu gặp lỗi FastAPI 422
      if (error.response?.status === 422) {
        const details = error.response?.data?.detail;
        if (Array.isArray(details)) {
          toast.error(`Lỗi dữ liệu: ${details[0]?.msg || 'Không hợp lệ'}`);
        } else {
          toast.error('Dữ liệu không khớp định dạng yêu cầu!');
        }
      } else {
        toast.error(error.response?.data?.message || 'Không thể upload bài làm!');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài làm này?')) return;
    toast.info('Chức năng đang phát triển');
  };

  const toggleExpand = (paperId) => {
    setExpandedPaper(expandedPaper === paperId ? null : paperId);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ===== RENDER =====

  const renderScanStatus = () => {
    if (!scanBatchId && !isScanning) return null;

    const status = scanStatus?.status || 'processing';
    const statusMap = {
      processing: { label: 'Đang xử lý...', color: 'text-blue-600', bg: 'bg-blue-50', icon: Loader2 },
      completed: { label: 'Hoàn tất', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
      failed: { label: 'Thất bại', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
    };
    const currentStatus = statusMap[status] || statusMap.processing;
    const StatusIcon = currentStatus.icon;

    return (
      <div className={`p-4 rounded-xl border ${currentStatus.bg} border-gray-200 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentStatus.bg}`}>
              <StatusIcon className={`w-5 h-5 ${currentStatus.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className={`font-semibold ${currentStatus.color}`}>
                {/*Batch #{scanBatchId ? String(scanBatchId).slice(-6) : '...'}*/}
                AI Đang Nhận Diện Bài Làm
              </p>
              <p className="text-sm text-gray-500">
                {currentStatus.label}
                {status === 'processing' && ' - Vui lòng đợi...'}
              </p>
            </div>
          </div>
          {status === 'completed' && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-sm text-[#43a047] hover:text-[#2e7d32]"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderUploadArea = () => {
    if (isUploading) {
      return (
        <div className="bg-white rounded-xl border-2 border-[#43a047] p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#43a047] mb-4" />
          <p className="text-lg font-semibold text-gray-800">Đang tải lên...</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng đợi, không đóng trang</p>
          <div className="mt-4 max-w-md mx-auto">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#43a047] to-[#2e7d32] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
          </div>
        </div>
      );
    }

    if (selectedFiles.length > 0) {
      return renderFilePreview();
    }

    return (
      <div
        className={`bg-white rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer
          ${isDragging ? 'border-[#43a047] bg-[#e8f5e9]' : 'border-gray-300 hover:border-[#43a047]'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-700">Tải ảnh bài thi lên</p>
        <p className="text-sm text-gray-400 mt-1">
          Kéo thả ảnh hoặc file ZIP vào đây
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Hỗ trợ: JPG, PNG, ZIP
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#43a047] rounded-lg hover:bg-[#2e7d32]
            transition-colors"
          >
            Chọn ảnh
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zipInputRef.current?.click();
            }}
            className="px-4 py-2 text-sm font-medium text-[#43a047] border border-[#43a047] rounded-lg
            hover:bg-[#e8f5e9] transition-colors"
          >
            Chọn ZIP
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          onChange={handleZipSelect}
          className="hidden"
        />
      </div>
    );
  };

  const renderFilePreview = () => {
    const isZip = uploadMode === 'zip';
    const file = selectedFiles[0];

    return (
      <div className="bg-white rounded-xl border-2 border-[#43a047] p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            {isZip ? (
              <FolderArchive className="w-5 h-5 text-orange-500" />
            ) : (
              <FileImage className="w-5 h-5 text-blue-500" />
            )}
            {isZip ? 'File ZIP' : `${selectedFiles.length} ảnh`}
          </h4>
          <button
            type="button"
            onClick={clearSelectedFiles}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isZip ? (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <FileArchive className="w-10 h-10 text-orange-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{file?.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file?.size)}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">ZIP</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={previewUrls[index]}
                    alt={`Bài làm ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={clearSelectedFiles}
            className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 text-white bg-[#43a047] rounded-lg hover:bg-[#2e7d32] transition-colors
            flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isZip ? 'Giải nén & Xử lý' : `Upload ${selectedFiles.length} ảnh`}
          </button>
        </div>
      </div>
    );
  };

  // const renderPaperList = () => {
  //   if (loading) {
  //     return (
  //       <div className="text-center py-8">
  //         <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
  //         <p className="mt-2 text-gray-500">Đang tải danh sách bài làm...</p>
  //       </div>
  //     );
  //   }
  //
  //   if (papers.length === 0) {
  //     return (
  //       <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
  //         <Image className="w-12 h-12 mx-auto text-gray-300 mb-2" />
  //         <p className="text-gray-500">Chưa có bài làm nào</p>
  //         <p className="text-sm text-gray-400">Upload ảnh bài thi để bắt đầu</p>
  //       </div>
  //     );
  //   }
  //
  //   return (
  //     <div className="space-y-3">
  //       <h4 className="font-semibold text-gray-700 flex items-center gap-2">
  //         <File className="w-4 h-4" />
  //         Danh sách bài làm ({papers.length})
  //       </h4>
  //       <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
  //         {papers.map((paper) => (
  //           <div
  //             key={paper.id}
  //             className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-[#43a047] transition-all"
  //           >
  //             <div className="flex items-center justify-between">
  //               <div className="flex items-center gap-3 min-w-0">
  //                 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //                   <FileImage className="w-5 h-5 text-blue-600" />
  //                 </div>
  //                 <div className="flex-1 min-w-0">
  //                   <p className="font-medium text-gray-800 truncate">
  //                     {paper.student_name || `Bài làm #${String(paper.id).slice(-6)}`}
  //                   </p>
  //                   <p className="text-xs text-gray-400">
  //                     {paper.file_name || 'Chưa có tên file'} •{' '}
  //                     {paper.created_at && new Date(paper.created_at).toLocaleDateString('vi-VN')}
  //                   </p>
  //                 </div>
  //               </div>
  //               <div className="flex items-center gap-2 flex-shrink-0">
  //                 {paper.status && (
  //                   <span
  //                     className={`text-xs px-2 py-1 rounded-full ${
  //                       paper.status === 'processed'
  //                         ? 'bg-green-100 text-green-700'
  //                         : paper.status === 'processing'
  //                         ? 'bg-yellow-100 text-yellow-700'
  //                         : 'bg-gray-100 text-gray-700'
  //                     }`}
  //                   >
  //                     {paper.status === 'processed' ? 'Đã xử lý' : 'Đang xử lý'}
  //                   </span>
  //                 )}
  //                 <button
  //                   type="button"
  //                   onClick={() => toggleExpand(paper.id)}
  //                   className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  //                 >
  //                   <Eye className="w-4 h-4" />
  //                 </button>
  //                 <button
  //                   type="button"
  //                   onClick={() => handleDeletePaper(paper.id)}
  //                   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  //                 >
  //                   <Trash2 className="w-4 h-4" />
  //                 </button>
  //               </div>
  //             </div>
  //             {expandedPaper === paper.id && (
  //               <div className="mt-3 pt-3 border-t border-gray-200">
  //                 <div className="bg-white rounded-lg p-3">
  //                   <img
  //                     src={paper.image_url || paper.url || '/placeholder-image.png'}
  //                     alt={paper.file_name || 'Bài làm'}
  //                     className="max-h-48 mx-auto rounded-lg object-contain"
  //                     onError={(e) => {
  //                       e.target.src = '/placeholder-image.png';
  //                     }}
  //                   />
  //                   <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
  //                     <div>
  //                       <span className="text-gray-500">Học sinh:</span>
  //                       <span className="ml-2 font-medium">{paper.student_name || '---'}</span>
  //                     </div>
  //                     <div>
  //                       <span className="text-gray-500">SBD:</span>
  //                       <span className="ml-2 font-medium">{paper.student_code || '---'}</span>
  //                     </div>
  //                     <div>
  //                       <span className="text-gray-500">Ngày upload:</span>
  //                       <span className="ml-2">
  //                         {paper.created_at ? new Date(paper.created_at).toLocaleDateString('vi-VN') : '---'}
  //                       </span>
  //                     </div>
  //                     <div>
  //                       <span className="text-gray-500">Kích thước:</span>
  //                       <span className="ml-2">{formatFileSize(paper.file_size)}</span>
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             )}
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-6">
      {renderScanStatus()}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#43a047]" />
            Upload bài làm
          </h3>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {renderUploadArea()}
      </div>

      {/*<div>{renderPaperList()}</div>*/}
    </div>
  );
}