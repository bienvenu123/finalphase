import React, { useState, useEffect, useCallback } from 'react';
import {
  getAppointmentChanges,
  createAppointmentChange,
  updateAppointmentChange,
  deleteAppointmentChange,
  getChangesByAppointment
} from '../services/appointmentChangeService';
import { getAppointments } from '../services/appointmentService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './AppointmentChangesPage.css';

const AppointmentChangesPage = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingChange, setEditingChange] = useState(null);
  const [formData, setFormData] = useState({
    appointment_id: '',
    change_type: 'rescheduled',
    reason: '',
    changed_at: '',
    changed_date: '',
    changed_time: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    appointment_id: '',
    change_type: ''
  });

  // Appointments state for dropdown
  const [appointments, setAppointments] = useState([]);

  const fetchChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filters.appointment_id && !filters.change_type) {
        response = await getChangesByAppointment(filters.appointment_id);
      } else {
        response = await getAppointmentChanges(filters);
      }
      setChanges(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointment changes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch appointments for dropdown
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getAppointments();
      const appointmentsData = response.data || [];
      setAppointments(appointmentsData);
      console.log('✅ Loaded appointments for dropdown:', appointmentsData.length);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setAppointments([]);
    }
  }, []);

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch changes on component mount and when filters change
  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleOpenModal = (change = null) => {
    if (change) {
      setEditingChange(change);
      // Parse changed_at if it exists
      let changedDate = '';
      let changedTime = '';
      if (change.changed_at) {
        const date = new Date(change.changed_at);
        changedDate = date.toISOString().split('T')[0];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        changedTime = `${hours}:${minutes}`;
      }
      setFormData({
        appointment_id: change.appointment_id._id || change.appointment_id || '',
        change_type: change.change_type || 'rescheduled',
        reason: change.reason || '',
        changed_at: change.changed_at || '',
        changed_date: changedDate,
        changed_time: changedTime
      });
    } else {
      setEditingChange(null);
      // Set default to current date/time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        appointment_id: '',
        change_type: 'rescheduled',
        reason: '',
        changed_at: '',
        changed_date: currentDate,
        changed_time: currentTime
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChange(null);
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setFormData({
      appointment_id: '',
      change_type: 'rescheduled',
      reason: '',
      changed_at: '',
      changed_date: currentDate,
      changed_time: currentTime
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form data
    if (!formData.appointment_id) {
      setError('Please select an appointment');
      return;
    }
    
    if (!formData.change_type) {
      setError('Please select a change type');
      return;
    }
    
    // Prepare submission data
    const submitData = {
      appointment_id: formData.appointment_id,
      change_type: formData.change_type,
      reason: formData.reason || undefined
    };
    
    // Combine date and time into changed_at if both are provided
    if (formData.changed_date && formData.changed_time) {
      const [hours, minutes] = formData.changed_time.split(':');
      const changedAt = new Date(formData.changed_date);
      changedAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      submitData.changed_at = changedAt.toISOString();
    } else if (formData.changed_date) {
      // If only date is provided, use start of day
      const changedAt = new Date(formData.changed_date);
      changedAt.setHours(0, 0, 0, 0);
      submitData.changed_at = changedAt.toISOString();
    }
    // If no date/time provided, backend will use current timestamp
    
    console.log('📝 Submitting appointment change:', submitData);
    
    try {
      if (editingChange) {
        console.log('🔄 Updating appointment change:', editingChange._id);
        const response = await updateAppointmentChange(editingChange._id, submitData);
        console.log('✅ Update response:', response);
        setSuccess('Appointment change updated successfully!');
      } else {
        console.log('➕ Creating new appointment change');
        const response = await createAppointmentChange(submitData);
        console.log('✅ Create response:', response);
        setSuccess('Appointment change created successfully!');
      }
      
      handleCloseModal();
      fetchChanges();
    } catch (err) {
      console.error('❌ Error saving appointment change:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        stack: err.stack
      });
      setError(err.message || 'Failed to save appointment change. Please check the console for details.');
    }
  };

  const handleDelete = async (changeId) => {
    if (!window.confirm('Are you sure you want to delete this appointment change record?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteAppointmentChange(changeId);
      setSuccess('Appointment change deleted successfully!');
      fetchChanges();
    } catch (err) {
      setError(err.message || 'Failed to delete appointment change');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeClass = (changeType) => {
    return `change-type-badge change-type-${changeType}`;
  };

  const getChangeTypeLabel = (changeType) => {
    return changeType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const changeTypes = [
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'doctor_changed', label: 'Doctor Changed' },
    { value: 'time_changed', label: 'Time Changed' },
    { value: 'date_changed', label: 'Date Changed' },
    { value: 'patient_changed', label: 'Patient Changed' },
    { value: 'department_changed', label: 'Department Changed' },
    { value: 'reason_updated', label: 'Reason Updated' },
    { value: 'other', label: 'Other' }
  ];

  const getAppointmentInfo = (appointment) => {
    if (!appointment) return 'N/A';
    if (typeof appointment === 'object') {
      const date = appointment.appointment_date 
        ? new Date(appointment.appointment_date).toLocaleDateString()
        : 'N/A';
      const time = appointment.appointment_time || 'N/A';
      return `Date: ${date}, Time: ${time}`;
    }
    return appointment;
  };

  const getAppointmentDisplayText = (appointment) => {
    if (!appointment) return '';
    if (typeof appointment === 'object') {
      const patientName = appointment.patient_id?.first_name && appointment.patient_id?.last_name
        ? `${appointment.patient_id.first_name} ${appointment.patient_id.last_name}`
        : appointment.patient_id?.name || appointment.patient_id?.email || 'Unknown Patient';
      const date = appointment.appointment_date 
        ? new Date(appointment.appointment_date).toLocaleDateString()
        : 'N/A';
      const time = appointment.appointment_time || 'N/A';
      return `${patientName} - ${date} at ${time} (ID: ${appointment._id?.substring(0, 8) || 'N/A'})`;
    }
    return appointment;
  };

  return (
    <div className="appointment-changes-page">
      <div className="changes-header">
        <h1>Appointment Changes</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {changes.length > 0 && (
            <ReportButton
              data={changes}
              entityType="appointmentChanges"
              title="Appointment Changes Report"
              filters={filters}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Record Change
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-appointment">Filter by Appointment ID:</label>
          <input
            type="text"
            id="filter-appointment"
            name="appointment_id"
            value={filters.appointment_id}
            onChange={handleFilterChange}
            placeholder="Enter Appointment ID"
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-type">Change Type:</label>
          <select
            id="filter-type"
            name="change_type"
            value={filters.change_type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {changeTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setFilters({ appointment_id: '', change_type: '' })}
        >
          Clear Filters
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Changes List */}
      {loading ? (
        <div className="loading">Loading appointment changes...</div>
      ) : changes.length === 0 ? (
        <div className="no-data">No appointment changes found</div>
      ) : (
        <div className="changes-list">
          {changes.map(change => (
            <div key={change._id} className="change-card">
              <div className="change-header-card">
                <div className="change-main-info">
                  <div className="change-type-display">
                    <span className={getChangeTypeClass(change.change_type)}>
                      {getChangeTypeLabel(change.change_type)}
                    </span>
                  </div>
                  <div className="change-meta">
                    <span className="changed-at">
                      {formatDate(change.changed_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="change-details">
                <div className="detail-item">
                  <span className="detail-label">Appointment ID:</span>
                  <span className="detail-value">{change.appointment_id?._id || change.appointment_id || 'N/A'}</span>
                </div>
                {change.appointment_id && typeof change.appointment_id === 'object' && (
                  <div className="detail-item">
                    <span className="detail-label">Appointment Info:</span>
                    <span className="detail-value">{getAppointmentInfo(change.appointment_id)}</span>
                  </div>
                )}
                {change.reason && (
                  <div className="detail-item">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value reason-text">{change.reason}</span>
                  </div>
                )}
              </div>
              
              <div className="change-actions">
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() => handleOpenModal(change)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(change._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingChange ? 'Edit Appointment Change' : 'Record Appointment Change'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="appointment_id">Select Appointment (Patient) *</label>
                <select
                  id="appointment_id"
                  name="appointment_id"
                  value={formData.appointment_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an appointment...</option>
                  {appointments.map(appointment => (
                    <option key={appointment._id} value={appointment._id}>
                      {getAppointmentDisplayText(appointment)}
                    </option>
                  ))}
                </select>
                {appointments.length === 0 && (
                  <small className="form-hint" style={{ color: '#666', fontStyle: 'italic' }}>
                    No appointments available. Please create appointments first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="change_type">Change Type *</label>
                <select
                  id="change_type"
                  name="change_type"
                  value={formData.change_type}
                  onChange={handleInputChange}
                  required
                >
                  {changeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter reason for the change..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="changed_date">Change Date *</label>
                <input
                  type="date"
                  id="changed_date"
                  name="changed_date"
                  value={formData.changed_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="changed_time">Change Time *</label>
                <input
                  type="time"
                  id="changed_time"
                  name="changed_time"
                  value={formData.changed_time}
                  onChange={handleInputChange}
                  required
                />
                <small className="form-hint" style={{ color: '#666', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                  When did this change occur?
                </small>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChange ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentChangesPage;

