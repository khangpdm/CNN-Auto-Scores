import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { examService } from '@/services/examService';
import { sessionService } from '@/services/sessionService';
import { studentService } from '@/services/studentService';

export function useExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State cho Exam
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // State cho Sessions
  const [sessions, setSessions] = useState([]);

  // State cho Students
  const [students, setStudents] = useState([]);
  const [studentsPagination, setStudentsPagination] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // State cho Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [isDeleting, setIsDeleting] = useState(false);

  // State cho Tabs
  const [activeTab, setActiveTab] = useState('info');

  // ===== Lấy danh sách học sinh =====
  const fetchStudents = useCallback(async (sessionId, search = '', page = 1) => {
    if (!sessionId) return;

    try {
      setLoadingStudents(true);
      const response = await studentService.getStudents(sessionId, {
        search: search,
        page: page,
        page_size: 50,
      });
      const data = response.data || response;
      setStudents(data.data || []);
      setStudentsPagination(data.pagination || null);
    } catch (error) {
      console.error('Lỗi lấy danh sách học sinh:', error);
      toast.error('Không thể tải danh sách học sinh!');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // ===== Lấy dữ liệu chính =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Lấy chi tiết kỳ thi
      const examResponse = await examService.getExamDetail(id);
      const examData = examResponse.data || examResponse;
      setExam(examData);
      setEditName(examData.exam_name || '');
      setEditStatus(examData.status || 'draft');

      // 2. Lấy danh sách đợt thi
      const sessionResponse = await sessionService.getSessions(id);
      const sessionData = sessionResponse.data || sessionResponse;
      const sessionsList = Array.isArray(sessionData) ? sessionData : [];
      setSessions(sessionsList);

      // 3. Lấy danh sách học sinh từ đợt thi đầu tiên
      if (sessionsList.length > 0) {
        const firstSession = sessionsList[0];
        setSelectedSessionId(firstSession.id);
        await fetchStudents(firstSession.id);
      }

    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      toast.error('Không thể tải thông tin kỳ thi!');
    } finally {
      setLoading(false);
    }
  }, [id, fetchStudents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== Xử lý search học sinh =====
    const handleSearchStudents = (keyword, page = 1) => {
      setSearchKeyword(keyword);
      if (selectedSessionId) {
        fetchStudents(selectedSessionId, keyword, page);
      }
    };

  // ===== Chọn đợt thi để xem học sinh =====
  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setSearchKeyword('');
    fetchStudents(sessionId);
  };

  // ===== Xóa 1 học sinh =====
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;

    try {
      await studentService.deleteStudent(studentId);
      toast.success('Đã xóa học sinh!');
      // Refresh danh sách
      if (selectedSessionId) {
        await fetchStudents(selectedSessionId, searchKeyword);
      }
    } catch (error) {
      console.error('Lỗi xóa học sinh:', error);
      toast.error('Không thể xóa học sinh!');
    }
  };

  // ===== Xóa tất cả học sinh =====
const handleDeleteAllStudents = async () => {
  if (!selectedSessionId) {
    toast.error('Không có đợt thi nào để xóa học sinh!');
    return;
  }

  if (students.length === 0) {
    toast.info('Không có học sinh nào để xóa!');
    return;
  }

  if (!window.confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ ${students.length} học sinh trong đợt thi này?`)) {
    return;
  }

  try {
    await studentService.deleteAllStudents(selectedSessionId);
    toast.success(`Đã xóa tất cả ${students.length} học sinh!`);

    // Refresh danh sách
    await fetchStudents(selectedSessionId, searchKeyword);
  } catch (error) {
    console.error('Lỗi xóa tất cả học sinh:', error);
    toast.error('Không thể xóa tất cả học sinh!');
  }
};

const handleUploadStudents = async (file) => {
    if (!selectedSessionId) {
      toast.error('Vui lòng chọn đợt thi trước khi upload danh sách!');
      return;
    }
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      await studentService.uploadStudents(selectedSessionId, formData);
      toast.success('Tải lên danh sách học sinh thành công!');
      await fetchStudents(selectedSessionId, searchKeyword);
    } catch (error) {
      console.error('Lỗi upload học sinh:', error);
      toast.error('Tải lên thất bại. Kiểm tra lại định dạng file!');
    }
  };

  // Lấy session_id đầu tiên cho tab học sinh
  const firstSessionId = sessions?.length > 0 ? sessions[0].id : null;

  return {
    exam,
    loading,
    sessions,
    students,
    studentsPagination,
    loadingStudents,
    selectedSessionId,
    searchKeyword,
    firstSessionId,
    activeTab,
    setActiveTab,
    isDeleting,
    handleSearchStudents,
    handleSelectSession,
    handleDeleteStudent,
    handleDeleteAllStudents,
    handleUploadStudents,
    fetchData,
  };
}