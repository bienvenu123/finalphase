import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getDoctorSchedules
} from '../services/doctorScheduleService';
import {
  createAppointment,
  getAppointments
} from '../services/appointmentService';
import { getPatients, createPatient, searchPatients, getPatientByPatientId } from '../services/patientService';
import { getDoctors, getDoctor } from '../services/doctorService';
import { getDepartments } from '../services/departmentService';
import { getInsurances } from '../services/insuranceService';
import { createNotification } from '../services/notificationService';
import { isAuthenticated } from '../services/authService';
import { generateTimeSlots, isValid15MinuteInterval, roundTo15Minutes } from '../utils/timeUtils';
import ErrorDisplay from '../components/ErrorDisplay';
import HospitalLogo from '../components/HospitalLogo';
import './ScheduledAppointmentsPage.css';

const ScheduledAppointmentsPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scheduleBookings, setScheduleBookings] = useState({}); // Track bookings per schedule
  const [timeAvailability, setTimeAvailability] = useState({}); // Track which times are available
  const [timeCheckLoading, setTimeCheckLoading] = useState(false);
  
  // Form state for booking
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [patientType, setPatientType] = useState('existing'); // 'existing' or 'new'
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    department_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    status: 'scheduled',
    schedule_start_time: '',
    schedule_end_time: ''
  });
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: {
      district: '',
      sector: ''
    },
    origin: 'Rwandan',
    insurance: '',
    patient_id: ''
  });
  
  // Dropdown data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [insurances, setInsurances] = useState([]);
  
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientInfo, setSelectedPatientInfo] = useState(null); // Store full patient info for display
  const [patientIdSearch, setPatientIdSearch] = useState(''); // For searching by patient_id

  // Helper function to convert day of week to next occurrence date
  const getNextDateForDay = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = days.indexOf(dayOfWeek);
    if (dayIndex === -1) return null;
    
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilTarget = dayIndex - currentDay;
    
    // If the day has passed this week, get next week's occurrence
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    // If today is the target day, we'll use next week to give user time
    if (daysUntilTarget === 0) {
      daysUntilTarget = 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    // Format as YYYY-MM-DD for date input
    return targetDate.toISOString().split('T')[0];
  };

  const fetchSchedules = useCallback(async () => {
    // Helper function to get appointments count for a schedule (moved inside to avoid dependency issues)
    const getAppointmentsCountForSchedule = async (schedule) => {
      try {
        const doctorId = typeof schedule.doctor_id === 'object' 
          ? schedule.doctor_id._id 
          : schedule.doctor_id;
        
        if (!doctorId) return { scheduleId: schedule._id, count: 0 };
        
        // Get next occurrence date for this schedule's day
        const appointmentDate = getNextDateForDay(schedule.day_of_week);
        if (!appointmentDate) return { scheduleId: schedule._id, count: 0 };
        
        // Format date for API (YYYY-MM-DD)
        const dateForAPI = appointmentDate;
        
        // Fetch appointments for this doctor and date
        const response = await getAppointments({
          doctor_id: doctorId,
          date: dateForAPI,
          status: 'scheduled' // Only count scheduled appointments
        });
        
        const appointments = response.data || [];
        
        // Count appointments within the schedule's time range
        const [startHour, startMin] = schedule.start_time.split(':').map(Number);
        const [endHour, endMin] = schedule.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        const appointmentsInRange = appointments.filter(apt => {
          if (!apt.appointment_time) return false;
          const [aptHour, aptMin] = apt.appointment_time.split(':').map(Number);
          const aptMinutes = aptHour * 60 + aptMin;
          return aptMinutes >= startMinutes && aptMinutes <= endMinutes;
        });
        
        return { scheduleId: schedule._id, count: appointmentsInRange.length };
      } catch (err) {
        console.error('Error fetching appointments count:', err);
        return { scheduleId: schedule._id, count: 0 };
      }
    };

    setLoading(true);
    setError(null);
    try {
      const response = await getDoctorSchedules();
      const schedulesData = response.data || [];
      setSchedules(schedulesData);
      
      // Fetch booking counts for all schedules in parallel (much faster!)
      const countPromises = schedulesData.map(schedule => getAppointmentsCountForSchedule(schedule));
      const countResults = await Promise.all(countPromises);
      
      // Convert results array to object
      const bookingCounts = {};
      countResults.forEach(({ scheduleId, count }) => {
        bookingCounts[scheduleId] = count;
      });
      
      setScheduleBookings(bookingCounts);
    } catch (err) {
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to fetch doctor schedules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await getPatients();
      setPatients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data || []);
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

  const fetchInsurances = useCallback(async () => {
    try {
      const response = await getInsurances();
      setInsurances(response.data || []);
    } catch (err) {
      console.error('Failed to fetch insurances:', err);
    }
  }, []);

  // Fetch schedules on component mount
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
    fetchInsurances();
  }, [fetchPatients, fetchDoctors, fetchDepartments, fetchInsurances]);

  // Fetch booked times when doctor and date are selected
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (formData.doctor_id && formData.appointment_date) {
        try {
          const existingAppointmentsResponse = await getAppointments({
            doctor_id: formData.doctor_id,
            date: formData.appointment_date,
            status: 'scheduled'
          });
          
          const existingAppointments = existingAppointmentsResponse.data || [];
          const bookedTimes = {};
          
          // Mark all booked times as unavailable
          existingAppointments.forEach(apt => {
            if (apt.appointment_time) {
              bookedTimes[apt.appointment_time] = false;
            }
          });
          
          setTimeAvailability(bookedTimes);
        } catch (err) {
          console.error('Error fetching booked times:', err);
        }
      } else {
        setTimeAvailability({});
      }
    };

    fetchBookedTimes();
  }, [formData.doctor_id, formData.appointment_date]);

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
      const isBooked = existingAppointments.some(apt => apt.appointment_time === time);
      
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
      // Don't show error to user, just log it
    } finally {
      setTimeCheckLoading(false);
    }
  };

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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Auto-fill department when doctor is selected
    if (name === 'doctor_id' && value) {
      const selectedDoctor = doctors.find(d => d._id === value);
      if (selectedDoctor && selectedDoctor.department_id) {
        // Get department ID from doctor object
        const departmentId = typeof selectedDoctor.department_id === 'object'
          ? (selectedDoctor.department_id._id || '')
          : selectedDoctor.department_id;
        
        setFormData(prev => ({
          ...prev,
          [name]: value,
          department_id: departmentId || prev.department_id
        }));
        return;
      }
    }
    
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

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name === 'district' || name === 'sector') {
      setNewPatientData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value
        }
      }));
    } else {
      setNewPatientData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOpenBookingModal = (schedule = null) => {
    setShowBookingModal(true);
    setPatientType('existing');
    
    if (schedule) {
      // Auto-fill from selected schedule
      const doctorId = typeof schedule.doctor_id === 'object' 
        ? schedule.doctor_id._id 
        : schedule.doctor_id;
      
      // Get department from doctor object - handle different data structures
      let departmentId = '';
      
      // First, try to get department from schedule's doctor object
      if (schedule.doctor_id && typeof schedule.doctor_id === 'object') {
        if (schedule.doctor_id.department_id) {
          // department_id could be an object with _id or just an ID string
          departmentId = typeof schedule.doctor_id.department_id === 'object'
            ? (schedule.doctor_id.department_id._id || '')
            : schedule.doctor_id.department_id;
        }
      }
      
      // If department not found in schedule, look up from doctors array
      if (!departmentId && doctorId) {
        const doctor = doctors.find(d => d._id === doctorId);
        if (doctor && doctor.department_id) {
          // department_id could be an object with _id or just an ID string
          departmentId = typeof doctor.department_id === 'object'
            ? (doctor.department_id._id || '')
            : doctor.department_id;
        }
      }
      
      // Convert day of week to actual date
      const appointmentDate = getNextDateForDay(schedule.day_of_week);
      
      // Round start_time to nearest 10-minute interval to ensure it's selectable
      const roundedStartTime = schedule.start_time ? roundTo15Minutes(schedule.start_time) : '';
      
      // Set time to rounded start_time, but user can change it to any time within the schedule range
      // The schedule shows the doctor is available from start_time to end_time
      setFormData({
        patient_id: '',
        doctor_id: doctorId || '',
        department_id: departmentId || '',
        appointment_date: appointmentDate || '',
        appointment_time: roundedStartTime,
        reason: '',
        status: 'scheduled',
        // Store schedule info for reference
        schedule_start_time: schedule.start_time,
        schedule_end_time: schedule.end_time,
        schedule_id: schedule._id // Store schedule ID for validation
      });
    } else {
      // Empty form for manual booking
      setFormData({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        status: 'scheduled',
        schedule_start_time: '',
        schedule_end_time: ''
      });
    }
    
    setNewPatientData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      address: {
        district: '',
        sector: ''
      },
      origin: 'Rwandan',
      insurance: '',
      patient_id: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
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
      address: {
        district: '',
        sector: ''
      },
      origin: 'Rwandan',
      insurance: '',
      patient_id: ''
    });
    setError(null);
    setSuccess(null);
    setTimeAvailability({});
    setTimeCheckLoading(false);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setShowPatientResults(false);
    setSelectedPatientInfo(null);
    setPatientIdSearch('');
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    console.log('Form submission started:', { patientType, formData, newPatientData });
    
    // Validate required fields
    if (!formData.patient_id && patientType === 'existing') {
      setError('Please select a patient');
      console.error('Validation failed: No patient selected');
      return;
    }
    
    if (!formData.doctor_id) {
      setError('Please select a doctor');
      return;
    }
    
    if (!formData.department_id) {
      setError('Please select a department');
      return;
    }
    
    if (!formData.appointment_date) {
      setError('Please select an appointment date');
      return;
    }
    
    if (!formData.appointment_time) {
      setError('Please select an appointment time');
      return;
    }
    
    // Validate time format
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.appointment_time)) {
      setError('Please provide valid time format (HH:MM)');
      return;
    }
    
    // Validate 10-minute interval
    if (!isValid15MinuteInterval(formData.appointment_time)) {
      setError('Appointment time must be in 10-minute intervals (e.g., 08:00, 08:10, 08:20, 08:30)');
      return;
    }
    
    // Validate max patients limit
    if (formData.schedule_id) {
      const schedule = schedules.find(s => s._id === formData.schedule_id);
      if (schedule && schedule.max_patients) {
        const currentBookings = scheduleBookings[schedule._id] || 0;
        if (currentBookings >= schedule.max_patients) {
          setError(`This time slot is fully booked. Maximum ${schedule.max_patients} patient(s) allowed, and all slots are already taken. Please choose another schedule.`);
          return;
        }
      }
    }
    
    // Check if the specific time is already booked (before submitting to backend)
    try {
      const existingAppointmentsResponse = await getAppointments({
        doctor_id: formData.doctor_id,
        date: formData.appointment_date,
        status: 'scheduled'
      });
      
      const existingAppointments = existingAppointmentsResponse.data || [];
      const timeAlreadyBooked = existingAppointments.some(apt => {
        return apt.appointment_time === formData.appointment_time;
      });
      
      if (timeAlreadyBooked) {
        const formattedDate = new Date(formData.appointment_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const timeRange = formData.schedule_start_time && formData.schedule_end_time 
          ? ` (Available times: ${formData.schedule_start_time} - ${formData.schedule_end_time})`
          : '';
        setError(`⚠️ This time has already been taken by another patient. The doctor already has an appointment on ${formattedDate} at ${formData.appointment_time}. Please choose another time${timeRange}.`);
        return;
      }
    } catch (checkErr) {
      // If we can't check, continue with booking and let backend validate
      console.warn('Could not check existing appointments, proceeding with booking:', checkErr);
    }
    
    try {
      let patientId = formData.patient_id;
      let patientPublicId = null; // e.g., PAT-000001 (human-readable)
      
      // If creating new patient, create patient first
      if (patientType === 'new') {
        // Validate new patient data - check all required fields
        if (!newPatientData.first_name || !newPatientData.last_name || !newPatientData.phone) {
          setError('Please fill in all required patient fields (First Name, Last Name, Phone)');
          return;
        }
        
        // Validate district and sector (marked as required in form)
        if (!newPatientData.address.district || !newPatientData.address.sector) {
          setError('Please fill in District and Sector fields (both are required)');
          return;
        }
        
        // Prepare patient data with nested address structure
        const patientSubmitData = {
          first_name: newPatientData.first_name,
          last_name: newPatientData.last_name,
          phone: newPatientData.phone,
          date_of_birth: newPatientData.date_of_birth,
          gender: newPatientData.gender,
          address: {
            district: newPatientData.address.district,
            sector: newPatientData.address.sector
          },
          origin: newPatientData.origin || 'Rwandan'
        };
        // Only include email if provided
        if (newPatientData.email && newPatientData.email.trim()) {
          patientSubmitData.email = newPatientData.email.trim().toLowerCase();
        }
        
        try {
          const patientResponse = await createPatient(patientSubmitData);
          const createdPatient = patientResponse.data || patientResponse;
          patientId = createdPatient._id;
          patientPublicId = createdPatient.patient_id || createdPatient.patientId || null;
          // Refresh patients list
          await fetchPatients();
        } catch (patientErr) {
          console.error('Error creating patient:', patientErr);
          const patientErrorMessage = patientErr.message || 
                                    (patientErr.data && patientErr.data.message) ||
                                    (patientErr.data && patientErr.data.errors && Array.isArray(patientErr.data.errors) 
                                      ? patientErr.data.errors.join(', ') 
                                      : null) ||
                                    'Failed to create patient. Please check all fields and try again.';
          setError(`Failed to create patient: ${patientErrorMessage}`);
          return;
        }
      }

      // If using an existing patient, capture their patient_id for the success modal
      if (patientType !== 'new') {
        const existingPatient = patients.find(p => p._id === formData.patient_id);
        patientPublicId = existingPatient?.patient_id || selectedPatientInfo?.patient_id || null;
      }
      
      // Prepare submit data - only include required fields and non-empty optional fields
      const submitData = {
        patient_id: patientId,
        doctor_id: formData.doctor_id,
        department_id: formData.department_id,
        appointment_date: new Date(formData.appointment_date).toISOString(),
        appointment_time: formData.appointment_time,
        status: formData.status || 'scheduled'
      };
      
      // Only include reason if it's provided
      if (formData.reason && formData.reason.trim()) {
        submitData.reason = formData.reason.trim();
      }
      
      console.log('Submitting appointment data:', submitData);
      
      // Validate patientId exists before submitting
      if (!patientId) {
        setError('Patient ID is missing. Please select or create a patient.');
        console.error('Validation failed: Patient ID is missing');
        return;
      }
      
      console.log('Creating appointment with data:', submitData);
      const appointmentResponse = await createAppointment(submitData);
      console.log('Appointment created successfully:', appointmentResponse);
      const createdAppointment = appointmentResponse.data || appointmentResponse;
      
      // Notify the doctor about the new appointment
      try {
        await notifyDoctorAboutAppointment(formData.doctor_id, createdAppointment, formData, patientType === 'new' ? newPatientData : null);
      } catch (notifyErr) {
        // Don't fail the booking if notification fails, just log it
        console.warn('Failed to send notification to doctor:', notifyErr);
      }
      
      // Store appointment details before clearing form
      const bookedTime = formData.appointment_time;
      const bookedDoctorId = formData.doctor_id;
      const bookedDate = formData.appointment_date;
      
      // Format appointment details for success modal
      const doctorName = doctors.find(d => d._id === formData.doctor_id);
      const doctorDisplayName = doctorName 
        ? `Dr. ${doctorName.first_name} ${doctorName.last_name}`
        : 'Selected Doctor';
      
      const formattedDate = new Date(formData.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Store success modal data
      setSuccessModalData({
        patientName: patientType === 'new' 
          ? `${newPatientData.first_name} ${newPatientData.last_name}`
          : (patients.find(p => p._id === formData.patient_id)?.first_name + ' ' + patients.find(p => p._id === formData.patient_id)?.last_name || 'Patient'),
        patientId: patientPublicId,
        doctorName: doctorDisplayName,
        date: formattedDate,
        time: formData.appointment_time,
        isNewPatient: patientType === 'new'
      });
      
      // Close booking modal
      setShowBookingModal(false);
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
        address: {
          district: '',
          sector: ''
        },
        origin: 'Rwandan',
        insurance: '',
        patient_id: ''
      });
      setError(null);
      setTimeCheckLoading(false);
      setPatientSearchQuery('');
      setPatientSearchResults([]);
      setShowPatientResults(false);
      
      // Small delay to ensure booking modal closes before showing success modal
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);
      
      // Immediately mark the booked time as unavailable
      if (bookedTime) {
        setTimeAvailability(prev => ({
          ...prev,
          [bookedTime]: false
        }));
      }
      
      // Refresh the schedules list
      await fetchSchedules();
      
      // Refresh time availability for this doctor/date combination to ensure all booked times are updated
      if (bookedDoctorId && bookedDate) {
        try {
          const existingAppointmentsResponse = await getAppointments({
            doctor_id: bookedDoctorId,
            date: bookedDate,
            status: 'scheduled'
          });
          
          const existingAppointments = existingAppointmentsResponse.data || [];
          const bookedTimes = {};
          
          // Mark all booked times as unavailable
          existingAppointments.forEach(apt => {
            if (apt.appointment_time) {
              bookedTimes[apt.appointment_time] = false;
            }
          });
          
          setTimeAvailability(bookedTimes);
        } catch (err) {
          console.error('Error refreshing booked times:', err);
        }
      }
      
      // Success modal will be shown, no need for auto-dismiss
    } catch (err) {
      console.error('Error booking appointment:', err);
      // Extract detailed error message
      let errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to book appointment. Please check all fields and try again.';
      
      // Provide user-friendly message for common errors
      if (errorMessage.includes('already has an appointment') || 
          errorMessage.includes('already booked') ||
          errorMessage.includes('time slot is taken') ||
          errorMessage.includes('appointment already exists')) {
        const formattedDate = new Date(formData.appointment_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        errorMessage = `⚠️ This time slot has already been taken by another patient. The selected doctor already has an appointment on ${formattedDate} at ${formData.appointment_time}. Please choose another time within the available schedule range.`;
      } else if (errorMessage.includes('Doctor not found')) {
        errorMessage = 'The selected doctor could not be found. Please refresh the page and try again.';
      } else if (errorMessage.includes('Patient not found')) {
        errorMessage = 'The selected patient could not be found. Please refresh the page and try again.';
      } else if (errorMessage.includes('Department not found')) {
        errorMessage = 'The selected department could not be found. Please refresh the page and try again.';
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        errorMessage = `Validation Error: ${errorMessage}. Please check all required fields are filled correctly.`;
      }
      
      // Make sure error is displayed and modal stays open
      setError(errorMessage);
      setSuccess(null);
      
      // Scroll to error in modal
      setTimeout(() => {
        const errorElement = document.querySelector('.alert-error');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const getDoctorName = (doctor) => {
    if (!doctor) return 'N/A';
    if (typeof doctor === 'object' && doctor.first_name) {
      return `Dr. ${doctor.first_name} ${doctor.last_name}`;
    }
    return 'N/A';
  };

  // Helper function to notify doctor about new appointment
  const notifyDoctorAboutAppointment = async (doctorId, appointment, formData, newPatientInfo = null) => {
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
      if (formData.patient_id) {
        const patient = patients.find(p => p._id === formData.patient_id);
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
        }
      } else if (newPatientInfo && newPatientInfo.first_name) {
        patientName = `${newPatientInfo.first_name} ${newPatientInfo.last_name}`;
      }
      
      // Format appointment date and time
      const appointmentDate = formData.appointment_date 
        ? new Date(formData.appointment_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'TBD';
      const appointmentTime = formData.appointment_time || 'TBD';
      
      // Create notification message
      const notificationMessage = `New appointment booked! ${patientName} has scheduled an appointment with you on ${appointmentDate} at ${appointmentTime}.${formData.reason ? ` Reason: ${formData.reason}` : ''}`;
      
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

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  const authenticated = isAuthenticated();

  return (
    <div className="scheduled-appointments-page">
      {/* Public Header */}
      <header className="public-header">
        <div className="public-header-content">
            <Link to="/" className="public-header-logo">
            <HospitalLogo size="small" shape="circle" />
            <h2>Kigali Specialized Orthopaedic Hospital</h2>
          </Link>
          <nav className="public-header-nav">
            <Link to="/" className="public-nav-link">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
              </svg>
              <span>Home</span>
            </Link>
            {authenticated && (
              <Link to="/dashboard" className="public-nav-link">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                </svg>
                <span>Dashboard</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="scheduled-appointments-content">
        <div className="scheduled-appointments-header">
          <div>
            <h1>Doctor Schedules</h1>
            <p className="page-subtitle">View available doctor schedules and book appointments - No login required</p>
          </div>
          <button className="btn btn-primary btn-book" onClick={handleOpenBookingModal}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM17 10H7V12H17V10ZM15 14H7V16H15V14Z" fill="currentColor"/>
            </svg>
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Success Message removed - now shown in modal */}

        {/* Error Message - Only show when modal is NOT open */}
        {error && !showBookingModal && <ErrorDisplay error={error} />}

        {/* Doctor Schedules Display */}
        {loading ? (
          <div className="loading">Loading doctor schedules...</div>
        ) : (() => {
          // Filter out fully booked schedules - only show schedules with available slots
          const availableSchedules = schedules.filter(schedule => {
            // If no max_patients is set, always show the schedule
            if (!schedule.max_patients || schedule.max_patients === 0) {
              return true;
            }
            // If max_patients is set, only show if there are available slots
            const currentBookings = scheduleBookings[schedule._id] || 0;
            return currentBookings < schedule.max_patients;
          });
          
          return availableSchedules.length === 0 ? (
            <div className="no-appointments">
              <div className="no-appointments-icon">📅</div>
              <h3>No Available Schedules</h3>
              <p>All appointment slots are currently fully booked. Please check back later for available schedules.</p>
              <button className="btn btn-primary" onClick={handleOpenBookingModal}>
                Book Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-grid">
              {availableSchedules.map(schedule => (
              <div key={schedule._id} className="appointment-card">
                <div className="appointment-card-header">
                  <div className="appointment-date-time">
                    <div className="date-display">
                      {schedule.day_of_week}
                    </div>
                    <div className="time-display">
                      ⏰ {schedule.start_time} - {schedule.end_time}
                    </div>
                  </div>
                  <span className="status-badge status-scheduled">
                    Available
                  </span>
                </div>
                
                <div className="appointment-card-body">
                  <div className="appointment-info-row">
                    <span className="info-label">👨‍⚕️ Doctor:</span>
                    <span className="info-value">
                      {getDoctorName(schedule.doctor_id)}
                      {schedule.doctor_id && typeof schedule.doctor_id === 'object' && schedule.doctor_id.specialization && (
                        <span className="info-specialization">({schedule.doctor_id.specialization})</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="appointment-info-row">
                    <span className="info-label">📅 Day:</span>
                    <span className="info-value">
                      {schedule.day_of_week}
                    </span>
                  </div>
                  
                  <div className="appointment-info-row">
                    <span className="info-label">⏰ Time Slot:</span>
                    <span className="info-value">
                      {schedule.start_time} - {schedule.end_time}
                    </span>
                  </div>
                  
                  <div className="appointment-info-row">
                    <span className="info-label">👥 Max Patients:</span>
                    <span className="info-value">
                      {schedule.max_patients || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="appointment-card-footer">
                  {(() => {
                    const currentBookings = scheduleBookings[schedule._id] || 0;
                    const maxPatients = schedule.max_patients || 0;
                    const isFull = maxPatients > 0 && currentBookings >= maxPatients;
                    const availableSlots = maxPatients > 0 ? maxPatients - currentBookings : 'Unlimited';
                    
                    return (
                      <>
                        {maxPatients > 0 && (
                          <div className="booking-status" style={{ 
                            marginBottom: '0.75rem', 
                            padding: '0.5rem', 
                            backgroundColor: isFull ? '#fff3cd' : '#d1e7dd',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            color: isFull ? '#856404' : '#0f5132',
                            textAlign: 'center'
                          }}>
                            {isFull ? (
                              <strong>⚠️ Fully Booked ({currentBookings}/{maxPatients})</strong>
                            ) : (
                              <strong>✅ Available: {availableSlots} of {maxPatients} slots</strong>
                            )}
                          </div>
                        )}
                        <button 
                          className={`btn btn-sm ${isFull ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleOpenBookingModal(schedule)}
                          disabled={isFull}
                          style={{ width: '100%', opacity: isFull ? 0.6 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
                          title={isFull ? 'This time slot is fully booked' : 'Click to book this slot'}
                        >
                          {isFull ? 'Fully Booked' : 'Book This Slot'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Book New Appointment</h2>
              <button className="modal-close" onClick={handleCloseBookingModal}>×</button>
            </div>
            
            <form onSubmit={handleBookAppointment}>
              {/* Error Display at top of form - Inside modal, positioned above form content */}
              {error && (
                <div style={{ 
                  marginBottom: '1.5rem',
                  position: 'sticky',
                  top: '0',
                  zIndex: 1000,
                  width: '100%',
                  padding: '1rem 0',
                  marginTop: '-2rem',
                  paddingTop: '1.5rem',
                  backgroundColor: 'white',
                  animation: 'slideDown 0.3s ease-out',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <ErrorDisplay error={error} />
                </div>
              )}

              {/* Patient Type Selection */}
              <div className="form-group">
                <label>Patient Type *</label>
                <div className="radio-group">
                  <label className={`radio-label ${patientType === 'existing' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="patientType"
                      value="existing"
                      checked={patientType === 'existing'}
                      onChange={(e) => setPatientType(e.target.value)}
                    />
                    <div className="radio-content">
                      <svg className="radio-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor"/>
                      </svg>
                      <span>Existing Patient</span>
                    </div>
                  </label>
                  <label className={`radio-label ${patientType === 'new' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="patientType"
                      value="new"
                      checked={patientType === 'new'}
                      onChange={(e) => setPatientType(e.target.value)}
                    />
                    <div className="radio-content">
                      <svg className="radio-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12c2.209 0 4-1.791 4-4S17.209 4 15 4s-4 1.791-4 4 1.791 4 4 4Zm-9 1c1.657 0 3-1.343 3-3S7.657 7 6 7 3 8.343 3 10s1.343 3 3 3Zm0 2c-2.761 0-5 1.343-5 3v2h10v-2c0-1.657-2.239-3-5-3Zm9 0c-.346 0-.682.02-1.006.058 1.231.758 2.006 1.847 2.006 2.942v2h7v-2c0-1.657-2.239-3-5-3Zm-1-6v2h-2v2h2v2h2v-2h2v-2h-2V9h-2Z" fill="currentColor"/>
                      </svg>
                      <span>New Patient</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Patient Selection */}
              {patientType === 'existing' ? (
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
                    required
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
                      </div>
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="patient_id"
                    value={formData.patient_id}
                    required
                  />
                  <small className="form-hint" style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                    Enter the patient ID exactly as shown on the patient card
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
                      <label htmlFor="gender">Gender *</label>
                      <select
                        id="gender"
                        name="gender"
                        value={newPatientData.gender}
                        onChange={handleNewPatientChange}
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="date_of_birth">Date of Birth *</label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={newPatientData.date_of_birth}
                        onChange={handleNewPatientChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="district">District *</label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={newPatientData.address.district}
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
                        value={newPatientData.address.sector}
                        onChange={handleNewPatientChange}
                        required
                        placeholder="Enter sector..."
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="origin">Origin *</label>
                      <select
                        id="origin"
                        name="origin"
                        value={newPatientData.origin || 'Rwandan'}
                        onChange={handleNewPatientChange}
                        required
                      >
                        <option value="Rwandan">Rwandan</option>
                        <option value="East Africa">East Africa</option>
                        <option value="African">African</option>
                        <option value="Rest of the World">Rest of the World</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="insurance">Insurance</label>
                      <select
                        id="insurance"
                        name="insurance"
                        value={newPatientData.insurance}
                        onChange={handleNewPatientChange}
                      >
                        <option value="">None</option>
                        {insurances.map(insurance => (
                          <option key={insurance._id} value={insurance._id}>
                            {insurance.insurance_name || insurance.name || insurance._id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="patient_id">Patient ID</label>
                    <input
                      type="text"
                      id="patient_id"
                      name="patient_id"
                      value={newPatientData.patient_id}
                      onChange={handleNewPatientChange}
                      placeholder="Auto-generated (e.g., PAT-000001)"
                      disabled
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                      Patient ID is automatically generated by the system
                    </small>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="doctor_id">Doctor *</label>
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
                      const startTime = formData.schedule_start_time || '08:00';
                      const endTime = formData.schedule_end_time || '18:00';
                      const timeSlots = generateTimeSlots(startTime, endTime);
                      
                      // Filter out booked times - they should disappear completely
                      const availableSlots = timeSlots.filter(time => {
                        const isAvailable = timeAvailability[time];
                        // Only show times that are not explicitly marked as booked (false)
                        // If timeAvailability[time] is undefined, it means we haven't checked yet, so show it
                        return isAvailable !== false;
                      });
                      
                      // Ensure selected value is included in options if it's not already (but not if it's booked)
                      const selectedTime = formData.appointment_time;
                      const allSlots = selectedTime && !availableSlots.includes(selectedTime) && isValid15MinuteInterval(selectedTime) && timeAvailability[selectedTime] !== false
                        ? [...availableSlots, selectedTime].sort()
                        : availableSlots;
                      
                      return allSlots.map(time => (
                        <option 
                          key={time} 
                          value={time}
                        >
                          {time}
                        </option>
                      ));
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
                  <small className="form-hint">
                    {formData.schedule_start_time && formData.schedule_end_time 
                      ? `Select time between ${formData.schedule_start_time} and ${formData.schedule_end_time} (10-minute intervals)`
                      : 'Select a time slot (10-minute intervals)'}
                  </small>
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

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseBookingModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowSuccessModal(false)}
          style={{ zIndex: 2000 }}
        >
          <div 
            className="modal-content success-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '500px', zIndex: 2001 }}
          >
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '16px 16px 0 0' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg style={{ width: '28px', height: '28px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                </svg>
                Appointment Booked Successfully!
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setShowSuccessModal(false)}
                style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <svg style={{ width: '48px', height: '48px', color: '#059669' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                </svg>
              </div>
              
              <h3 style={{ color: '#1e3a5f', marginBottom: '1rem', fontSize: '1.5rem' }}>
                {successModalData.isNewPatient ? 'Patient & Appointment Created!' : 'Appointment Confirmed!'}
              </h3>
              
              <div style={{ 
                background: '#f0f9ff', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#64748b' }}>Patient:</strong>
                  <div style={{ color: '#1e3a5f', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    {successModalData.patientName}
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#64748b' }}>Patient ID:</strong>
                  <div style={{ color: '#0f172a', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    {successModalData.patientId || 'N/A'}
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#64748b' }}>Doctor:</strong>
                  <div style={{ color: '#1e3a5f', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    {successModalData.doctorName}
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#64748b' }}>Date:</strong>
                  <div style={{ color: '#1e3a5f', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    {successModalData.date}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Time:</strong>
                  <div style={{ color: '#007bff', fontSize: '1.2rem', fontWeight: '600', marginTop: '0.25rem' }}>
                    {successModalData.time}
                  </div>
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px solid #f59e0b',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  justifyContent: 'center',
                  color: '#92400e',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                  </svg>
                  <span>You have already booked. Please come before 10 minutes of your scheduled time.</span>
                </div>
              </div>
              
              <button
                className="btn btn-primary"
                onClick={() => setShowSuccessModal(false)}
                style={{
                  width: '100%',
                  padding: '0.875rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
              >
                Got it, Thank you!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledAppointmentsPage;
