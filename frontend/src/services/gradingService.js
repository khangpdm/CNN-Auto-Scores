import { api } from '../api';

export const gradingService = {
    scanPapers: async (sessionId, files) => {
        const formData = new FormData();
        const fileList = Array.isArray(files) ? files : [files];

        fileList.forEach((file) => {
            formData.append('files', file);
        });

        const response = await api.post(`/api/v1/grading/sessions/${sessionId}/scan`,
            formData,
            {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getScanStatus: async (batchId) => {
        const response = await api.get(`/api/v1/grading/scan-batches/${batchId}/status`);
        return response.data;
    },

    getResults: async (sessionId, params) => {
        const response = await api.get(`/api/v1/sessions/${sessionId}/results`);
        return response.data;
    },

    getResultDetail: async (resultId) => {
        const response = await api.get(`/api/v1/results/${resultId}`);
        return response.data;
    },

    updateResult: async (resultId, data) => {
        const response = await api.put(`/api/v1/result/${resultId}`,data);
        return response.data;
    },

    deleteResult: async (resultId) => {
        const response = await api.delete(`/api/v1/results/${resultId}`);
        return response.data;
    },

    clearAllResults: async (sessionId) => {
        const response = await api.delete(`/api/v1/sessions/${sessionId}/results/clear`);
        return response.data;
    },

    exportResults: async (sessionId) => {
        const response = await api.get(`/api/v1/sessions/${sessionId}/export-excel`);
        return response.data;
    },
}