import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const receptionistAPI = {
  getDoctors: () => api.get('/receptionist/doctors'),
  registerPatient: (formData) => api.post('/receptionist/register-patient', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDashboardStats: () => api.get('/receptionist/dashboard-stats'),
  getAllPatients: () => api.get('/receptionist/patients'),
  bookAppointment: (data) => api.post('/receptionist/book-appointment', data),
};

export const doctorAPI = {
  getDashboardStats: () => api.get('/doctor/dashboard-stats'),
  getTodayPatients: () => api.get('/doctor/today-patients'),
  getAssignedPatients: (scope = 'my') => api.get(`/doctor/patients?scope=${scope}`),
  getPatientProfile: (patientId) => api.get(`/doctor/patient/${patientId}`),
  runAnalysis: (patientId) => api.post(`/doctor/run-analysis/${patientId}`),
  addDoctorNotes: (data) => api.post('/doctor/add-notes', data),
  getReportPdfUrl: (patientId) => `${API_BASE_URL}/doctor/report/${patientId}`,
};

export default api;