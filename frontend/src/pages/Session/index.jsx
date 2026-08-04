import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';
import { examService } from '@/services/examService';
import { sessionService } from '@/services/sessionService';
import {CreateSessionModal, EditSessionModal, DeleteSessionModal} from './components/SessionModals.jsx';
import SessionHeader from "./components/SessionHeader.jsx";
import SessionTable from "./components/SessionTable.jsx";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // State cho Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // State cho Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [editSessionCode, setEditSessionCode] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [isEditing, setIsEditing] = useState(false);

  // State cho Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lấy dữ liệu
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy thông tin kỳ thi
      const examResponse = await examService.getExamDetail(id);
      const examData = examResponse.data?.exam || examResponse;
      setExam(examData);

      // Lấy danh sách đợt thi
      const sessionResponse = await sessionService.getSessions(id);
      const sessionData = sessionResponse.data || sessionResponse;
      const sessionsList = Array.isArray(sessionData) ? sessionData : [];
      setSessions(sessionsList);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      toast.error('Không thể tải thông tin!');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Tạo đợt thi
  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Vui lòng nhập tên đợt thi!');
      return;
    }

    setIsCreating(true);
    try {
      await sessionService.createSession(id, {
        name: sessionName.trim(),
      });
      toast.success('Tạo đợt thi thành công!');
      setIsCreateModalOpen(false);
      setSessionName('');
      fetchData();
    } catch (error) {
      console.error('Lỗi tạo đợt thi:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo đợt thi!');
    } finally {
      setIsCreating(false);
    }
  };

  // Mở modal sửa
  const handleOpenEditModal = (session) => {
    setEditingSession(session);
    setEditSessionName(session.session_name || '');
    setEditStatus(session.status || 'draft');
    setIsEditModalOpen(true);
  };

  // Cập nhật đợt thi
  const handleUpdateSession = async () => {
    if (!editSessionName.trim()) {
      toast.error('Vui lòng nhập tên đợt thi!');
      return;
    }

    setIsEditing(true);
    try {
      await sessionService.updateSession(id, editingSession.id, {
        session_name: editSessionName.trim(),
        total_question: "120",
        max_score: "10",
        status: editStatus,
      });
      toast.success('Cập nhật đợt thi thành công!');
      setIsEditModalOpen(false);
      setEditingSession(null);
      setEditSessionName('');
      fetchData();
    } catch (error) {
      console.error('Lỗi cập nhật đợt thi:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật đợt thi!');
    } finally {
      setIsEditing(false);
    }
  };

  // Xóa đợt thi
  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      await sessionService.deleteSession(id, selectedSession.id);
      toast.success('Đã xóa đợt thi!');
      setShowDeleteModal(false);
      setSelectedSession(null);
      fetchData();
    } catch (error) {
      console.error('Lỗi xóa đợt thi:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đợt thi!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#43a047]" />
          <p className="mt-4 text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-600">Không tìm thấy kỳ thi</p>
          <Link to="/ky-thi" className="text-[#43a047] hover:underline mt-2 inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  // Thống kê
  const totalStudents = sessions.reduce((sum, s) => sum + (s.student_count || 0), 0);
  const totalGraded = sessions.reduce((sum, s) => sum + (s.graded_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <SessionHeader
          exam = {exam}
          sessions = {sessions}
          totalStudents = {totalStudents}
          totalGraded = {totalGraded}
        />

        {/* Danh sách đợt thi */}
        <SessionTable
          sessions={sessions}
          examId={exam.id}
          onSearch={setSearchKeyword}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onEditClick={handleOpenEditModal}
          onDeleteClick={(session) => {
            setSelectedSession(session);
            setShowDeleteModal(true);
          }}
        />
      </div>

      {/* Modal Tạo đợt thi */}
      <CreateSessionModal
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        sessionName={sessionName}
        setSessionName={setSessionName}
        sessionCode={sessionCode}
        setSessionCode={setSessionCode}
        handleCreateSession={handleCreateSession}
        isSubmitting={isCreating}
      />

      {/* Modal Sửa đợt thi */}
      <EditSessionModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingSession={editingSession}
        setEditingSession={setEditingSession}
        editSessionName={editSessionName}
        setEditSessionName={setEditSessionName}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        handleUpdateSession={handleUpdateSession}
        isEditSubmitting={isEditing}
      />

      {/* Modal xác nhận xóa */}
      <DeleteSessionModal
        isDelModalOpen={showDeleteModal}
        setIsDelModalOpen={setShowDeleteModal}
        selectedSession={selectedSession}
        handleDelModal={handleDeleteSession}
        isDeleting={isDeleting}
      />
    </div>
  );
}