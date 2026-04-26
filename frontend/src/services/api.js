import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

const patientService = {
  getRecords: (patientId, limit = 10, offset = 0) =>
    api.get(`/patients/${patientId}/records`, { params: { limit, offset } }),
  addRecord: (patientId, recordData) =>
    api.post(`/patients/${patientId}/records`, recordData),
  getRecord: (patientId, recordId) =>
    api.get(`/patients/${patientId}/records/${recordId}`),
  updateRecord: (patientId, recordId, recordData) =>
    api.put(`/patients/${patientId}/records/${recordId}`, recordData),
  deleteRecord: (patientId, recordId) =>
    api.delete(`/patients/${patientId}/records/${recordId}`),
  getMedicalHistory: (patientId) =>
    api.get(`/patients/${patientId}/medical-history`),
};

const prescriptionService = {
  addPrescription: (patientId, prescriptionData) =>
    api.post(`/prescriptions/${patientId}/prescriptions`, prescriptionData),
  getPrescriptions: (patientId, limit = 10, offset = 0) =>
    api.get(`/prescriptions/${patientId}/prescriptions`, { params: { limit, offset } }),
  getPrescription: (prescriptionId) =>
    api.get(`/prescriptions/${prescriptionId}`),
  updatePrescriptionStatus: (prescriptionId, status) =>
    api.put(`/prescriptions/${prescriptionId}/status`, { status }),
};

const appointmentService = {
  createAppointment: (appointmentData) =>
    api.post('/appointments', appointmentData),
  getAppointments: (filters) =>
    api.get('/appointments', { params: filters }),
  updateAppointment: (appointmentId, appointmentData) =>
    api.put(`/appointments/${appointmentId}`, appointmentData),
  deleteAppointment: (appointmentId) =>
    api.delete(`/appointments/${appointmentId}`),
};

const adminService = {
  getPatients: (limit = 20, offset = 0, search) =>
    api.get('/admin/patients', { params: { limit, offset, search } }),
  getStatistics: () => api.get('/admin/statistics'),
  getReports: (startDate, endDate) =>
    api.get('/admin/reports', { params: { startDate, endDate } }),
  createUser: (userData) => api.post('/admin/users', userData),
};

export {
  authService,
  patientService,
  prescriptionService,
  appointmentService,
  adminService,
};
