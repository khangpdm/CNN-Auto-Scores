import { api } from '../api';
import axios from "axios";

export const answerService = {
    uploadAnswerKey: async(sessionId, file) => {
        const formData = new FormData();
        formData.append('file_excel', file);

        const response = await api.post(
            `/api/v1/session/${sessionId}/answers/upload_excels`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            }
        );
        return response.data;
    },

    getAnswerKeys: async (sessionId) => {
        const response = await api.get(`/api/v1/sessions/${sessionId}/answers`)
        return response.data;
    },

    deleteAnswerKey: async (answerKeyId) => {
        const response = await api.delete(`/api/v1/answers/${answerKeyId}`)
        return response.data;
    }
}