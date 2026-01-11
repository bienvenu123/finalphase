import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments } from '../services/appointmentService';
import { getPatients } from '../services/patientService';
import { getDoctors } from '../services/doctorService';
import { getMedicalRecords } from '../services/medicalRecordService';
import { getUsers } from '../services/userService';
import { getDepartments } from '../services/departmentService';
import { getNotifications } from '../services/notificationService';
import ReportButton from '../components/ReportButton';
import ErrorDisplay from '../components/ErrorDisplay';
import './ReportsPage.css';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('appointments');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    doctor_id: '',
    patient_id: '',
    department_id: '',
    gender: '',
    role: '',
    notification_type: '',
    is_read: ''
  });

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Report type configurations
  const reportTypes = [
    { value: 'appointments', label: 'Appointments', icon: '📋' },
    { value: 'patients', label: 'Patients', icon: '🏥' },
    { value: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { value: 'medicalRecords', label: 'Medical Records', icon: '📝' },
    { value: 'users', label: 'Users', icon: '👥' },
    { value: 'departments', label: 'Departments', icon: '🏢' },
    { value: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  // Fetch data based on report type
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (reportType) {
        case 'appointments':
          response = await getAppointments();
          break;
        case 'patients':
          response = await getPatients();
          break;
        case 'doctors':
          response = await getDoctors();
          break;
        case 'medicalRecords':
          response = await getMedicalRecords();
          break;
        case 'users':
          response = await getUsers();
          break;
        case 'departments':
          response = await getDepartments();
          break;
        case 'notifications':
          response = await getNotifications();
          break;
        default:
          response = { data: [] };
      }
      
      setData(response.data || []);
      setFilteredData(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [doctorsRes, patientsRes, departmentsRes] = await Promise.all([
          getDoctors().catch(() => ({ data: [] })),
          getPatients().catch(() => ({ data: [] })),
          getDepartments().catch(() => ({ data: [] }))
        ]);
        
        setDoctors(doctorsRes.data || []);
        setPatients(patientsRes.data || []);
        setDepartments(departmentsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
      }
    };
    
    fetchDropdownData();
  }, []);

  // Fetch data when report type changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    // Date range filter - improved to handle different entity types
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(item => {
        // Determine which date field to use based on report type
        let itemDate = null;
        
        if (reportType === 'appointments') {
          itemDate = item.appointment_date || item.createdAt;
        } else if (reportType === 'patients') {
          itemDate = item.createdAt || item.date_of_birth;
        } else if (reportType === 'notifications') {
          itemDate = item.sent_at || item.createdAt;
        } else {
          // For other types, use createdAt or updatedAt
          itemDate = item.createdAt || item.updatedAt;
        }
        
        if (!itemDate) return false;
        
        const itemDateObj = new Date(itemDate);
        itemDateObj.setHours(0, 0, 0, 0);
        
        // Check from date
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (itemDateObj < fromDate) return false;
        }
        
        // Check to date
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (itemDateObj > toDate) return false;
        }
        
        return true;
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Doctor filter
    if (filters.doctor_id) {
      filtered = filtered.filter(item => {
        const doctorId = typeof item.doctor_id === 'object' ? item.doctor_id._id : item.doctor_id;
        return doctorId === filters.doctor_id;
      });
    }

    // Patient filter
    if (filters.patient_id) {
      filtered = filtered.filter(item => {
        const patientId = typeof item.patient_id === 'object' ? item.patient_id._id : item.patient_id;
        return patientId === filters.patient_id;
      });
    }

    // Department filter
    if (filters.department_id) {
      filtered = filtered.filter(item => {
        const deptId = typeof item.department_id === 'object' ? item.department_id._id : item.department_id;
        return deptId === filters.department_id;
      });
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(item => item.gender === filters.gender);
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(item => item.role === filters.role);
    }

    // Notification type filter
    if (filters.notification_type) {
      filtered = filtered.filter(item => item.notification_type === filters.notification_type);
    }

    // Read status filter
    if (filters.is_read !== '') {
      const isRead = filters.is_read === 'true';
      filtered = filtered.filter(item => item.is_read === isRead);
    }

    setFilteredData(filtered);
  }, [data, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      doctor_id: '',
      patient_id: '',
      department_id: '',
      gender: '',
      role: '',
      notification_type: '',
      is_read: ''
    });
  };

  // Quick date range presets
  const setQuickDateRange = (preset) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        break;
      case 'thisWeek':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFrom = weekStart.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateFrom = lastMonth.toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last3Months':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        dateFrom = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case 'last6Months':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        dateFrom = sixMonthsAgo.toISOString().split('T')[0];
        break;
      case 'thisYear':
        dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }));
  };

  const getReportTitle = () => {
    const type = reportTypes.find(t => t.value === reportType);
    return type ? `${type.label} Report` : 'Report';
  };

  const getActiveFilters = () => {
    const active = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        active[key] = value;
      }
    });
    return active;
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📊 Reports & Analytics</h1>
        <div className="reports-actions">
          {filteredData.length > 0 && (
            <ReportButton
              data={filteredData}
              entityType={reportType}
              title={getReportTitle()}
              filters={getActiveFilters()}
            />
          )}
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="report-type-selector">
        {reportTypes.map(type => (
          <button
            key={type.value}
            className={`report-type-btn ${reportType === type.value ? 'active' : ''}`}
            onClick={() => setReportType(type.value)}
          >
            <span className="report-type-icon">{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="reports-filters">
        <h3>Filters</h3>
        
        {/* Date Range Section - Prominent */}
        <div className="date-range-section">
          <h4>📅 Date Range</h4>
          <div className="quick-date-buttons">
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('today')}
              title="Today"
            >
              Today
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('thisWeek')}
              title="This Week"
            >
              This Week
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('thisMonth')}
              title="This Month"
            >
              This Month
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('lastMonth')}
              title="Last Month"
            >
              Last Month
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('last3Months')}
              title="Last 3 Months"
            >
              Last 3 Months
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('last6Months')}
              title="Last 6 Months"
            >
              Last 6 Months
            </button>
            <button 
              className="quick-date-btn" 
              onClick={() => setQuickDateRange('thisYear')}
              title="This Year"
            >
              This Year
            </button>
          </div>
          <div className="custom-date-range">
            <div className="filter-group">
              <label htmlFor="dateFrom">From Date:</label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="date-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="dateTo">To Date:</label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="date-input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <div className="date-range-display">
              <strong>Selected Range:</strong> {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Start'} to {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'End'}
            </div>
          )}
        </div>

        <div className="filters-grid">
          {/* Status Filter (for appointments) */}
          {reportType === 'appointments' && (
            <div className="filter-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          )}

          {/* Doctor Filter */}
          {(reportType === 'appointments' || reportType === 'medicalRecords') && (
            <div className="filter-group">
              <label htmlFor="doctor_id">Doctor:</label>
              <select
                id="doctor_id"
                name="doctor_id"
                value={filters.doctor_id}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Filter */}
          {(reportType === 'appointments' || reportType === 'medicalRecords') && (
            <div className="filter-group">
              <label htmlFor="patient_id">Patient:</label>
              <select
                id="patient_id"
                name="patient_id"
                value={filters.patient_id}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          {(reportType === 'doctors' || reportType === 'appointments') && (
            <div className="filter-group">
              <label htmlFor="department_id">Department:</label>
              <select
                id="department_id"
                name="department_id"
                value={filters.department_id}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Gender Filter (for patients) */}
          {reportType === 'patients' && (
            <div className="filter-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Role Filter (for users) */}
          {reportType === 'users' && (
            <div className="filter-group">
              <label htmlFor="role">Role:</label>
              <select
                id="role"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="Admin">Admin</option>
                <option value="admin">admin</option>
                <option value="doctor">Doctor</option>
                <option value="Doctor">Doctor</option>
              </select>
            </div>
          )}

          {/* Notification Type Filter */}
          {reportType === 'notifications' && (
            <div className="filter-group">
              <label htmlFor="notification_type">Type:</label>
              <select
                id="notification_type"
                name="notification_type"
                value={filters.notification_type}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          )}

          {/* Read Status Filter (for notifications) */}
          {reportType === 'notifications' && (
            <div className="filter-group">
              <label htmlFor="is_read">Read Status:</label>
              <select
                id="is_read"
                name="is_read"
                value={filters.is_read}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Read</option>
                <option value="false">Unread</option>
              </select>
            </div>
          )}
        </div>

        <div className="filters-actions">
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Report Summary */}
      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Records</h3>
          <p className="summary-value">{data.length}</p>
        </div>
        <div className="summary-card">
          <h3>Filtered Records</h3>
          <p className="summary-value">{filteredData.length}</p>
        </div>
        {(filters.dateFrom || filters.dateTo) && (
          <div className="summary-card date-range-summary">
            <h3>Date Range</h3>
            <p className="summary-value">
              {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Start'} - {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'End'}
            </p>
          </div>
        )}
      </div>

      {/* Data Preview */}
      <div className="report-preview">
        <h3>Data Preview ({filteredData.length} records)</h3>
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : filteredData.length === 0 ? (
          <div className="no-data">No data available for the selected filters.</div>
        ) : (
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {reportType === 'appointments' && (
                    <>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </>
                  )}
                  {reportType === 'patients' && (
                    <>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Date of Birth</th>
                    </>
                  )}
                  {reportType === 'doctors' && (
                    <>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Specialization</th>
                      <th>Department</th>
                      <th>License</th>
                    </>
                  )}
                  {reportType === 'medicalRecords' && (
                    <>
                      <th>Patient</th>
                      <th>Diagnosis</th>
                      <th>Treatment Notes</th>
                      <th>Created At</th>
                    </>
                  )}
                  {reportType === 'users' && (
                    <>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created At</th>
                    </>
                  )}
                  {reportType === 'departments' && (
                    <>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Created At</th>
                    </>
                  )}
                  {reportType === 'notifications' && (
                    <>
                      <th>User</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Read</th>
                      <th>Sent At</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((item, index) => (
                  <tr key={item._id || index}>
                    {reportType === 'appointments' && (
                      <>
                        <td>
                          {typeof item.patient_id === 'object' 
                            ? `${item.patient_id.first_name || ''} ${item.patient_id.last_name || ''}`.trim()
                            : 'N/A'}
                        </td>
                        <td>
                          {typeof item.doctor_id === 'object'
                            ? `${item.doctor_id.first_name || ''} ${item.doctor_id.last_name || ''}`.trim()
                            : 'N/A'}
                        </td>
                        <td>{item.appointment_date || 'N/A'}</td>
                        <td>{item.appointment_time || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${item.status}`}>
                            {item.status || 'N/A'}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'patients' && (
                      <>
                        <td>{`${item.first_name || ''} ${item.last_name || ''}`.trim()}</td>
                        <td>{item.email || 'N/A'}</td>
                        <td>{item.phone || 'N/A'}</td>
                        <td>{item.gender || 'N/A'}</td>
                        <td>{item.date_of_birth || 'N/A'}</td>
                      </>
                    )}
                    {reportType === 'doctors' && (
                      <>
                        <td>{`${item.first_name || ''} ${item.last_name || ''}`.trim()}</td>
                        <td>{item.email || 'N/A'}</td>
                        <td>{item.specialization || 'N/A'}</td>
                        <td>
                          {typeof item.department_id === 'object' 
                            ? item.department_id.name 
                            : 'N/A'}
                        </td>
                        <td>{item.license_number || 'N/A'}</td>
                      </>
                    )}
                    {reportType === 'medicalRecords' && (
                      <>
                        <td>
                          {typeof item.patient_id === 'object'
                            ? `${item.patient_id.first_name || ''} ${item.patient_id.last_name || ''}`.trim()
                            : 'N/A'}
                        </td>
                        <td>{item.diagnosis || 'N/A'}</td>
                        <td>{item.treatment_notes ? item.treatment_notes.substring(0, 50) + '...' : 'N/A'}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                    {reportType === 'users' && (
                      <>
                        <td>{item.name || 'N/A'}</td>
                        <td>{item.email || 'N/A'}</td>
                        <td>{item.role || 'N/A'}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                    {reportType === 'departments' && (
                      <>
                        <td>{item.name || 'N/A'}</td>
                        <td>{item.description ? item.description.substring(0, 50) + '...' : 'N/A'}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                    {reportType === 'notifications' && (
                      <>
                        <td>
                          {typeof item.user_id === 'object' 
                            ? item.user_id.name 
                            : 'N/A'}
                        </td>
                        <td>{item.message ? item.message.substring(0, 50) + '...' : 'N/A'}</td>
                        <td>{item.notification_type || 'N/A'}</td>
                        <td>{item.is_read ? 'Yes' : 'No'}</td>
                        <td>{item.sent_at ? new Date(item.sent_at).toLocaleDateString() : 'N/A'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 10 && (
              <p className="preview-note">
                Showing first 10 of {filteredData.length} records. Export full report to see all data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

