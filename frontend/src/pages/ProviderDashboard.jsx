import React, { useState, useEffect } from 'react';
import { patientService, prescriptionService, appointmentService, adminService } from '../services/api';
import './Dashboard.css';

function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await adminService.getPatients(50, 0);
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getAppointments({});
      setAppointments(response.data);
    } catch (err) {
      console.error('Failed to load appointments');
    }
  };

  const handleSelectPatient = async (patientId) => {
    setSelectedPatient(patientId);
    setLoading(true);
    try {
      const response = await patientService.getRecords(patientId);
      setRecords(response.data);
    } catch (err) {
      setError('Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    try {
      await patientService.addRecord(selectedPatient, {
        recordType: formData.get('recordType'),
        description: formData.get('description'),
        diagnosis: formData.get('diagnosis'),
        date: formData.get('date'),
      });
      setSuccess('Record added successfully');
      e.target.reset();
      setShowAddRecord(false);
      handleSelectPatient(selectedPatient);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    try {
      await prescriptionService.addPrescription(selectedPatient, {
        medication: formData.get('medication'),
        dosage: formData.get('dosage'),
        frequency: formData.get('frequency'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        instructions: formData.get('instructions'),
      });
      setSuccess('Prescription added successfully');
      e.target.reset();
      setShowAddPrescription(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h2>Provider Dashboard</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            Patients
          </button>
          <button
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'patients' && (
            <div>
              {!selectedPatient ? (
                <div className="card">
                  <h3 className="card-title">Your Patients</h3>
                  {loading ? (
                    <div className="loading">Loading patients...</div>
                  ) : patients.length > 0 ? (
                    <table className="table" style={{ cursor: 'pointer' }}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Name</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr key={patient.patient_id}>
                            <td>{patient.email}</td>
                            <td>
                              {patient.first_name} {patient.last_name}
                            </td>
                            <td>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleSelectPatient(patient.patient_id)}
                              >
                                View Records
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No patients found. Register a patient account first.</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedPatient(null);
                        setRecords([]);
                      }}
                    >
                      ← Back to Patients
                    </button>
                  </div>

                  <div className="card">
                    <h3 className="card-title">Patient Records</h3>
                    <button
                      className="btn btn-success"
                      onClick={() => setShowAddRecord(!showAddRecord)}
                      style={{ marginBottom: '1rem' }}
                    >
                      {showAddRecord ? 'Cancel' : '+ Add Record'}
                    </button>

                    {showAddRecord && (
                      <form onSubmit={handleAddRecord} className="record-form">
                        <div className="form-group">
                          <label htmlFor="recordType">Record Type</label>
                          <select id="recordType" name="recordType" required>
                            <option value="">Select type</option>
                            <option value="diagnosis">Diagnosis</option>
                            <option value="lab_result">Lab Result</option>
                            <option value="imaging">Imaging</option>
                            <option value="consultation">Consultation</option>
                            <option value="procedure">Procedure</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="date">Date</label>
                          <input
                            id="date"
                            type="date"
                            name="date"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="description">Description</label>
                          <textarea
                            id="description"
                            name="description"
                            rows="4"
                            required
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label htmlFor="diagnosis">Diagnosis/Findings</label>
                          <textarea
                            id="diagnosis"
                            name="diagnosis"
                            rows="3"
                          ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          Save Record
                        </button>
                      </form>
                    )}

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
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record) => (
                            <tr key={record.id}>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>{record.record_type}</td>
                              <td>{record.description.substring(0, 50)}...</td>
                              <td>{record.diagnosis || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No records found.</p>
                    )}
                  </div>

                  <div className="card" style={{ marginTop: '1rem' }}>
                    <h3 className="card-title">Add Prescription</h3>
                    <button
                      className="btn btn-success"
                      onClick={() => setShowAddPrescription(!showAddPrescription)}
                      style={{ marginBottom: '1rem' }}
                    >
                      {showAddPrescription ? 'Cancel' : '+ Add Prescription'}
                    </button>

                    {showAddPrescription && (
                      <form onSubmit={handleAddPrescription} className="record-form">
                        <div className="form-group">
                          <label htmlFor="medication">Medication</label>
                          <input
                            id="medication"
                            type="text"
                            name="medication"
                            required
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="dosage">Dosage</label>
                            <input
                              id="dosage"
                              type="text"
                              name="dosage"
                              placeholder="e.g., 500mg"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="frequency">Frequency</label>
                            <input
                              id="frequency"
                              type="text"
                              name="frequency"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="startDate">Start Date</label>
                            <input
                              id="startDate"
                              type="date"
                              name="startDate"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="endDate">End Date</label>
                            <input
                              id="endDate"
                              type="date"
                              name="endDate"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="instructions">Instructions</label>
                          <textarea
                            id="instructions"
                            name="instructions"
                            rows="3"
                            placeholder="Additional instructions for patient"
                          ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          Save Prescription
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="card">
              <h3 className="card-title">Upcoming Appointments</h3>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : appointments.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .filter((apt) => apt.status === 'scheduled')
                      .map((appointment) => (
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
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p>No appointments scheduled.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderDashboard;
