import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOverview = () => api.get('/dashboard/overview');
export const getLiveFeed = (limit = 30) => api.get(`/dashboard/live-feed?limit=${limit}`);
export const getAlerts = () => api.get('/dashboard/alerts');
export const getRiskWeights = () => api.get('/dashboard/weights');
export const updateRiskWeights = (weights) => api.post('/dashboard/weights', weights);
export const getModelMetrics = () => api.get('/model/metrics');

export const analyzeTransaction = (data) => api.post('/risk/analyze-transaction', data);
export const analyzeCall = (data) => api.post('/risk/analyze-call', data);
export const analyzeCombined = (data) => api.post('/risk/analyze-combined', data);

export const getEntities = (limit = 50) => api.get(`/entities/list?limit=${limit}`);
export const searchEntities = (q) => api.get(`/entities/search?q=${encodeURIComponent(q)}`);
export const getEntityProfile = (upiId) => api.get(`/entities/${encodeURIComponent(upiId)}`);
export const getEntityNetwork = (upiId, depth = 2) => api.get(`/entities/${encodeURIComponent(upiId)}/network?depth=${depth}`);

export const getScamPatterns = () => api.get('/voice/patterns');
export const uploadAudio = (formData) => api.post('/voice/upload-audio', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const analyzeTranscript = (formData) => api.post('/voice/analyze-transcript', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getInvestigationCases = (verdictFilter = null) => {
  const url = verdictFilter ? `/investigations/cases?verdict_filter=${verdictFilter}` : '/investigations/cases';
  return api.get(url);
};
export const reviewCase = (data) => api.post('/investigations/review', data);
export const recordUserConfirmation = (data) => api.post('/user/confirmation', data);
export const submitFraudReport = (data) => api.post('/reports', data);

export const getScenarios = () => api.get('/simulation/scenarios');
export const runScenario = (scenarioId) => api.post(`/simulation/run-scenario/${scenarioId}`);

export default api;
