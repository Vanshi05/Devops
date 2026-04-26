import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import './Dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('statistics');
  const [statistics, setStatistics] = useState(null);
  const [patients, setPatients] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async (term = '') => {
    setLoading(true);
    try {
      const response = await adminService.getPatients(20, 0, term);
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminService.getReports();
      setReports(response.data);
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchPatients('');
  }, [fetchStatistics, fetchPatients]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    try {
      await adminService.createUser({
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        licenseNumber: formData.get('licenseNumber'),
        specialization: formData.get('specialization'),
      });
      setSuccess('User created successfully');
      e.target.reset();
      setShowAddUser(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h2>Admin Dashboard</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('statistics');
              fetchStatistics();
            }}
          >
            Statistics
          </button>
          <button
            className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('patients');
              fetchPatients(searchTerm);
            }}
          >
            Patients
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reports');
              fetchReports();
            }}
          >
            Reports
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'statistics' && (
            <div>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : statistics ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{statistics.total_patients}</div>
                    <div className="stat-label">Total Patients</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.total_providers}</div>
                    <div className="stat-label">Healthcare Providers</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.total_records}</div>
                    <div className="stat-label">Medical Records</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.active_prescriptions}</div>
                    <div className="stat-label">Active Prescriptions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.upcoming_appointments}</div>
                    <div className="stat-label">Upcoming Appointments</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.total_prescriptions}</div>
                    <div className="stat-label">Total Prescriptions</div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="card">
              <h3 className="card-title">Patient Management</h3>

              <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="search">Search Patients</label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by email, name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 'auto' }}>
                    <button type="submit" className="btn btn-primary">
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {loading ? (
                <div className="loading">Loading...</div>
              ) : patients.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>DOB</th>
                      <th>Blood Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id}>
                        <td>{patient.email}</td>
                        <td>
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td>
                          {patient.date_of_birth
                            ? new Date(patient.date_of_birth).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>{patient.blood_type || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No patients found.</p>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="card">
              <h3 className="card-title">Reports</h3>
              <p style={{ marginBottom: '1rem' }}>
                Daily activity summary of medical records, prescriptions, and
                appointments.
              </p>

              {loading ? (
                <div className="loading">Loading...</div>
              ) : reports.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Records Added</th>
                      <th>Prescriptions</th>
                      <th>Appointments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={index}>
                        <td>
                          {report.report_date
                            ? new Date(report.report_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>{report.records_added || 0}</td>
                        <td>{report.prescriptions_issued || 0}</td>
                        <td>{report.appointments_scheduled || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No reports available.</p>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <h3 className="card-title">User Management</h3>

              <button
                className="btn btn-success"
                onClick={() => setShowAddUser(!showAddUser)}
                style={{ marginBottom: '1rem' }}
              >
                {showAddUser ? 'Cancel' : '+ Add User'}
              </button>

              {showAddUser && (
                <form onSubmit={handleAddUser} className="record-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input id="firstName" type="text" name="firstName" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input id="lastName" type="text" name="lastName" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" name="email" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" name="password" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">User Type</label>
                    <select
                      id="role"
                      name="role"
                      required
                    >
                      <option value="patient">Patient</option>
                      <option value="provider">Healthcare Provider</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number (Providers)</label>
                    <input
                      id="licenseNumber"
                      type="text"
                      name="licenseNumber"
                      placeholder="Optional for patients"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="specialization">Specialization (Providers)</label>
                    <input
                      id="specialization"
                      type="text"
                      name="specialization"
                      placeholder="Optional"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Create User
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
