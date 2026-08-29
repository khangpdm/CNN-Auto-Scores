import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp, Download, RefreshCw, Eye, Edit3,
  Trash2, AlertTriangle, CheckCircle, X,
  Search, Filter, Loader2, Maximize2,
  User, Hash, Award, Save, RotateCcw
} from 'lucide-react';
import {ConfirmDeleteModal, EditResultModal, ImageModal} from './GradingModals';

export default function GradingTab({
  sessionId,
  results = [],
  loading = false,
  pagination = null,
  students = [],
  answerKeys = [],
  onSearch,
  onUpdate,
  onDelete,
  onClearAll,
  onExport,
  onRefresh,
  onReGrade,
  onGetResultDetail,
}) {
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredResults, setFilteredResults] = useState(results);
  const [expandedResult, setExpandedResult] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [editScore, setEditScore] = useState('');

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    result: null,
    isDeleting: false,
    isDanger: false,
  });

  // ===== STATE CHO MODAL ẢNH =====
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  // ===== STATE CHO MODAL CHỈNH SỬA CHI TIẾT THÔNG MINH =====
  const [editDetailModal, setEditDetailModal] = useState({
    isOpen: false,
    result: null,
    isLoading: false,
  });

  // ===== HANDLERS =====
  const handleSearch = (keyword) => {
    setSearchTerm(keyword);
    applyFilters(keyword, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (keyword, status) => {
    let filtered = [...results];

    if (keyword.trim()) {
      filtered = filtered.filter(result =>
        (result.student_name || '').toLowerCase().includes(keyword.toLowerCase()) ||
        (result.student_code || '').toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(result => result.status === status);
    }

    setFilteredResults(filtered);
  };

  useEffect(() => {
    applyFilters(searchTerm, filterStatus);
  }, [results]);

  const handleClearSearch = () => {
    setSearchTerm('');
    applyFilters('', filterStatus);
  };

  const handleEditScore = (result) => {
    setEditingResult(result.result_id);
    setEditScore(result.total_score?.toString() || '');
  };

  const handleSaveScore = async (resultId) => {
    const score = parseFloat(editScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error('Vui lòng nhập điểm từ 0 đến 10!');
      return;
    }

    try {
      await onUpdate(resultId, { total_score: score });
      toast.success('Cập nhật điểm thành công!');
      setEditingResult(null);
      setEditScore('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi cập nhật điểm:', error);
      toast.error('Không thể cập nhật điểm!');
    }
  };

  const handleCancelEdit = () => {
    setEditingResult(null);
    setEditScore('');
  };

  const handleDeleteClick = (result) => {
    setDeleteModal({
      isOpen: true,
      result: result,
      isDeleting: false,
      isDanger: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.result) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await onDelete(deleteModal.result.result_id);
      setDeleteModal({ isOpen: false, result: null, isDeleting: false, isDanger: false });
      if (onRefresh) onRefresh();
    } catch (error) {

    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, result: null, isDeleting: false, isDanger: false });
  };

  // ===== HANDLER XÓA TẤT CẢ =====
  const handleClearAllClick = () => {
    setDeleteModal({
      isOpen: true,
      result: null,
      isDeleting: false,
      isDanger: true, // Style đặc biệt cho hành động nguy hiểm
    });
  };

  const handleClearAllConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await onClearAll();
      setDeleteModal({ isOpen: false, result: null, isDeleting: false, isDanger: false });
      if (onRefresh) onRefresh();
    } catch (error) {

    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const toggleExpand = (resultId) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  // ===== HANDLER XEM ẢNH =====
const API_URL = import.meta.env.VITE_API_URL || 'https://asc-marker.onrender.com';

const getCorrectImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/') || url.startsWith('/static/')) {
    return `${API_URL}${url}`;
  }
  return `${API_URL}/storage/processed/${url}`;
};

// ✅ Gộp cả 2 hàm lại
const getFreshImageUrl = (url) => {
  if (!url) return '';
  const correctUrl = getCorrectImageUrl(url);
  return `${correctUrl}${correctUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
};

const openImageModal = (imageUrl, title) => {
  if (!imageUrl) {
    toast.error('Không có ảnh để hiển thị!');
    return;
  }
  setImageModal({
    isOpen: true,
    imageUrl: getFreshImageUrl(imageUrl), // ✅ Đã sửa
    title: title || 'Ảnh bài làm',
  });
};

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      title: '',
    });
  };

  // ===== HANDLER CHỈNH SỬA CHI TIẾT THÔNG MINH =====
  const openEditDetailModal = async (result) => {
    // Hiển thị loading
    setEditDetailModal({
      isOpen: true,
      result: null,
    });

    try {
      // Gọi API lấy chi tiết kết quả
      const detailResult = await onGetResultDetail(result.result_id);

      setEditDetailModal({
        isOpen: true,
        result: detailResult,
        isLoading: false,
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết:', error);
      toast.error('Không thể lấy chi tiết bài làm!');
      setEditDetailModal({
        isOpen: false,
        result: null,
        isLoading: false,
      });
    }
  };

  const closeEditDetailModal = () => {
    setEditDetailModal({
      isOpen: false,
      result: null,
      formData: {
        student_code: '',
        student_name: '',
        test_code: '',
        answers: {},
        total_score: 0,
      },
      isSubmitting: false,
      isFetchingStudent: false,
      isFetchingAnswerKey: false,
    });
  };

  // ===== TÌM HỌC SINH THEO SBD =====
  const handleStudentCodeChange = async (value) => {
    setEditDetailModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        student_code: value,
        student_name: '', // Reset tên khi đổi SBD
      },
      isFetchingStudent: true,
    }));

    if (!value.trim()) {
      setEditDetailModal(prev => ({
        ...prev,
        isFetchingStudent: false,
      }));
      return;
    }

    // Tìm học sinh trong danh sách students
    const foundStudent = students.find(
      s => s.student_code === value.trim() || s.sbd === value.trim()
    );

    if (foundStudent) {
      setEditDetailModal(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          student_name: foundStudent.full_name || foundStudent.name || '',
        },
        isFetchingStudent: false,
      }));
      toast.success(`Đã tìm thấy học sinh: ${foundStudent.full_name || foundStudent.name}`);
    } else {
      setEditDetailModal(prev => ({
        ...prev,
        isFetchingStudent: false,
      }));
      // Không báo lỗi, user có thể nhập tên thủ công
    }
  };

  // ===== TÌM ĐÁP ÁN THEO MÃ ĐỀ =====
  const handleTestCodeChange = async (value) => {
    const newTestCode = value.trim();

    setEditDetailModal(prev => {
      const officialAns = getOfficialAnswersByCode(newTestCode);
      const baseAnswers = prev.formData.rawAnswers || prev.formData.answers;
      const newScore = calculateTotalScore(prev.formData.answers, officialAns);

      return {
        ...prev,
        formData: {
          ...prev.formData,
          test_code: value,
          answers: baseAnswers,
          total_score: newScore, // Cập nhật điểm mới ngay
        },
        isFetchingAnswerKey: false,
      };
    });

    if (newTestCode && Object.keys(getOfficialAnswersByCode(newTestCode)).length > 0) {
      toast.success(`Đã tìm thấy đáp án chuẩn cho mã đề ${newTestCode}`);
    } else if (newTestCode) {
      toast.warning(`Chưa có đáp án chuẩn cho mã đề ${newTestCode}!`);
    }
  };

  // ===== CẬP NHẬT ĐÁP ÁN TỪNG CÂU =====
  const handleAnswerChange = (questionIndex, value) => {
    setEditDetailModal(prev => {
      const updatedAnswers = {
        ...prev.formData.answers,
        [questionIndex]: value.toUpperCase(),
      };

      // Lấy đáp án chuẩn hiện tại để tính lại điểm
      const officialAns = getOfficialAnswersByCode(prev.formData.test_code);
      const newScore = calculateTotalScore(updatedAnswers, officialAns);

      return {
        ...prev,
        formData: {
          ...prev.formData,
          answers: updatedAnswers,
          total_score: newScore, // Tự động cập nhật điểm khi khoanh lại câu
        },
      };
    });
  };

  // ===== TÍNH LẠI ĐIỂM TỰ ĐỘNG =====
  const calculateTotalScore = (studentAnswers = {}, officialAnswers = {}) => {
    const officialKeys = Object.keys(officialAnswers);
    const totalQuestion = officialKeys.length;

    if (totalQuestion === 0) return 0;

    const scorePerQuestion = 10 / totalQuestion;
    let correctCount = 0;

    officialKeys.forEach((qNum) => {
      const studentAns = String(studentAnswers[qNum] || '').trim().toUpperCase();
      const officialAns = String(officialAnswers[qNum] || '').trim().toUpperCase();

      if (studentAns && studentAns === officialAns) {
        correctCount++;
      }
    });

    return Math.round((correctCount * scorePerQuestion) * 100) / 100;
  };

  // ===== LƯU CHỈNH SỬA =====
  const handleSaveEditDetail = async (resultId, data) => {
    try {
      await onUpdate(resultId, data);
      toast.success('Cập nhật thành công!');
      closeEditDetailModal();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật!');
      throw error;
    }
  };

  const handleReGrade = async (resultId, newTestCode) => {
    if (!window.confirm(`Bạn có chắc muốn chấm lại với mã đề "${newTestCode}"?`)) return;

    try {
      await onReGrade(resultId, newTestCode);
      toast.success('Đã chấm lại với mã đề mới!');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi chấm lại:', error);
      toast.error('Không thể chấm lại!');
    }
  };

  const getOfficialAnswersByCode = (testCode) => {
    if (!testCode) return {};
    const found = answerKeys.find(k => String(k.test_code).trim() === String(testCode).trim());
    if (!found) return {};

    try {
      return typeof found.answers === 'string' ? JSON.parse(found.answers) : found.answers;
    } catch (e) {
      return {};
    }
  };

  // ===== FORMAT =====
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
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

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-blue-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 8) return { label: 'Giỏi', color: 'bg-green-100 text-green-700' };
    if (score >= 6.5) return { label: 'Khá', color: 'bg-blue-100 text-blue-700' };
    if (score >= 5) return { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Yếu', color: 'bg-red-100 text-red-700' };
  };

  const getStatusBadge = (status) => {
    if (status === 'VALID') {
      return { label: 'Đã chấm', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
    if (status === 'NEED_REVIEW') {
      return { label: 'Cần xem lại', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    }
    return { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700', icon: Loader2 };
  };

  // ===== THỐNG KÊ =====
  const total = results.length;
  const graded = results.filter(r => r.status === 'VALID').length;
  const avgScore = total > 0 ? results.reduce((sum, r) => sum + (r.total_score || 0), 0) / total : 0;
  const passed = results.filter(r => (r.total_score || 0) >= 5).length;
  const failed = results.filter(r => (r.total_score || 0) < 5).length;
  const hasWarnings = results.filter(r => r.warnings && r.warnings.length > 0).length;

  // ===== RENDER =====
  // Loading
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#43a047]" />
        <p className="mt-2 text-gray-500">Đang tải kết quả chấm điểm...</p>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h4 className="text-lg font-semibold text-gray-700">Chưa có kết quả chấm điểm</h4>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
          Upload bài làm ở tab "Bài làm" để hệ thống tự động chấm điểm.
        </p>
        <button
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-[#43a047] bg-[#e8f5e9] rounded-lg
          hover:bg-[#c8e6c9] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>
    );
  }

  const displayResults = searchTerm.trim() || filterStatus !== 'all' ? filteredResults : results;

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#43a047]" />
            Kết quả chấm điểm
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({total} bài)
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý điểm số và kết quả bài thi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 text-white bg-[#43a047] rounded-lg hover:bg-[#2e7d32]
            transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button
            onClick={handleClearAllClick}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg
            hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg
            hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* ===== THỐNG KÊ NHANH ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-sm text-gray-500">Tổng số</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{passed}</p>
          <p className="text-sm text-gray-500">Đạt (≥5)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{failed}</p>
          <p className="text-sm text-gray-500">Không đạt</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Điểm TB</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{hasWarnings}</p>
          <p className="text-sm text-gray-500">Có cảnh báo</p>
        </div>
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc SBD..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#43a047] focus:border-transparent"
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#43a047] bg-white"
          >
            <option value="all">Tất cả</option>
            <option value="VALID">Đã chấm</option>
            <option value="NEED_REVIEW">Cần xem lại</option>
          </select>
        </div>
      </div>

      {/* ===== BẢNG KẾT QUẢ ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SBD</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đề</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp loại</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayResults.map((result, index) => {
                const score = result.total_score || 0;
                const scoreBadge = getScoreBadge(score);
                const hasWarning = result.warnings && result.warnings.length > 0;
                const isEditing = editingResult === result.result_id;
                const isExpanded = expandedResult === result.result_id;
                const statusBadge = getStatusBadge(result.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <React.Fragment key={result.result_id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${hasWarning ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {result.student_code || '---'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {result.student_name || 'Chưa có tên'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.test_code || '---'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.01"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-200 rounded text-center focus:ring-2
                              focus:ring-[#43a047]"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveScore(result.result_id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isEditing && (
                          <span className={`text-xs px-2.5 py-1 rounded-full ${scoreBadge.color}`}>
                            {scoreBadge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs flex items-center gap-1 ${statusBadge.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusBadge.label}
                          </span>
                          {result.is_manually_edited && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                              Đã sửa
                            </span>
                          )}
                          {hasWarning && (
                            <span className="text-xs text-yellow-600" title={result.warnings.join(', ')}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDetailModal(result)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg
                            transition-colors"
                            title="Sửa chi tiết thông minh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleExpand(result.result_id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(result)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="8" className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ảnh bài làm */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-500">Ảnh bài làm</p>
                                {result.image_url && (
                                  <button
                                    onClick={() => openImageModal(result.image_url, 'Ảnh bài làm')}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    Phóng to
                                  </button>
                                )}
                              </div>
                              <div
                                className="cursor-pointer rounded-lg border border-gray-200 overflow-hidden bg-white"
                                onClick={() => openImageModal(result.image_url, 'Ảnh bài làm')}
                              >
                                <img
                                  src={result.image_url || '/placeholder-image.png'}
                                  alt="Bài làm"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Chi tiết */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Chi tiết</p>
                              <div className="space-y-1.5 text-sm bg-white p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Điểm:</span>
                                    <span className={`font-bold ${getScoreColor(score)}`}>
                                      {score.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Xếp loại:</span>
                                    <span className={`font-medium ${scoreBadge.color}`}>
                                      {scoreBadge.label}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">SBD:</span>
                                    <span>{result.student_code || '---'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Mã đề:</span>
                                    <span>{result.test_code || '---'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Trạng thái:</span>
                                    <span className={result.status === 'VALID' ? 'text-green-600' : 'text-yellow-600'}>
                                      {result.status === 'VALID' ? 'Đã chấm' : 'Cần xem lại'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Đã chỉnh sửa:</span>
                                    <span className={result.is_manually_edited ? 'text-purple-600' : 'text-gray-400'}>
                                      {result.is_manually_edited ? 'Có' : 'Chưa'}
                                    </span>
                                  </div>
                                </div>
                                {result.graded_at && (
                                  <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                                    <span className="text-gray-500">Thời gian chấm:</span>
                                    <span className="text-xs">{formatDate(result.graded_at)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Warnings */}
                              {hasWarning && (
                                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Cảnh báo:
                                  </p>
                                  <ul className="text-xs text-yellow-600 mt-1 space-y-0.5 list-disc pl-4">
                                    {result.warnings.map((warning, idx) => (
                                      <li key={idx}>{warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        {pagination && pagination.total_pages > 1 && !searchTerm && filterStatus === 'all' && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Hiển thị {results.length} / {pagination.total_records} kết quả
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onSearch('', pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50
                disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => onSearch(searchTerm, pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50
                disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL XEM ẢNH ===== */}
      <ImageModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        title={imageModal.title}
        onClose={closeImageModal}
      />

      {/* ===== MODAL CHỈNH SỬA CHI TIẾT ===== */}
      <EditResultModal
        isOpen={editDetailModal.isOpen}
        result={editDetailModal.result}
        students={students}
        answerKeys={answerKeys}
        onClose={closeEditDetailModal}
        onSave={handleSaveEditDetail}
        onRefresh={onRefresh}
      />

      {/* ===== MODAL XÓA KẾT QUẢ ===== */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={deleteModal.isDanger ? handleClearAllConfirm : handleDeleteConfirm}
        title={deleteModal.isDanger ? "Xóa tất cả kết quả" : "Xác nhận xóa"}
        description={
          deleteModal.isDanger
            ? "Bạn có chắc chắn muốn xóa TẤT CẢ kết quả chấm điểm? Hành động này không thể hoàn tác!"
            : `Bạn có chắc chắn muốn xóa kết quả của học sinh "${deleteModal.result?.student_name || 'chưa có tên'}"?`
        }
        confirmText={deleteModal.isDanger ? "Xóa tất cả" : "Xóa"}
        isDanger={deleteModal.isDanger}
      />
    </div>
  );
}