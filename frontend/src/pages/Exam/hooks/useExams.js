import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { examService } from '@/services/examService.js';

export function useExams() {
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await examService.getExams();

      const data = response.data || response;

      const myExams = data.my_exams || [];
      const sharedExams = data.shared_exams || [];
      const allExams = [...myExams, ...sharedExams];

      setExams(allExams);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách kỳ thi:', error);
      toast.error('Không thể tải danh sách kỳ thi. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams().catch((err) => {
      console.error("Lỗi không thể xử lý trong fetchExams:", err);
    });
  }, [refreshTrigger]);

  const filteredExams = exams.filter(exam => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
        (exam.exam_name?.toLowerCase() || exam.name?.toLowerCase() || '').includes(searchLower) ||
        (exam.exam_code?.toLowerCase() || exam.code?.toLowerCase() || '').includes(searchLower);
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstItem, indexOfLastItem);

  return {
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
  };
}