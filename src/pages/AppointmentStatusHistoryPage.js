import React, { useState, useEffect, useCallback } from 'react';
import {
  getAppointmentStatusHistory,
  createAppointmentStatusHistory,
  updateAppointmentStatusHistory,
  deleteAppointmentStatusHistory,
  getStatusHistoryByAppointment
} from '../services/appointmentStatusHistoryService';
import ErrorDisplay from '../components/ErrorDisplay';
import './AppointmentStatusHistoryPage.css';

const AppointmentStatusHistoryPage = () => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    appointment_id: '',
    old_status: 'scheduled',
    new_status: 'confirmed',
    changed_by: ''
  });
  
  // Filter state
  const [appointmentFilter, setAppointmentFilter] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (appointmentFilter) {
        response = await getStatusHistoryByAppointment(appointmentFilter);
      } else {
        response = await getAppointmentStatusHistory();
      }
      setHistoryRecords(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointment status history');
    } finally {
      setLoading(false);
    }
  }, [appointmentFilter]);

  // Fetch history on component mount and when filter changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    setAppointmentFilter(e.target.value);
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      const changedAt = record.changed_at 
        ? new Date(record.changed_at).toISOString().slice(0, 16)
        : '';
      setFormData({
        appointment_id: record.appointment_id._id || record.appointment_id || '',
        old_status: record.old_status || 'scheduled',
        new_status: record.new_status || 'confirmed',
        changed_by: record.changed_by || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        appointment_id: '',
        old_status: 'scheduled',
        new_status: 'confirmed',
        changed_by: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setFormData({
      appointment_id: '',
      old_status: 'scheduled',
      new_status: 'confirmed',
      changed_by: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate that old_status and new_status are different
    if (formData.old_status === formData.new_status) {
      setError('Old status and new status must be different');
      return;
    }
    
    try {
      const submitData = { ...formData };
      // Don't include old_status if creating (backend will use current appointment status)
      if (!editingRecord) {
        delete submitData.old_status;
      }
      
      if (editingRecord) {
        await updateAppointmentStatusHistory(editingRecord._id, submitData);
        setSuccess('Status history record updated successfully!');
      } else {
        const response = await createAppointmentStatusHistory(submitData);
        setSuccess(response.message || 'Status history record created and appointment status updated!');
      }
      
      handleCloseModal();
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to save status history record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this status history record?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteAppointmentStatusHistory(recordId);
      setSuccess('Status history record deleted successfully!');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to delete status history record');
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

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const appointmentStatuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' }
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

  return (
    <div className="appointment-status-history-page">
      <div className="history-header">
        <h1>Appointment Status History</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Create Status Change
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-appointment">Filter by Appointment ID:</label>
          <input
            type="text"
            id="filter-appointment"
            value={appointmentFilter}
            onChange={handleFilterChange}
            placeholder="Enter Appointment ID"
            className="filter-input"
          />
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setAppointmentFilter('')}
        >
          Clear Filter
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* History Records */}
      {loading ? (
        <div className="loading">Loading status history...</div>
      ) : historyRecords.length === 0 ? (
        <div className="no-data">No status history records found</div>
      ) : (
        <div className="history-list">
          {historyRecords.map(record => (
            <div key={record._id} className="history-card">
              <div className="history-header-card">
                <div className="history-main-info">
                  <div className="status-change">
                    <span className={getStatusClass(record.old_status)}>
                      {record.old_status}
                    </span>
                    <span className="status-arrow">→</span>
                    <span className={getStatusClass(record.new_status)}>
                      {record.new_status}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="changed-by">
                      Changed by: <strong>{record.changed_by}</strong>
                    </span>
                    <span className="changed-at">
                      {formatDate(record.changed_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="history-details">
                <div className="detail-item">
                  <span className="detail-label">Appointment ID:</span>
                  <span className="detail-value">{record.appointment_id?._id || record.appointment_id || 'N/A'}</span>
                </div>
                {record.appointment_id && typeof record.appointment_id === 'object' && (
                  <div className="detail-item">
                    <span className="detail-label">Appointment Info:</span>
                    <span className="detail-value">{getAppointmentInfo(record.appointment_id)}</span>
                  </div>
                )}
              </div>
              
              <div className="history-actions">
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() => handleOpenModal(record)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(record._id)}
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
              <h2>{editingRecord ? 'Edit Status History' : 'Create Status Change'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="appointment_id">Appointment ID *</label>
                <input
                  type="text"
                  id="appointment_id"
                  name="appointment_id"
                  value={formData.appointment_id}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter Appointment ID"
                />
                {!editingRecord && (
                  <small className="form-hint">
                    Note: Creating a new status change will automatically update the appointment status
                  </small>
                )}
              </div>

              {editingRecord && (
                <div className="form-group">
                  <label htmlFor="old_status">Old Status *</label>
                  <select
                    id="old_status"
                    name="old_status"
                    value={formData.old_status}
                    onChange={handleInputChange}
                    required
                  >
                    {appointmentStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="new_status">New Status *</label>
                <select
                  id="new_status"
                  name="new_status"
                  value={formData.new_status}
                  onChange={handleInputChange}
                  required
                >
                  {appointmentStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="changed_by">Changed By *</label>
                <input
                  type="text"
                  id="changed_by"
                  name="changed_by"
                  value={formData.changed_by}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter name or user ID"
                />
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
                  {editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentStatusHistoryPage;

