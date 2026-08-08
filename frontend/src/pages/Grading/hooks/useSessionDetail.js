import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sessionService } from '@/services/sessionService';
import { studentService } from '@/services/studentService';
import { gradingService } from "@/services/gradingService";
import { answerService } from "@/services/answerService";

export function useSessionDetail() {
  const { examId, sessionId } = useParams();
  const navigate = useNavigate();

  // Dùng Ref để ghi nhớ các API ĐÃ ĐƯỢC GỌI (Không sợ Re-render, Không sợ API Lỗi gây spam)
  const fetchedRef = useRef({
    session: false,
    students: false,
    answerKeys: false,
    results: false,
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // State cho Students
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsPagination, setStudentsPagination] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // State cho AnswerKey
  const [answerKeys, setAnswerKeys] = useState([]);
  const [answerKeysLoading, setAnswerKeysLoading] = useState(false);

  // State cho Paper Upload
  const [papers, setPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [scanBatchId, setScanBatchId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // State cho Grading
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsPagination, setResultsPagination] = useState(null);

  // State cho Tabs
  const [activeTab, setActiveTab] = useState('students');

  // 1. Fetch Session
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const response = await sessionService.getSessionDetail(examId, sessionId);
      setSession(response.data || response);
    } catch (error) {
      console.error("Lỗi lấy thông tin đợt thi:", error);
      toast.error("Không thể tải thông tin đợt thi!");
    } finally {
      setLoading(false);
    }
  }, [examId, sessionId]);

  // 2. Fetch Students
  const fetchStudents = useCallback(async (search = '', page = 1) => {
    if (!sessionId) return;
    try {
      setStudentsLoading(true);
      const response = await studentService.getStudents(sessionId, {
        search: search || undefined,
        page: page,
        page_size: 50,
      });
      const resPayload = response?.status ? response : response?.data;
      setStudents(Array.isArray(resPayload.data) ? resPayload.data : []);
      setStudentsPagination(resPayload?.pagination || null);
      setSearchKeyword(search);
    } catch (error) {
      console.error('Lỗi lấy danh sách học sinh:', error);
      toast.error('Không thể tải danh sách học sinh!');
    } finally {
      setStudentsLoading(false);
    }
  }, [sessionId]);

  // 3. Fetch Answer Keys
  const fetchAnswerKeys = useCallback(async () => {
    if (!sessionId) return;
    try {
      setAnswerKeysLoading(true);
      const response = await answerService.getAnswerKeys(sessionId);
      const data = response.data || response;
      setAnswerKeys(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi lấy đáp án:', error);
      toast.error('Không thể tải danh sách đáp án!');
    } finally {
      setAnswerKeysLoading(false);
    }
  }, [sessionId]);

  // 4. Fetch Results
  const fetchResults = useCallback(async (page = 1) => {
    if (!sessionId) return;
    try {
      setResultsLoading(true);
      const response = await gradingService.getResults(sessionId, {
        page: page,
        page_size: 50,
      });
      const data = response.data || response;
      setResults(data.data || []);
      setResultsPagination(data.pagination || null);
    } catch (error) {
      console.error('Lỗi lấy kết quả:', error);
      toast.error('Không thể tải kết quả chấm!');
    } finally {
      setResultsLoading(false);
    }
  }, [sessionId]);

  // Các hàm Action giữ nguyên
  const deleteStudent = useCallback(async (studentId) => {
    try {
      await studentService.deleteStudent(studentId);
      toast.success('Đã xóa học sinh!');
      await fetchStudents(searchKeyword);
      await fetchSession();
    } catch (error) {
      toast.error('Không thể xóa học sinh!');
    }
  }, [fetchStudents, fetchSession, searchKeyword]);

  const deleteAllStudents = useCallback(async () => {
    if (students.length === 0) return toast.info("Không có học sinh nào để xóa!");
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ học sinh ?')) return;

    try {
      await studentService.deleteAllStudents(sessionId);
      toast.success('Đã xóa tất cả học sinh!');
      await fetchStudents();
      await fetchSession();
    } catch (error) {
      toast.error("Không thể xóa học sinh!");
    }
  }, [sessionId, students.length, fetchStudents, fetchSession]);

  const uploadStudents = useCallback(async (file) => {
    if (!file) return;
    try {
      await studentService.uploadStudents(sessionId, file);
      toast.success("Import học sinh thành công!");
      await fetchStudents();
      await fetchSession();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import thất bại');
      throw error;
    }
  }, [sessionId, fetchStudents, fetchSession]);

  const uploadAnswerKey = useCallback(async (file) => {
    if (!file) return;
    try {
      await answerService.uploadAnswerKey(sessionId, file);
      toast.success('Import đáp án thành công!');
      await fetchAnswerKeys();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import thất bại');
      throw error;
    }
  }, [sessionId, fetchAnswerKeys]);

  const deleteAnswerKey = useCallback(async (answerKeyId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã đề này?')) return;
    try {
      await answerService.deleteAnswerKey(answerKeyId);
      toast.success('Đã xóa mã đề!');
      await fetchAnswerKeys();
    } catch (error) {
      toast.error('Không thể xóa mã đề!');
    }
  }, [fetchAnswerKeys]);

  const pollScanStatus = useCallback(async (batchId) => {
    const interval = setInterval(async () => {
      try {
        const response = await gradingService.getScanStatus(batchId);
        const data = response.data || response;
        setScanStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          if (data.status === 'completed') {
            toast.success('Xử lý hoàn tất!');
            await fetchResults();
          } else {
            toast.error('Xử lý bài làm thất bại!');
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const scanPapers = useCallback(async (files, isZip = false) => {
    if (!files || files.length === 0) return toast.error('Vui lòng chọn file!');
    try {
      setIsScanning(true);
      const response = await gradingService.scanPapers(sessionId, files, isZip);
      const data = response.data || response;

      if (data.batch_id) {
        setScanBatchId(data.batchId);
        toast.success('Đã gửi bài làm đi xử lý!');
        pollScanStatus(data.batch_id);
      } else {
        toast.success('Xử lý bài làm thành công');
        await fetchResults();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý bài làm!');
    } finally {
      setIsScanning(false);
    }
  }, [sessionId, fetchResults, pollScanStatus]);

  const updateResult = useCallback(async (resultId, data) => {
    try {
      const response = await gradingService.updateResult(resultId, data);
      toast.success('Cập nhật điểm thành công!');
      await fetchResults();
      return response.data;
    } catch (error) {
      toast.error('Không thể cập nhật điểm!');
      throw error;
    }
  }, [fetchResults]);

  const deleteResult = useCallback(async (resultId) => {
    if (!window.confirm('Bạn có chắc muốn xóa kết quả này?')) return;
    try {
      await gradingService.deleteResult(resultId);
      toast.success('Đã xóa kết quả!');
      await fetchResults();
      await fetchSession();
    } catch (error) {
      toast.error('Không thể xóa kết quả!');
    }
  }, [fetchResults, fetchSession]);

  const clearAllResults = useCallback(async () => {
    if (!window.confirm('Bạn có chắc muốn xóa TẤT CẢ kết quả?')) return;
    try {
      await gradingService.clearAllResults(sessionId);
      toast.success('Đã xóa tất cả kết quả!');
      await fetchResults();
      await fetchSession();
    } catch (error) {
      toast.error('Không thể xóa kết quả!');
    }
  }, [sessionId, fetchResults, fetchSession]);

  const exportResult = useCallback(async () => {
    try {
      const response = await gradingService.exportResults(sessionId);
      const data = response.data || response;
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bang_diem_${sessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Xuất file thành công!');
    } catch (error) {
      toast.error('Không thể xuất file!');
    }
  }, [sessionId]);

  // Reset lại ref khi đổi sang sessionId khác
  useEffect(() => {
    fetchedRef.current = {
      session: false,
      students: false,
      answerKeys: false,
      results: false,
    };
  }, [sessionId]);

  // Gọi Session 1 lần duy nhất
  useEffect(() => {
    if (sessionId && !fetchedRef.current.session) {
      fetchedRef.current.session = true;
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  // Chuyển Tab nào -> Gọi tab đó đúng 1 lần duy nhất
  useEffect(() => {
    if (!sessionId) return;

    if (activeTab === 'students' && !fetchedRef.current.students) {
      fetchedRef.current.students = true;
      fetchStudents();
    } else if (activeTab === 'answer-key' && !fetchedRef.current.answerKeys) {
      fetchedRef.current.answerKeys = true;
      fetchAnswerKeys();
    } else if (activeTab === 'grading' && !fetchedRef.current.results) {
      fetchedRef.current.results = true;
      fetchResults();
    }
  }, [activeTab, sessionId, fetchStudents, fetchAnswerKeys, fetchResults]);

  return {
    session,
    loading,
    examId,
    sessionId,

    students,
    studentsLoading,
    studentsPagination,
    searchKeyword,
    fetchStudents,
    uploadStudents,
    deleteStudent,
    deleteAllStudents,

    answerKeys,
    answerKeysLoading,
    fetchAnswerKeys,
    uploadAnswerKey,
    deleteAnswerKey,

    papers,
    papersLoading,
    scanBatchId,
    scanStatus,
    isScanning,
    scanPapers,

    results,
    resultsLoading,
    resultsPagination,
    fetchResults,
    updateResult,
    deleteResult,
    clearAllResults,
    exportResult,

    activeTab,
    setActiveTab,
  };
}