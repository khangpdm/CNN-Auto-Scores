import { api } from '../api';

export const examService = {
  getExams: async () => {
    const response = await api.get('/api/v1/exams');
    return response.data;
  },

  createExam: async (examName) => {
    // Tự động tạo exam_code từ exam_name
    const examCode = examName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 30);

    const response = await api.post('/api/v1/exams', {
      exam_code: examCode,
      exam_name: examName,
    });
    return response.data;
  },

  getExamDetail: async (examId) => {
    const response = await api.get(`api/v1/exams/${examId}`);
    return response.data;
  },

  updateExam: async (examId, data) => {
    const response = await api.put(`/api/v1/exams/${examId}`, data);
    return response.data;
  },

  deleteExam: async (examId) => {
  const response = await api.delete(`/api/v1/exams/${examId}`);
  return response.data;
  },

  shareExam: async (examId, data) => {
    const response = await api.post(`/api/v1/exams/${examId}/share`, data);
    return response.data;
  },
};
