import {api} from '../api';

export const sessionService = {
  getSessions: async (examId) => {
    const response = await api.get(`/api/v1/exams/${examId}/sessions`);
    return response.data;
  },

  createSession: async (examId, data) => {
    const sessionName = data.name;
    const sessionCode = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    const response = await api.post(`/api/v1/exams/${examId}/sessions`, {
      session_code: sessionCode,
      session_name: sessionName,
      total_questions: 120,
      max_score: 10,
    });
    return response.data;
  },

  updateSession: async (examId, sessionId, data) => {
    const response = await api.put(
      `/api/v1/exams/${examId}/sessions/${sessionId}`,
      data
    );
    return response.data;
  },

  deleteSession: async (examId, sessionId) => {
      const response = await api.delete(
        `/api/v1/exams/${examId}/sessions/${sessionId}`
      );
      return response.data;
    },

  shareExam: async (examId, teacherEmail, permission = 'viewer') => {
    const response = await api.post(`/api/v1/exams/${examId}/share`, {
      teacher_email: teacherEmail,
      permission: permission,
    });
    return response.data;
  },
};