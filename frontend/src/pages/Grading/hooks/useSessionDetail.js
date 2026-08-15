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
      const responseData = response.data || response;
      setResults(responseData.items || []);
      setResultsPagination({
        current_page: page,
        page_size: 50,
        total_records: responseData.items.length,
        total_pages: Math.ceil(responseData.items.length / 50) || 1,
      });
    } catch (error) {
      console.error('Lỗi lấy kết quả:', error);
      toast.error('Không thể tải kết quả chấm!');
    } finally {
      setResultsLoading(false);
    }
  }, [sessionId]);

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

const scanPapers = useCallback(async (files) => {
    if (!files || files.length === 0) {
      toast.error('Vui lòng chọn file!');
      return;
    }

    try {
      setIsScanning(true);
      const response = await gradingService.scanPapers(sessionId, files);
      const data = response.data || response;

      const batchId = data.batch_id || data.batchId;

      if (batchId) {
        setScanBatchId(batchId);
        toast.success('Đã gửi bài làm đi xử lý!');
        pollScanStatus(batchId);
      } else {
        toast.success('Xử lý bài làm thành công!');
        await fetchResults();
      }
    } catch (error) {
      console.error('Lỗi scan papers:', error);

      if (error.response?.status === 422) {
        const details = error.response?.data?.detail;
        if (Array.isArray(details)) {
          const errMessage = details.map(err => `${err.loc.join('->')}: ${err.msg}`).join(', ');
          toast.error(`Lỗi định dạng dữ liệu (422): ${errMessage}`);
        } else {
          toast.error('Dữ liệu gửi lên không khớp với yêu cầu của Server!');
        }
      } else {
        toast.error(error.response?.data?.message || 'Không thể xử lý bài làm!');
      }
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
      fetchedRef.current = {
        session: false,
        students: false,
        answerKeys: false,
        results: false,
      };
    }, [sessionId]);

    // 1. Tải các dữ liệu nền tảng ngay khi vào sessionId (Session, Học sinh, Đáp án)
    useEffect(() => {
      if (!sessionId) return;

      // Tải Session
      if (!fetchedRef.current.session) {
        fetchedRef.current.session = true;
        fetchSession();
      }

      // Tải Học Sinh (Tự động tải để lấy Badge số lượng + Dữ liệu chấm)
      if (!fetchedRef.current.students) {
        fetchedRef.current.students = true;
        fetchStudents();
      }

      // Tải Đáp Án (Tự động tải ngầm để Tab Chấm điểm có ngay Mã đề để dò)
      if (!fetchedRef.current.answerKeys) {
        fetchedRef.current.answerKeys = true;
        fetchAnswerKeys();
      }
    }, [sessionId, fetchSession, fetchStudents, fetchAnswerKeys]);

    // 2. Riêng Kết Quả Chấm (Results) chỉ tải khi người dùng bấm sang Tab 'grading'
    useEffect(() => {
      if (!sessionId) return;

      if (activeTab === 'grading' && !fetchedRef.current.results) {
        fetchedRef.current.results = true;
        fetchResults();
      }
    }, [activeTab, sessionId, fetchResults]);

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