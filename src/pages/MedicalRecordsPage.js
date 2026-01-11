import React, { useState, useEffect, useCallback } from 'react';
import {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getRecordsByPatient
} from '../services/medicalRecordService';
import { getPatients } from '../services/patientService';
import { getAppointmentsByDoctor } from '../services/appointmentService';
import { getCurrentDoctorId, isDoctor } from '../utils/doctorUtils';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './MedicalRecordsPage.css';

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    treatment_notes: ''
  });
  
  // Filter state
  const [patientFilter, setPatientFilter] = useState('');
  
  // Patients state for dropdowns
  const [patients, setPatients] = useState([]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If user is a doctor, only fetch records for their patients
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (doctorId) {
          // Get doctor's appointments to find their patients
          const appointmentsRes = await getAppointmentsByDoctor(doctorId);
          const appointments = appointmentsRes.data || [];
          const patientIds = new Set(
            appointments.map(apt => {
              const patientId = typeof apt.patient_id === 'object' ? apt.patient_id._id : apt.patient_id;
              return patientId;
            }).filter(Boolean)
          );
          
          // Fetch all records and filter by doctor's patients
          const allRecordsRes = await getMedicalRecords();
          const allRecords = allRecordsRes.data || [];
          let filteredRecords = allRecords.filter(record => {
            const recordPatientId = typeof record.patient_id === 'object' ? record.patient_id._id : record.patient_id;
            return patientIds.has(recordPatientId);
          });
          
          // Apply patient filter if set
          if (patientFilter) {
            filteredRecords = filteredRecords.filter(record => {
              const recordPatientId = typeof record.patient_id === 'object' ? record.patient_id._id : record.patient_id;
              return recordPatientId === patientFilter;
            });
          }
          
          setRecords(filteredRecords);
          setLoading(false);
          return;
        } else {
          setError('Doctor profile not found. Please contact administrator.');
          setRecords([]);
          setLoading(false);
          return;
        }
      }
      
      // Admin logic
      if (patientFilter) {
        response = await getRecordsByPatient(patientFilter);
      } else {
        response = await getMedicalRecords();
      }
      setRecords(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  }, [patientFilter]);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await getPatients();
      setPatients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  }, []);

  // Fetch records on component mount and when filter changes
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    setPatientFilter(e.target.value);
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        patient_id: record.patient_id._id || record.patient_id || '',
        diagnosis: record.diagnosis || '',
        treatment_notes: record.treatment_notes || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        patient_id: '',
        diagnosis: '',
        treatment_notes: ''
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
      patient_id: '',
      diagnosis: '',
      treatment_notes: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingRecord) {
        await updateMedicalRecord(editingRecord._id, formData);
        setSuccess('Medical record updated successfully!');
      } else {
        await createMedicalRecord(formData);
        setSuccess('Medical record created successfully!');
      }
      
      handleCloseModal();
      fetchRecords();
    } catch (err) {
      setError(err.message || 'Failed to save medical record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteMedicalRecord(recordId);
      setSuccess('Medical record deleted successfully!');
      fetchRecords();
    } catch (err) {
      setError(err.message || 'Failed to delete medical record');
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

  const getPatientName = (patient) => {
    if (!patient) return 'N/A';
    if (typeof patient === 'object' && patient.first_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    return 'N/A';
  };

  return (
    <div className="medical-records-page">
      <div className="medical-records-header">
        <h1>Medical Records Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {records.length > 0 && (
            <ReportButton
              data={records}
              entityType="medicalRecords"
              title="Medical Records Report"
              filters={{ patient_id: patientFilter }}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create Medical Record
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-patient">Filter by Patient:</label>
          <select
            id="filter-patient"
            value={patientFilter}
            onChange={handleFilterChange}
          >
            <option value="">All Patients</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.first_name} {patient.last_name} ({patient.email})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setPatientFilter('')}
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

      {/* Medical Records List */}
      {loading ? (
        <div className="loading">Loading medical records...</div>
      ) : records.length === 0 ? (
        <div className="no-data">No medical records found</div>
      ) : (
        <div className="records-list">
          {records.map(record => (
            <div key={record._id} className="record-card">
              <div className="record-header">
                <div className="record-patient-info">
                  <h3 className="patient-name">
                    {getPatientName(record.patient_id)}
                  </h3>
                  {record.patient_id && typeof record.patient_id === 'object' && (
                    <div className="patient-details">
                      <span className="patient-email">{record.patient_id.email}</span>
                      {record.patient_id.phone && (
                        <span className="patient-phone"> • {record.patient_id.phone}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="record-date">
                  {formatDate(record.created_at)}
                </div>
              </div>
              
              <div className="record-content">
                <div className="record-section">
                  <label className="record-label">Diagnosis:</label>
                  <p className="record-diagnosis">{record.diagnosis}</p>
                </div>
                
                {record.treatment_notes && (
                  <div className="record-section">
                    <label className="record-label">Treatment Notes:</label>
                    <p className="record-notes">{record.treatment_notes}</p>
                  </div>
                )}
              </div>
              
              <div className="record-actions">
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
              <h2>{editingRecord ? 'Edit Medical Record' : 'Create New Medical Record'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="patient_id">Patient *</label>
                <select
                  id="patient_id"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.first_name} {patient.last_name} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="diagnosis">Diagnosis *</label>
                <textarea
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="treatment_notes">Treatment Notes</label>
                <textarea
                  id="treatment_notes"
                  name="treatment_notes"
                  value={formData.treatment_notes}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Enter treatment notes, medications, follow-up instructions..."
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

export default MedicalRecordsPage;

