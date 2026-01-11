import React, { useState, useEffect, useCallback } from 'react';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor
} from '../services/appointmentService';
import { getPatient, getPatients, createPatient, searchPatients, getPatientByPatientId } from '../services/patientService';
import { getDoctors, getDoctor } from '../services/doctorService';
import { getDepartments } from '../services/departmentService';
import { createNotification } from '../services/notificationService';
import { getCurrentDoctorId, isDoctor } from '../utils/doctorUtils';
import { generateTimeSlots, isValid15MinuteInterval, roundTo15Minutes } from '../utils/timeUtils';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timeAvailability, setTimeAvailability] = useState({}); // Track which times are available
  const [timeCheckLoading, setTimeCheckLoading] = useState(false);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [patientType, setPatientType] = useState('existing'); // 'existing' or 'new'
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    department_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    status: 'scheduled'
  });
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    district: '',
    sector: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    doctor_id: '',
    patient_id: ''
  });
  
  // Dropdown data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientInfo, setSelectedPatientInfo] = useState(null); // Store full patient info for display
  const [patientIdSearch, setPatientIdSearch] = useState(''); // For searching by patient_id
  
  // Patient view modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If user is a doctor, only fetch their appointments
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (doctorId) {
          response = await getAppointmentsByDoctor(doctorId);
        } else {
          setError('Doctor profile not found. Please contact administrator.');
          setAppointments([]);
          setLoading(false);
          return;
        }
      } else {
        // Admin can see all appointments or filtered appointments
        response = await getAppointments(filters);
      }
      
      const appointmentsData = response.data || [];
      
      // If patient_id is not populated as an object, enrich with patient data from patients list
      const enrichedAppointments = appointmentsData.map((appointment) => {
        // If patient_id is just an ID string, try to find patient in the patients list
        if (appointment.patient_id && typeof appointment.patient_id === 'string' && patients.length > 0) {
          const patient = patients.find(p => p._id === appointment.patient_id);
          if (patient) {
            return {
              ...appointment,
              patient_id: patient
            };
          }
        }
        return appointment;
      });
      
      setAppointments(enrichedAppointments);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [filters, patients]);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await getPatients();
      setPatients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      console.error('Error details:', err.data);
      // Don't show error to user in dropdown, just log it
      // The error will be visible in the console for debugging
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await getDoctors();
      let doctorsData = response.data || [];
      
      // If user is a doctor, only show themselves in the dropdown
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (doctorId) {
          doctorsData = doctorsData.filter(d => d._id === doctorId);
        } else {
          doctorsData = [];
        }
      }
      
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  // Fetch dropdown data on component mount first
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
  }, [fetchPatients, fetchDoctors, fetchDepartments]);

  // Fetch appointments after component mount and when filters/patients change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Search patients by phone or name
  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setPatientSearchResults([]);
      setShowPatientResults(false);
      setFormData(prev => ({ ...prev, patient_id: '' }));
      return;
    }

    setSearchingPatients(true);
    try {
      const response = await searchPatients(query.trim());
      const results = response.data || [];
      setPatientSearchResults(results);
      setShowPatientResults(true);
    } catch (err) {
      console.error('Failed to search patients:', err);
      setPatientSearchResults([]);
      setShowPatientResults(false);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setFormData(prev => ({ ...prev, patient_id: patient._id }));
    setPatientSearchQuery(`${patient.first_name} ${patient.last_name} (${patient.phone})`);
    setShowPatientResults(false);
    setPatientSearchResults([]);
    setSelectedPatientInfo(patient); // Store full patient info for display
    setPatientIdSearch(patient.patient_id || ''); // Set the patient_id for reference
  };

  // Search patient by patient_id (e.g., PAT-000001)
  const handlePatientIdSearch = async (searchId) => {
    setPatientIdSearch(searchId);
    
    if (!searchId || searchId.trim().length < 3) {
      setSelectedPatientInfo(null);
      setFormData(prev => ({ ...prev, patient_id: '' }));
      return;
    }

    setSearchingPatients(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Searching for patient with ID:', searchId.trim());
      const response = await getPatientByPatientId(searchId.trim());
      console.log('Patient search response:', response);
      
      if (response.success && response.data) {
        setSelectedPatientInfo(response.data);
        setFormData(prev => ({ ...prev, patient_id: response.data._id }));
        setPatientSearchQuery(`${response.data.first_name} ${response.data.last_name}`);
        setSuccess(`✓ Found patient: ${response.data.first_name} ${response.data.last_name}`);
        setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
      }
    } catch (err) {
      console.error('Failed to find patient by patient_id:', err);
      console.error('Error details:', err.message, err.status);
      setSelectedPatientInfo(null);
      setFormData(prev => ({ ...prev, patient_id: '' }));
      // Show error message
      if (searchId.trim().length >= 5) {
        setError(`❌ Patient with ID "${searchId}" not found. Please verify the ID is correct (e.g., PAT-000001).`);
      }
    } finally {
      setSearchingPatients(false);
    }
  };

  // Check if selected time is already booked
  const checkTimeAvailability = async (doctorId, date, time) => {
    if (!doctorId || !date || !time) {
      setTimeAvailability({});
      return;
    }

    setTimeCheckLoading(true);
    try {
      const existingAppointmentsResponse = await getAppointments({
        doctor_id: doctorId,
        date: date,
        status: 'scheduled'
      });
      
      const existingAppointments = existingAppointmentsResponse.data || [];
      // Exclude the current appointment being edited
      const filteredAppointments = editingAppointment 
        ? existingAppointments.filter(apt => apt._id !== editingAppointment._id)
        : existingAppointments;
      
      const isBooked = filteredAppointments.some(apt => apt.appointment_time === time);
      
      setTimeAvailability({
        [time]: !isBooked // true if available, false if booked
      });
      
      if (isBooked) {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setError(`⚠️ This time slot (${time}) has already been booked by another patient on ${formattedDate}. Please select a different time.`);
      } else {
        // Clear error if time is available
        setError(null);
      }
    } catch (err) {
      console.error('Error checking time availability:', err);
    } finally {
      setTimeCheckLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Round time to 10-minute interval if it's the appointment_time field
    if (name === 'appointment_time' && value) {
      const roundedTime = roundTo15Minutes(value);
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: roundedTime
        };
        
        // Check availability when time is selected
        if (newFormData.doctor_id && newFormData.appointment_date) {
          checkTimeAvailability(newFormData.doctor_id, newFormData.appointment_date, roundedTime);
        }
        
        return newFormData;
      });
      return;
    }
    
    // Check time availability when doctor or date changes
    if ((name === 'doctor_id' || name === 'appointment_date') && formData.appointment_time) {
      const doctorId = name === 'doctor_id' ? value : formData.doctor_id;
      const date = name === 'appointment_date' ? value : formData.appointment_date;
      
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: value
        };
        
        if (doctorId && date && newFormData.appointment_time) {
          checkTimeAvailability(doctorId, date, newFormData.appointment_time);
        }
        
        return newFormData;
      });
      return;
    }
    
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

  const handleOpenModal = async (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setPatientType('existing'); // Always existing when editing
      const appointmentDate = appointment.appointment_date 
        ? new Date(appointment.appointment_date).toISOString().split('T')[0]
        : '';
      // Round appointment time to 10-minute interval if it exists
      const appointmentTime = appointment.appointment_time 
        ? roundTo15Minutes(appointment.appointment_time) 
        : '';
      
      // Set patient info for display if available
      if (appointment.patient_id && typeof appointment.patient_id === 'object') {
        setSelectedPatientInfo(appointment.patient_id);
        setPatientIdSearch(appointment.patient_id.patient_id || '');
        setPatientSearchQuery(`${appointment.patient_id.first_name} ${appointment.patient_id.last_name}`);
      }
      
      setFormData({
        patient_id: appointment.patient_id._id || appointment.patient_id || '',
        doctor_id: appointment.doctor_id._id || appointment.doctor_id || '',
        department_id: appointment.department_id._id || appointment.department_id || '',
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: appointment.reason || '',
        status: appointment.status || 'scheduled'
      });
      setNewPatientData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        district: '',
        sector: ''
      });
    } else {
      setEditingAppointment(null);
      setPatientType('existing'); // Default to existing
      // If user is a doctor, auto-fill their doctor_id
      let doctorId = '';
      if (isDoctor()) {
        doctorId = await getCurrentDoctorId() || '';
      }
      setFormData({
        patient_id: '',
        doctor_id: doctorId,
        department_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        status: 'scheduled'
      });
      setNewPatientData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        district: '',
        sector: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setPatientType('existing');
    setFormData({
      patient_id: '',
      doctor_id: '',
      department_id: '',
      appointment_date: '',
      appointment_time: '',
      reason: '',
      status: 'scheduled'
    });
    setNewPatientData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      address: ''
    });
    setSelectedPatientInfo(null);
    setPatientIdSearch('');
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setShowPatientResults(false);
    setError(null);
    setSuccess(null);
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.appointment_time && !timeRegex.test(formData.appointment_time)) {
      setError('Please provide valid time format (HH:MM)');
      return;
    }
    
    // Validate 10-minute interval
    if (formData.appointment_time && !isValid15MinuteInterval(formData.appointment_time)) {
      setError('Appointment time must be in 10-minute intervals (e.g., 08:00, 08:10, 08:20, 08:30)');
      return;
    }
    
    try {
      let patientId = formData.patient_id;
      
      // If creating new patient, create patient first
      if (!editingAppointment && patientType === 'new') {
        // Validate new patient data
        if (!newPatientData.first_name || !newPatientData.last_name || !newPatientData.phone) {
          setError('Please fill in all required patient fields (First Name, Last Name, Phone)');
          return;
        }
        
        const patientResponse = await createPatient(newPatientData);
        patientId = patientResponse.data._id;
        // Refresh patients list
        await fetchPatients();
      }
      
      const submitData = { ...formData, patient_id: patientId };
      // Convert date to ISO string
      if (submitData.appointment_date) {
        submitData.appointment_date = new Date(submitData.appointment_date).toISOString();
      }
      
      if (editingAppointment) {
        await updateAppointment(editingAppointment._id, submitData);
        setSuccess('Appointment updated successfully!');
      } else {
        const appointmentResponse = await createAppointment(submitData);
        const createdAppointment = appointmentResponse.data || appointmentResponse;
        
        // Notify the doctor about the new appointment
        try {
          await notifyDoctorAboutAppointment(submitData.doctor_id, createdAppointment, submitData);
        } catch (notifyErr) {
          // Don't fail the creation if notification fails, just log it
          console.warn('Failed to send notification to doctor:', notifyErr);
        }
        
        setSuccess(patientType === 'new' 
          ? 'Patient and appointment created successfully!' 
          : 'Appointment created successfully!');
      }
      
      handleCloseModal();
      fetchAppointments();
    } catch (err) {
      // Pass the full error object to show detailed validation errors
      setError(err);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteAppointment(appointmentId);
      setSuccess('Appointment deleted successfully!');
      fetchAppointments();
    } catch (err) {
      // Pass the full error object to show detailed validation errors
      setError(err);
    }
  };

  const handleViewPatient = async (patient) => {
    // Show modal immediately with what we have, then fetch full details to avoid N/A fields
    setViewingPatient(patient);
    setShowPatientModal(true);

    const patientMongoId =
      typeof patient === 'object' && patient
        ? (patient._id || patient.id)
        : patient;

    if (!patientMongoId) return;

    try {
      const response = await getPatient(patientMongoId);
      const fullPatient = response.data || response;
      setViewingPatient(fullPatient);
    } catch (err) {
      console.error('Failed to fetch full patient details:', err);
      // Keep the partial patient object if the fetch fails
    }
  };

  const handleClosePatientModal = () => {
    setShowPatientModal(false);
    setViewingPatient(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${dateStr} at ${timeString || 'N/A'}`;
  };

  // Helper function to notify doctor about new appointment
  const notifyDoctorAboutAppointment = async (doctorId, appointment, submitData) => {
    try {
      // Get doctor details to find their user_id
      const doctorResponse = await getDoctor(doctorId);
      const doctor = doctorResponse.data || doctorResponse;
      
      // Extract user_id from doctor object (could be object or string)
      let doctorUserId = null;
      if (doctor.user_id) {
        doctorUserId = typeof doctor.user_id === 'object' 
          ? (doctor.user_id._id || doctor.user_id.id) 
          : doctor.user_id;
      }
      
      if (!doctorUserId) {
        console.warn('Doctor does not have a user_id, cannot send notification');
        return;
      }
      
      // Get patient name for notification message
      let patientName = 'A patient';
      if (submitData.patient_id) {
        const patient = patients.find(p => p._id === submitData.patient_id);
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
        }
      } else if (newPatientData.first_name) {
        patientName = `${newPatientData.first_name} ${newPatientData.last_name}`;
      }
      
      // Format appointment date and time
      const appointmentDate = submitData.appointment_date 
        ? new Date(submitData.appointment_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'TBD';
      const appointmentTime = submitData.appointment_time || 'TBD';
      
      // Create notification message
      const notificationMessage = `New appointment booked! ${patientName} has scheduled an appointment with you on ${appointmentDate} at ${appointmentTime}.${submitData.reason ? ` Reason: ${submitData.reason}` : ''}`;
      
      // Create notification for the doctor
      await createNotification({
        user_id: doctorUserId,
        message: notificationMessage,
        notification_type: 'appointment',
        is_read: false
      });
      
      console.log('✅ Notification sent to doctor:', doctorUserId);
    } catch (error) {
      console.error('Error notifying doctor:', error);
      throw error;
    }
  };

  const getPatientName = (patient) => {
    if (!patient) return 'N/A';
    if (typeof patient === 'object' && patient.first_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    return 'N/A';
  };

  const getDoctorName = (doctor) => {
    if (!doctor) return 'N/A';
    if (typeof doctor === 'object' && doctor.first_name) {
      return `Dr. ${doctor.first_name} ${doctor.last_name}`;
    }
    return 'N/A';
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

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <h1>Appointment Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {appointments.length > 0 && (
            <ReportButton
              data={appointments}
              entityType="appointments"
              title="Appointments Report"
              filters={filters}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-status">Status:</label>
          <select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {appointmentStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-date">Date:</label>
          <input
            type="date"
            id="filter-date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-doctor">Doctor:</label>
          <select
            id="filter-doctor"
            name="doctor_id"
            value={filters.doctor_id}
            onChange={handleFilterChange}
          >
            <option value="">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.first_name} {doctor.last_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-patient">Patient:</label>
          <select
            id="filter-patient"
            name="patient_id"
            value={filters.patient_id}
            onChange={handleFilterChange}
          >
            <option value="">All Patients</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setFilters({ status: '', date: '', doctor_id: '', patient_id: '' })}
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

      {/* Appointments Table */}
      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="no-data">No appointments found</div>
      ) : (
        <div className="table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment._id}>
                  <td className="patient-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e3a5f' }}>
                        {getPatientName(appointment.patient_id)}
                      </div>
                      {appointment.patient_id && typeof appointment.patient_id === 'object' && (
                        <button
                          onClick={() => handleViewPatient(appointment.patient_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            color: '#0066cc',
                            fontSize: '1.1rem',
                            transition: 'color 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title="View patient details"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#004499'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#0066cc'}
                        >
                          👁️
                        </button>
                      )}
                    </div>
                    {appointment.patient_id && typeof appointment.patient_id === 'object' && (
                      <>
                        {appointment.patient_id.email && (
                          <div className="patient-email">{appointment.patient_id.email}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="contact-cell">
                    {appointment.patient_id && typeof appointment.patient_id === 'object' && (
                      <>
                        {appointment.patient_id.phone && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Phone:</strong> {appointment.patient_id.phone}
                          </div>
                        )}
                        {appointment.patient_id.date_of_birth && (
                          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                            <strong>DOB:</strong> {formatDate(appointment.patient_id.date_of_birth)}
                          </div>
                        )}
                        {appointment.patient_id.gender && (
                          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                            <strong>Gender:</strong> {appointment.patient_id.gender}
                          </div>
                        )}
                      </>
                    )}
                    {(!appointment.patient_id || typeof appointment.patient_id !== 'object' || !appointment.patient_id.phone) && (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td className="address-cell">
                    {appointment.patient_id && typeof appointment.patient_id === 'object' && (
                      <>
                        {appointment.patient_id.address && typeof appointment.patient_id.address === 'object' ? (
                          <>
                            {appointment.patient_id.address.district && (
                              <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {appointment.patient_id.address.district}
                              </div>
                            )}
                            {appointment.patient_id.address.sector && (
                              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                                {appointment.patient_id.address.sector}
                              </div>
                            )}
                          </>
                        ) : (
                          // Fallback for old data structure (if any exists)
                          <>
                            {appointment.patient_id.address && (
                              <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {appointment.patient_id.address}
                              </div>
                            )}
                            {(appointment.patient_id.district || appointment.patient_id.sector) && (
                              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                                {appointment.patient_id.district && <span>{appointment.patient_id.district}</span>}
                                {appointment.patient_id.district && appointment.patient_id.sector && <span>, </span>}
                                {appointment.patient_id.sector && <span>{appointment.patient_id.sector}</span>}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {(!appointment.patient_id || typeof appointment.patient_id !== 'object' || 
                      (!appointment.patient_id.address || 
                       (typeof appointment.patient_id.address === 'object' && 
                        !appointment.patient_id.address.district && 
                        !appointment.patient_id.address.sector))) && (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td className="doctor-cell">
                    {getDoctorName(appointment.doctor_id)}
                    {appointment.doctor_id && typeof appointment.doctor_id === 'object' && appointment.doctor_id.specialization && (
                      <div className="doctor-specialization">{appointment.doctor_id.specialization}</div>
                    )}
                  </td>
                  <td>
                    {appointment.department_id?.department_name || 'N/A'}
                  </td>
                  <td>
                    <div className="datetime-cell">
                      <div>{formatDate(appointment.appointment_date)}</div>
                      <div className="time">{appointment.appointment_time}</div>
                    </div>
                  </td>
                  <td className="reason-cell">
                    {appointment.reason || <span className="text-muted">No reason provided</span>}
                  </td>
                  <td>
                    <span className={getStatusClass(appointment.status)}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>{formatDate(appointment.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(appointment)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(appointment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAppointment ? 'Edit Appointment' : 'Create New Appointment'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Patient Type Selection - Only show when creating new appointment */}
              {!editingAppointment && (
                <div className="form-group">
                  <label>Patient Type *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="patientType"
                        value="existing"
                        checked={patientType === 'existing'}
                        onChange={(e) => setPatientType(e.target.value)}
                      />
                      <span>Existing Patient</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="patientType"
                        value="new"
                        checked={patientType === 'new'}
                        onChange={(e) => setPatientType(e.target.value)}
                      />
                      <span>New Patient</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Patient Selection - Show for existing patients or when editing */}
              {patientType === 'existing' || editingAppointment ? (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="patient_id_search">
                    Search by Patient ID *
                    <span style={{ fontSize: '0.875rem', color: '#666', marginLeft: '0.5rem' }}>
                      (e.g., PAT-000001)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="patient_id_search"
                    name="patient_id_search"
                    value={patientIdSearch}
                    onChange={(e) => handlePatientIdSearch(e.target.value)}
                    placeholder="Enter patient ID (e.g., PAT-000001)..."
                    required={patientType === 'existing' || editingAppointment}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  {searchingPatients && patientIdSearch && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#666'
                    }}>
                      🔍 Searching for patient...
                    </div>
                  )}

                  {/* Display Patient Information if found */}
                  {selectedPatientInfo && (
                    <div style={{
                      backgroundColor: '#e7f3ff',
                      border: '2px solid #0066cc',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        color: '#0066cc',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        ✓ Patient Found
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: '#0066cc',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {selectedPatientInfo.patient_id}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        fontSize: '0.9rem'
                      }}>
                        <div>
                          <strong>Name:</strong> {selectedPatientInfo.first_name} {selectedPatientInfo.last_name}
                        </div>
                        <div>
                          <strong>Gender:</strong> {selectedPatientInfo.gender}
                        </div>
                        <div>
                          <strong>Phone:</strong> {selectedPatientInfo.phone}
                        </div>
                        <div>
                          <strong>Email:</strong> {selectedPatientInfo.email || 'N/A'}
                        </div>
                        {selectedPatientInfo.date_of_birth && (
                          <div>
                            <strong>Date of Birth:</strong> {formatDate(selectedPatientInfo.date_of_birth)}
                          </div>
                        )}
                        {selectedPatientInfo.address && typeof selectedPatientInfo.address === 'object' && (
                          <div>
                            <strong>Address:</strong> {selectedPatientInfo.address.district}, {selectedPatientInfo.address.sector}
                          </div>
                        )}
                        {selectedPatientInfo.origin && (
                          <div>
                            <strong>Origin:</strong> {selectedPatientInfo.origin}
                          </div>
                        )}
                        {selectedPatientInfo.insurance && typeof selectedPatientInfo.insurance === 'object' && (
                          <div>
                            <strong>Insurance:</strong> {selectedPatientInfo.insurance.insurance_name || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="patient_id"
                    value={formData.patient_id}
                    required={patientType === 'existing' || editingAppointment}
                  />
                  <small className="form-hint" style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                    Enter the patient ID exactly as shown on the patient card
                  </small>
                </div>
              ) : (
                /* New Patient Form Fields */
                <div className="new-patient-section">
                  <h3 className="section-title">Patient Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="first_name">First Name *</label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={newPatientData.first_name}
                        onChange={handleNewPatientChange}
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="last_name">Last Name *</label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={newPatientData.last_name}
                        onChange={handleNewPatientChange}
                        required
                        minLength={2}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={newPatientData.email}
                        onChange={handleNewPatientChange}
                        placeholder="patient@example.com (optional)"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={newPatientData.phone}
                        onChange={handleNewPatientChange}
                        required
                        placeholder="e.g., +250788123456"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date_of_birth">Date of Birth</label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={newPatientData.date_of_birth}
                        onChange={handleNewPatientChange}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={newPatientData.gender}
                        onChange={handleNewPatientChange}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address">Street Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={newPatientData.address}
                      onChange={handleNewPatientChange}
                      rows="2"
                      placeholder="Enter street address..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="district">District *</label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={newPatientData.district}
                        onChange={handleNewPatientChange}
                        required
                        placeholder="Enter district..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sector">Sector *</label>
                      <input
                        type="text"
                        id="sector"
                        name="sector"
                        value={newPatientData.sector}
                        onChange={handleNewPatientChange}
                        required
                        placeholder="Enter sector..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">

                <div className="form-group">
                  <label htmlFor="doctor_id">Doctor *</label>
                  {isDoctor() ? (
                    <input
                      type="text"
                      id="doctor_id"
                      value={doctors.find(d => d._id === formData.doctor_id) 
                        ? `Dr. ${doctors.find(d => d._id === formData.doctor_id).first_name} ${doctors.find(d => d._id === formData.doctor_id).last_name}`
                        : 'Loading...'}
                      disabled
                      className="disabled-input"
                      readOnly
                    />
                  ) : (
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.first_name} {doctor.last_name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="department_id">Department *</label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="appointment_date">Appointment Date *</label>
                  <input
                    type="date"
                    id="appointment_date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                    required
                    min={today}
                  />
                  <small className="form-hint">Cannot be in the past</small>
                </div>

                <div className="form-group">
                  <label htmlFor="appointment_time">Appointment Time *</label>
                  <select
                    id="appointment_time"
                    name="appointment_time"
                    value={formData.appointment_time || ''}
                    onChange={handleInputChange}
                    required
                    disabled={timeCheckLoading}
                    style={{ 
                      padding: '0.5rem',
                      fontSize: '1rem',
                      border: formData.appointment_time && timeAvailability[formData.appointment_time] === false 
                        ? '2px solid #dc3545' 
                        : '1px solid #ddd',
                      borderRadius: '4px',
                      width: '100%',
                      backgroundColor: timeCheckLoading ? '#f5f5f5' : 'white'
                    }}
                  >
                    <option value="">Select a time slot</option>
                    {(() => {
                      const timeSlots = generateTimeSlots('08:00', '18:00');
                      // Ensure selected value is included in options if it's not already
                      const selectedTime = formData.appointment_time;
                      const allSlots = selectedTime && !timeSlots.includes(selectedTime) && isValid15MinuteInterval(selectedTime)
                        ? [...timeSlots, selectedTime].sort()
                        : timeSlots;
                      return allSlots.map(time => {
                        const isAvailable = timeAvailability[time];
                        const isBooked = isAvailable === false;
                        return (
                          <option 
                            key={time} 
                            value={time}
                            disabled={isBooked}
                            style={{ 
                              color: isBooked ? '#dc3545' : 'inherit',
                              backgroundColor: isBooked ? '#fff3cd' : 'white'
                            }}
                          >
                            {time} {isBooked ? '(Already Booked)' : ''}
                          </option>
                        );
                      });
                    })()}
                  </select>
                  {timeCheckLoading && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      ⏳ Checking availability...
                    </div>
                  )}
                  {formData.appointment_time && !timeCheckLoading && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: timeAvailability[formData.appointment_time] === false 
                        ? '#fff3cd' 
                        : '#e7f3ff', 
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: timeAvailability[formData.appointment_time] === false 
                        ? '#856404' 
                        : '#0066cc',
                      border: timeAvailability[formData.appointment_time] === false 
                        ? '1px solid #ffc107' 
                        : 'none'
                    }}>
                      {timeAvailability[formData.appointment_time] === false ? (
                        <>⚠️ <strong>{formData.appointment_time}</strong> is already booked. Please select another time.</>
                      ) : (
                        <>✓ Selected: <strong>{formData.appointment_time}</strong> (Available)</>
                      )}
                    </div>
                  )}
                  <small className="form-hint">Select a time slot (10-minute intervals)</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter appointment reason..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
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

              {error && <ErrorDisplay error={error} />}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAppointment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient View Modal */}
      {showPatientModal && viewingPatient && (
        <div className="modal-overlay" onClick={handleClosePatientModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>👤 Patient Information</h2>
              <button className="modal-close" onClick={handleClosePatientModal}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {/* Patient ID Badge */}
              {viewingPatient.patient_id && (
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    Patient ID
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0066cc',
                    fontFamily: 'monospace'
                  }}>
                    {viewingPatient.patient_id}
                  </div>
                </div>
              )}

              {/* Patient Details Grid */}
              <div style={{ 
                display: 'grid', 
                gap: '1.25rem'
              }}>
                {/* Full Name */}
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    Full Name
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a5f' }}>
                    {viewingPatient.first_name} {viewingPatient.last_name}
                  </div>
                </div>

                {/* Personal Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Gender
                    </div>
                    <div style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
                      {viewingPatient.gender || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Date of Birth
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {viewingPatient.date_of_birth ? formatDate(viewingPatient.date_of_birth) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    Phone Number
                  </div>
                  <div style={{ fontSize: '1rem', fontFamily: 'monospace' }}>
                    {viewingPatient.phone || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '1rem' }}>
                    {viewingPatient.email || 'N/A'}
                  </div>
                </div>

                {/* Address - District and Sector */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      District
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {viewingPatient.address && typeof viewingPatient.address === 'object' && viewingPatient.address.district 
                        ? viewingPatient.address.district 
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Sector
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {viewingPatient.address && typeof viewingPatient.address === 'object' && viewingPatient.address.sector 
                        ? viewingPatient.address.sector 
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Origin and Insurance */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Origin
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {viewingPatient.origin || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Insurance
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {viewingPatient.insurance && typeof viewingPatient.insurance === 'object' 
                        ? (viewingPatient.insurance.insurance_name || 'N/A')
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                {viewingPatient.createdAt && (
                  <div style={{ 
                    paddingTop: '1rem',
                    borderTop: '1px solid #e9ecef',
                    fontSize: '0.875rem',
                    color: '#666'
                  }}>
                    <strong>Registered on:</strong> {formatDate(viewingPatient.createdAt)}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleClosePatientModal}
                  style={{ minWidth: '120px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;

