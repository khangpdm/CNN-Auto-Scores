import {api} from '../api';

export const sessionService = {
  getSessions: async (examId) => {
    const response = await api.get(`/api/v1/exams/${examId}/sessions`);
    return response.data;
  },

  createSession: async (examId, data) => {
    const response = await api.post(`/api/v1/exams/${examId}/sessions`, data);
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