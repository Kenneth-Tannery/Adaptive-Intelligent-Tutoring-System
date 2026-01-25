import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

export const fetchBktSnapshot = async ({ studentId, skillName }) => {
  const response = await apiClient.get('/bkt/snapshot', {
    params: { student_id: studentId, skill_name: skillName },
  });
  return response.data;
};

export const submitAnswer = async (payload) => {
  const response = await apiClient.post('/answers', payload);
  return response.data;
};

export const generateProblem = async ({ skillName, zpdStatus }) => {
  const response = await apiClient.post('/llm/problem', {
    skill_name: skillName,
    zpd_status: zpdStatus,
  });
  return response.data;
};

export const sendOpikTrace = async (payload) => {
  const response = await apiClient.post('/opik/trace', payload);
  return response.data;
};
