import React, { useState, useEffect } from 'react';
import { patientService, appointmentService, prescriptionService } from '../services/api';
import './Dashboard.css';

function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const patientId = parseInt(localStorage.getItem('patientId')) || parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (!patientId) {
        setError('Patient ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const [historyRes, recordsRes, apptRes, prescRes] = await Promise.all([
        patientService.getMedicalHistory(patientId),
        patientService.getRecords(patientId),
        appointmentService.getAppointments({ patientId }),
        prescriptionService.getPrescriptions(patientId),
      ]);

      setHistory(historyRes.data);
      setRecords(recordsRes.data);
      setAppointments(apptRes.data);
      setPrescriptions(prescRes.data);
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load data. Check your connection.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    try {
      await appointmentService.createAppointment({
        patientId,
        scheduledDate: formData.get('date'),
        reason: formData.get('reason'),
      });
      setSuccess('Appointment scheduled successfully');
      e.target.reset();
      fetchInitialData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure?')) {
      setLoading(true);
      try {
        await appointmentService.deleteAppointment(appointmentId);
        setSuccess('Appointment cancelled');
        fetchInitialData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to cancel appointment');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h2>Patient Dashboard</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Medical Records
          </button>
          <button
            className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions
          </button>
          <button
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                {history && (
                  <>
                    <div className="stat-card">
                      <div className="stat-value">{history.total_records || 0}</div>
                      <div className="stat-label">Medical Records</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{history.total_prescriptions || 0}</div>
                      <div className="stat-label">Prescriptions</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{history.total_appointments || 0}</div>
                      <div className="stat-label">Appointments</div>
                    </div>
                  </>
                )}
              </div>

              <div className="card">
                <h3 className="card-title">Schedule an Appointment</h3>
                <form onSubmit={handleScheduleAppointment}>
                  <div className="form-group">
                    <label htmlFor="date">Date & Time</label>
                    <input
                      id="date"
                      type="datetime-local"
                      name="date"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reason">Reason for Visit</label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows="4"
                      placeholder="Describe your reason for the appointment"
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Schedule Appointment
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="card">
              <h3 className="card-title">Medical Records</h3>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : records.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Diagnosis</th>
                      <th>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.record_type}</td>
                        <td>{record.description}</td>
                        <td>{record.diagnosis || '-'}</td>
                        <td>
                          {record.first_name} {record.last_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No medical records found.</p>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="card">
              <h3 className="card-title">Prescriptions</h3>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : prescriptions.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.id}>
                        <td>{prescription.medication}</td>
                        <td>{prescription.dosage || '-'}</td>
                        <td>{prescription.frequency || '-'}</td>
                        <td>{new Date(prescription.start_date).toLocaleDateString()}</td>
                        <td>{prescription.end_date ? new Date(prescription.end_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <span className={`status status-${prescription.status}`}>
                            {prescription.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No prescriptions found.</p>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="card">
              <h3 className="card-title">Appointments</h3>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : appointments.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          {new Date(appointment.scheduled_date).toLocaleString()}
                        </td>
                        <td>{appointment.reason || '-'}</td>
                        <td>
                          <span className={`status status-${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          {appointment.status === 'scheduled' && (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleCancelAppointment(appointment.id)}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No appointments found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
