import { api } from '../api';

export const studentService = {
  uploadStudents: async (sessionId, file) => {
    const formData = new FormData();
    formData.append('file_excel', file);

    const response = await api.post(
        `/api/v1/session/${sessionId}/upload_students`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
        }
    );
    return response.data;
  },

  getStudents: async (sessionId) => {
    const response = await api.get(`/api/v1/session/${sessionId}/students`);
    return response.data;
  },

  addStudent: async (sessionId, data) => {
    const response = await api.post(`api/v1/session`)
  },

  deleteStudent: async (studentId) => {
    const response = await api.delete(`/api/v1/students/${studentId}`);
    return response.data;
  },

  deleteAllStudents: async (session_id) => {
    const response = await api.delete(`/sessions/${session_id}/students`);
    return response.data;
  },
}