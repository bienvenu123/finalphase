import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getDoctors } from '../services/doctorService';
import { getAppointmentsByDoctor, createAppointment } from '../services/appointmentService';
import { getPatients, createPatient, searchPatients } from '../services/patientService';
import { getNotificationsByUser } from '../services/notificationService';
import { generateTimeSlots, isValid15MinuteInterval, roundTo15Minutes } from '../utils/timeUtils';
import HospitalLogo from '../components/HospitalLogo';
import ErrorDisplay from '../components/ErrorDisplay';
import './DoctorDashboardPage.css';

const DoctorDashboardPage = () => {
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timeAvailability, setTimeAvailability] = useState({}); // Track which times are available
  const [timeCheckLoading, setTimeCheckLoading] = useState(false);
  
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  
  // Appointment scheduling modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [patientType, setPatientType] = useState('existing');
  const [appointmentFormData, setAppointmentFormData] = useState({
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
  
  // Dropdown data
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchDoctorDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctorDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError('Please login to access doctor dashboard');
        setLoading(false);
        return;
      }

      // Find doctor record by multiple methods
      const doctorsRes = await getDoctors();
      const doctors = doctorsRes.data || [];
      
      console.log('Current User:', currentUser);
      console.log('Available Doctors:', doctors.map(d => ({ 
        id: d._id, 
        name: `${d.first_name} ${d.last_name}`, 
        email: d.email,
        user_id: d.user_id 
      })));
      
      // Try to find doctor by:
      // 1. user_id field matching current user's _id
      // 2. email matching (case-insensitive)
      // 3. _id matching current user's _id (in case user is a doctor)
      let doctor = doctors.find(d => {
        // Check user_id field
        if (d.user_id) {
          const userId = typeof d.user_id === 'object' ? d.user_id._id : d.user_id;
          if (userId === currentUser._id || userId === currentUser.id) {
            return true;
          }
        }
        // Check email (case-insensitive)
        if (d.email && currentUser.email) {
          if (d.email.toLowerCase() === currentUser.email.toLowerCase()) {
            return true;
          }
        }
        // Check if doctor _id matches user _id
        if (d._id === currentUser._id || d._id === currentUser.id) {
          return true;
        }
        return false;
      });
      
      // If still not found, try to find by name match (first_name + last_name)
      if (!doctor && currentUser.name) {
        const nameParts = currentUser.name.split(' ');
        if (nameParts.length >= 2) {
          doctor = doctors.find(d => {
            const firstNameMatch = d.first_name && 
              d.first_name.toLowerCase() === nameParts[0].toLowerCase();
            const lastNameMatch = d.last_name && 
              d.last_name.toLowerCase() === nameParts.slice(1).join(' ').toLowerCase();
            return firstNameMatch && lastNameMatch;
          });
        }
      }
      
      if (!doctor) {
        const errorDetails = [
          `Doctor profile not found for user: ${currentUser.email || currentUser.name || 'Unknown'}`,
          '',
          'Please ensure one of the following:',
          `1. A doctor record exists with email: ${currentUser.email || 'N/A'}`,
          `2. Your user account (_id: ${currentUser._id || currentUser.id || 'N/A'}) is linked to a doctor profile`,
          '3. Contact administrator to create or link your doctor profile',
          '',
          `Available doctors in system: ${doctors.length}`,
          doctors.length > 0 ? doctors.map(d => `- Dr. ${d.first_name} ${d.last_name} (${d.email || 'No email'})`).join('\n') : 'No doctors found in system'
        ].join('\n');
        
        console.error('Doctor not found:', errorDetails);
        setError(errorDetails);
        setLoading(false);
        return;
      }
      
      console.log('Found Doctor:', doctor);

      setCurrentDoctor(doctor);
      const doctorId = doctor._id;

      // Fetch appointments for this doctor
      const appointmentsRes = await getAppointmentsByDoctor(doctorId).catch(() => ({ data: [] }));

      const appointments = appointmentsRes.data || [];

      // Get appointment requests (pending or scheduled appointments that need attention)
      const requests = appointments.filter(apt => {
        return apt.status === 'pending' || apt.status === 'scheduled';
      }).sort((a, b) => {
        // Sort by date, most recent first
        const dateA = new Date(a.appointment_date || a.createdAt || a.created_at);
        const dateB = new Date(b.appointment_date || b.createdAt || b.created_at);
        return dateB - dateA;
      }).slice(0, 10);

      setAppointmentRequests(requests);

      // Fetch notifications for this doctor
      await fetchDoctorNotifications(doctor);

      // Fetch patients and departments for appointment scheduling
      await fetchPatientsAndDepartments(doctor);

    } catch (err) {
      setError(err.message || 'Failed to load doctor dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorNotifications = async (doctor) => {
    try {
      // Get doctor's user_id
      let doctorUserId = null;
      if (doctor.user_id) {
        doctorUserId = typeof doctor.user_id === 'object' 
          ? (doctor.user_id._id || doctor.user_id.id) 
          : doctor.user_id;
      }
      
      if (!doctorUserId) {
        console.warn('Doctor does not have a user_id, cannot fetch notifications');
        setRecentNotifications([]);
        setUnreadNotificationCount(0);
        return;
      }
      
      // Fetch notifications for this doctor
      const notificationsRes = await getNotificationsByUser(doctorUserId).catch(() => ({ data: [] }));
      const notifications = notificationsRes.data || [];
      
      // Count unread notifications
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setUnreadNotificationCount(unreadCount);
      
      // Get recent notifications (last 5)
      const recent = notifications
        .sort((a, b) => new Date(b.sent_at || b.createdAt || b.created_at) - new Date(a.sent_at || a.createdAt || a.created_at))
        .slice(0, 5);
      setRecentNotifications(recent);
    } catch (err) {
      console.error('Failed to fetch doctor notifications:', err);
      setRecentNotifications([]);
      setUnreadNotificationCount(0);
    }
  };

  const fetchPatientsAndDepartments = async (doctor) => {
    try {
      const patientsRes = await getPatients().catch(() => ({ data: [] }));
      setPatients(patientsRes.data || []);
      
      // Pre-fill doctor and department in appointment form
      if (doctor) {
        const departmentId = typeof doctor.department_id === 'object' 
          ? doctor.department_id._id 
          : doctor.department_id;
        setAppointmentFormData(prev => ({
          ...prev,
          doctor_id: doctor._id,
          department_id: departmentId || prev.department_id
        }));
      }
    } catch (err) {
      console.error('Failed to fetch patients/departments:', err);
    }
  };

  const handleOpenScheduleModal = () => {
    if (currentDoctor) {
      const departmentId = typeof currentDoctor.department_id === 'object' 
        ? currentDoctor.department_id._id 
        : currentDoctor.department_id;
      setAppointmentFormData({
        patient_id: '',
        doctor_id: currentDoctor._id,
        department_id: departmentId || '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        status: 'scheduled'
      });
    }
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
    setPatientType('existing');
    setShowScheduleModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setError(null);
    setSuccess(null);
    setTimeAvailability({});
    setTimeCheckLoading(false);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setShowPatientResults(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientResults && !event.target.closest('.form-group')) {
        setShowPatientResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPatientResults]);

  // Search patients by phone or name
  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setPatientSearchResults([]);
      setShowPatientResults(false);
      setAppointmentFormData(prev => ({ ...prev, patient_id: '' }));
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
    setAppointmentFormData(prev => ({ ...prev, patient_id: patient._id }));
    setPatientSearchQuery(`${patient.first_name} ${patient.last_name} (${patient.phone})`);
    setShowPatientResults(false);
    setPatientSearchResults([]);
  };

  // Check if selected time is already booked
  const checkTimeAvailability = async (doctorId, date, time) => {
    if (!doctorId || !date || !time) {
      setTimeAvailability({});
      return;
    }

    setTimeCheckLoading(true);
    try {
      const existingAppointmentsResponse = await getAppointmentsByDoctor(doctorId);
      const existingAppointments = existingAppointmentsResponse.data || [];
      
      // Filter by date and status
      const filteredAppointments = existingAppointments.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate === date && apt.status === 'scheduled';
      });
      
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

  const handleAppointmentInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Round time to 10-minute interval if it's the appointment_time field
    if (name === 'appointment_time' && value) {
      const roundedTime = roundTo15Minutes(value);
      setAppointmentFormData(prev => {
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
    if ((name === 'doctor_id' || name === 'appointment_date') && appointmentFormData.appointment_time) {
      const doctorId = name === 'doctor_id' ? value : appointmentFormData.doctor_id;
      const date = name === 'appointment_date' ? value : appointmentFormData.appointment_date;
      
      setAppointmentFormData(prev => {
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
    
    setAppointmentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!appointmentFormData.patient_id && patientType === 'existing') {
      setError('Please select a patient');
      return;
    }

    if (!appointmentFormData.appointment_date) {
      setError('Please select an appointment date');
      return;
    }

    if (!appointmentFormData.appointment_time) {
      setError('Please select an appointment time');
      return;
    }
    
    // Validate 10-minute interval
    if (!isValid15MinuteInterval(appointmentFormData.appointment_time)) {
      setError('Appointment time must be in 10-minute intervals (e.g., 08:00, 08:10, 08:20, 08:30)');
      return;
    }

    try {
      let patientId = appointmentFormData.patient_id;

      // If creating new patient
      if (patientType === 'new') {
        if (!newPatientData.first_name || !newPatientData.last_name || !newPatientData.phone) {
          setError('Please fill in all required patient fields (First Name, Last Name, Phone)');
          return;
        }
        const patientResponse = await createPatient(newPatientData);
        patientId = patientResponse.data._id;
        await fetchPatientsAndDepartments(currentDoctor);
      }

      const submitData = {
        ...appointmentFormData,
        patient_id: patientId,
        appointment_date: new Date(appointmentFormData.appointment_date).toISOString()
      };

      if (submitData.reason && submitData.reason.trim()) {
        submitData.reason = submitData.reason.trim();
      }

      await createAppointment(submitData);
      setSuccess(patientType === 'new' 
        ? 'Patient and appointment scheduled successfully!' 
        : 'Appointment scheduled successfully!');
      
      // Refresh dashboard data
      setTimeout(() => {
        handleCloseScheduleModal();
        fetchDoctorDashboardData();
      }, 1500);
    } catch (err) {
      setError(err.message || 
        (err.data && err.data.message) ||
        (err.data && err.data.errors && Array.isArray(err.data.errors) 
          ? err.data.errors.join(', ') 
          : null) ||
        'Failed to schedule appointment');
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const time = timeString || '';
    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })} ${time}`;
  };


  const getStatusBadgeClass = (status) => {
    const statusMap = {
      scheduled: 'status-scheduled',
      confirmed: 'status-confirmed',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      pending: 'status-pending'
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  };

  const getPatientName = (patient) => {
    if (!patient) return 'N/A';
    if (typeof patient === 'object' && patient.first_name) {
      return `${patient.first_name} ${patient.last_name || ''}`.trim();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="doctor-dashboard-page">
        <div className="loading">Loading doctor dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-dashboard-page">
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="error-title">Doctor Profile Not Found</h2>
            <div className="error-message">
              {error.split('\n').map((line, index) => (
                <p key={index} style={{ margin: line.trim() ? '0.5rem 0' : '0.25rem 0' }}>
                  {line.trim() || '\u00A0'}
                </p>
              ))}
            </div>
            <div className="error-actions">
              <Link to="/doctors" className="btn btn-primary">
                View All Doctors
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                Go to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-page">
      {/* Hospital Header */}
      <div className="hospital-header">
        <div className="hospital-info">
          <h1 className="hospital-name">KIGALI ORTHOPAEDIC SPECIALIZED HOSPITAL</h1>
          <p className="hospital-subtitle">Doctor Dashboard • Dr. {currentDoctor?.first_name} {currentDoctor?.last_name}</p>
        </div>
        <div className="hospital-logo">
          <HospitalLogo size="xlarge" shape="circle" />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Quick Action Button */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-schedule" onClick={handleOpenScheduleModal}>
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM17 10H7V12H17V10ZM15 14H7V16H15V14Z" fill="currentColor"/>
          </svg>
          <span>Schedule Appointment</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/scheduled-appointments" className="quick-action-card">
            <div className="quick-action-icon">📅</div>
            <div className="quick-action-text">Scheduled Appointments</div>
          </Link>
          <Link to="/doctor-schedules" className="quick-action-card">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-text">Doctor Schedules</div>
          </Link>
          <Link to="/doctors-chat" className="quick-action-card">
            <div className="quick-action-icon">💬</div>
            <div className="quick-action-text">Doctors Chat</div>
          </Link>
          <Link to="/notifications" className="quick-action-card" style={{ position: 'relative' }}>
            <div className="quick-action-icon">🔔</div>
            <div className="quick-action-text">Notifications</div>
            {unreadNotificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </Link>
          <Link to="/appointments" className="quick-action-card">
            <div className="quick-action-icon">🏥</div>
            <div className="quick-action-text">Appointments</div>
          </Link>
        </div>
      </div>

      {/* Recent Notifications Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>
            🔔 Notifications
            {unreadNotificationCount > 0 && (
              <span className="notification-badge" style={{
                marginLeft: '0.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                {unreadNotificationCount}
              </span>
            )}
          </h2>
          <Link to="/notifications" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {recentNotifications.length === 0 ? (
          <div className="no-data-card">
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                style={{
                  padding: '1rem',
                  border: `2px solid ${!notification.is_read ? '#dc3545' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  backgroundColor: !notification.is_read ? '#fff5f5' : '#fff',
                  position: 'relative'
                }}
              >
                {!notification.is_read && (
                  <span style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50%'
                  }}></span>
                )}
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    {notification.notification_type || 'info'}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', color: '#333' }}>
                  {notification.message}
                </p>
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                  {formatDateTime(notification.sent_at || notification.createdAt || notification.created_at, '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Requests */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Appointment Requests</h2>
        </div>
        
        {appointmentRequests.length === 0 ? (
          <div className="no-data-card">
            <svg className="no-data-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM17 10H7V12H17V10ZM15 14H7V16H15V14Z" fill="currentColor"/>
            </svg>
            <p>No appointment requests at this time</p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointmentRequests.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-info">
                  <div className="appointment-main">
                    <h3>{getPatientName(appointment.patient_id)}</h3>
                    <p className="appointment-date">
                      {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                    </p>
                  </div>
                  <div className="appointment-details">
                    {appointment.reason && (
                      <div className="detail-item">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">{appointment.reason}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <Link to="/appointments" className="appointment-link">
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={handleCloseScheduleModal}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule New Appointment</h2>
              <button className="modal-close" onClick={handleCloseScheduleModal}>×</button>
            </div>
            
            {error && (
              <div style={{ marginBottom: '1.5rem' }}>
                <ErrorDisplay error={error} />
              </div>
            )}

            <form onSubmit={handleScheduleAppointment}>
              {/* Patient Type Selection */}
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

              {/* Patient Selection */}
              {patientType === 'existing' ? (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="patient_search">Search Patient by Phone or Name *</label>
                  <input
                    type="text"
                    id="patient_search"
                    name="patient_search"
                    value={patientSearchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    onFocus={() => {
                      if (patientSearchResults.length > 0) {
                        setShowPatientResults(true);
                      }
                    }}
                    placeholder="Enter phone number or patient name..."
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  {searchingPatients && (
                    <div style={{ 
                      position: 'absolute', 
                      right: '10px', 
                      top: '38px',
                      fontSize: '0.875rem',
                      color: '#666'
                    }}>
                      Searching...
                    </div>
                  )}
                  {showPatientResults && patientSearchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      marginTop: '2px'
                    }}>
                      {patientSearchResults.map(patient => (
                        <div
                          key={patient._id}
                          onClick={() => handleSelectPatient(patient)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: '500' }}>
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                            {patient.phone}
                            {patient.email && ` • ${patient.email}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showPatientResults && patientSearchQuery.length >= 2 && patientSearchResults.length === 0 && !searchingPatients && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '0.75rem',
                      zIndex: 1000,
                      marginTop: '2px',
                      color: '#666'
                    }}>
                      No patients found. Please check your search or create a new patient.
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="patient_id"
                    value={appointmentFormData.patient_id}
                    required
                  />
                  <small className="form-hint" style={{ display: 'block', marginTop: '0.5rem' }}>
                    Search by phone number or patient name (minimum 2 characters)
                  </small>
                </div>
              ) : (
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

              <div className="form-group">
                <label htmlFor="appointment_date">Appointment Date *</label>
                <input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  value={appointmentFormData.appointment_date}
                  onChange={handleAppointmentInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointment_time">Appointment Time *</label>
                <select
                  id="appointment_time"
                  name="appointment_time"
                  value={appointmentFormData.appointment_time || ''}
                  onChange={handleAppointmentInputChange}
                  required
                  disabled={timeCheckLoading}
                  style={{ 
                    padding: '0.5rem',
                    fontSize: '1rem',
                    border: appointmentFormData.appointment_time && timeAvailability[appointmentFormData.appointment_time] === false 
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
                    const selectedTime = appointmentFormData.appointment_time;
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
                {appointmentFormData.appointment_time && !timeCheckLoading && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    backgroundColor: timeAvailability[appointmentFormData.appointment_time] === false 
                      ? '#fff3cd' 
                      : '#e7f3ff', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: timeAvailability[appointmentFormData.appointment_time] === false 
                      ? '#856404' 
                      : '#0066cc',
                    border: timeAvailability[appointmentFormData.appointment_time] === false 
                      ? '1px solid #ffc107' 
                      : 'none'
                  }}>
                    {timeAvailability[appointmentFormData.appointment_time] === false ? (
                      <>⚠️ <strong>{appointmentFormData.appointment_time}</strong> is already booked. Please select another time.</>
                    ) : (
                      <>✓ Selected: <strong>{appointmentFormData.appointment_time}</strong> (Available)</>
                    )}
                  </div>
                )}
                <small className="form-hint">Select a time slot (10-minute intervals)</small>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={appointmentFormData.reason}
                  onChange={handleAppointmentInputChange}
                  rows="3"
                  placeholder="Enter appointment reason..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseScheduleModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardPage;

