import React, { useState } from 'react';
import { useExams } from './hooks/useExams';
import ExamHeader from './components/ExamHeader';
import ExamGuide from './components/ExamGuide';
import ExamFilters from './components/ExamFilters';
import ExamStats from './components/ExamStats';
import ExamTable from './components/ExamTable';
import { CreateExamModal, EditExamModal } from './components/ExamModals';
import { examService } from '@/services/examService.js';
import { toast } from 'sonner';

export default function ExaminationListPage() {
  const {
    exams,
    setExams,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    loading,
    setLoading,
    refreshTrigger,
    setRefreshTrigger,
    fetchExams,
    filteredExams,
    totalPages,
    indexOfLastItem,
    indexOfFirstItem,
    currentExams,
  } = useExams();

  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editExamName, setEditExamName] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editStatus, setEditStatus] = useState('draft');

  const handleCreateExam = async () => {
    if (!examName.trim()) {
      toast.error('Vui lòng nhập tên kỳ thi!');
      return;
    }

    setIsSubmitting(true);
    try {
      await examService.createExam(examName.trim());
      setRefreshTrigger(prev => prev + 1);
      toast.success(`Đã tạo kỳ thi "${examName}" thành công!`);
      setIsModalOpen(false);
      setExamName('');
    } catch (error) {
      console.error('Lỗi tạo kỳ thi:', error);
      const errorMsg = error.response?.data?.detail || 'Không thể tạo kỳ thi. Vui lòng thử lại!';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
      setExamName('');
    }
  };

  const handleOpenEditModal = (exam) => {
    setEditingExam(exam);
    setEditExamName(exam.exam_name || exam.name || '');
    setEditStatus(exam.status || 'draft');
    setIsEditModalOpen(true);
  };

  const handleUpdateExam = async () => {
    if (!editExamName.trim()) {
      toast.error('Vui lòng nhập tên kỳ thi!');
      return;
    }

    if (!editingExam?.id) {
      toast.error('Không tìm thấy ID kỳ thi!');
      return;
    }

    setIsEditSubmitting(true);
    try {
      const response = await examService.updateExam(editingExam.id, {
        exam_name: editExamName.trim(),
        status: editStatus,
      });

      const updatedExam = response.data || response;
      setExams(prev => prev.map(exam =>
        exam.id === updatedExam.id ? updatedExam : exam
      ));

      toast.success(`Đã cập nhật kỳ thi thành công!`);
      setIsEditModalOpen(false);
      setEditingExam(null);
      setEditExamName('');
    } catch (error) {
      console.error('Lỗi cập nhật kỳ thi:', error);

      let errorMsg = 'Không thể cập nhật kỳ thi. Vui lòng thử lại!';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          errorMsg = detail[0].msg || errorMsg;
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId, examName) => {
    if (!examId) {
      toast.error('Không tìm thấy ID kỳ thi!');
      return;
    }

    try {
      setLoading(true);
      await examService.deleteExam(examId);
      setExams(prev => prev.filter(exam => exam.id !== examId));
      toast.success(`Đã xóa kỳ thi "${examName || 'không tên'}"!`);
    } catch (error) {
      console.error('Lỗi khi xóa kỳ thi:', error);
      let errorMsg = 'Không thể xóa kỳ thi. Vui lòng thử lại!';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          errorMsg = detail[0].msg || errorMsg;
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamHeader
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        setIsModalOpen={setIsModalOpen}
      />

      {isGuideOpen && <ExamGuide />}

      <div className="container mx-auto px-4 py-6">
        <ExamFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        <ExamStats filteredExams={filteredExams} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ExamTable
            loading={loading}
            currentExams={currentExams}
            filteredExams={filteredExams}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
            setIsModalOpen={setIsModalOpen}
            handleOpenEditModal={handleOpenEditModal}
            handleDeleteExam={handleDeleteExam}
          />
        </div>
      </div>

      <CreateExamModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        examName={examName}
        setExamName={setExamName}
        handleCreateExam={handleCreateExam}
        isSubmitting={isSubmitting}
        handleOverlayClick={handleOverlayClick}
      />

      <EditExamModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingExam={editingExam}
        setEditingExam={setEditingExam}
        editExamName={editExamName}
        setEditExamName={setEditExamName}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        handleUpdateExam={handleUpdateExam}
        isEditSubmitting={isEditSubmitting}
      />
    </div>
  );
}