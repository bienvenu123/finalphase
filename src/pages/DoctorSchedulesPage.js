import React, { useState, useEffect, useCallback } from 'react';
import {
  getDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getSchedulesByDoctor,
  notifyScheduleChange
} from '../services/doctorScheduleService';
import { getDoctors } from '../services/doctorService';
import { getAppointments, updateAppointment } from '../services/appointmentService';
import { getCurrentDoctorId, isDoctor } from '../utils/doctorUtils';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './DoctorSchedulesPage.css';

const DoctorSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [reschedulingSchedule, setReschedulingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: '',
    day_of_week: 'Monday',
    start_time: '',
    end_time: '',
    max_patients: 1
  });
  const [rescheduleFormData, setRescheduleFormData] = useState({
    day_of_week: 'Monday',
    start_time: '',
    end_time: '',
    max_patients: 1
  });
  
  // Filter state
  const [doctorFilter, setDoctorFilter] = useState('');
  
  // Doctors state for dropdowns
  const [doctors, setDoctors] = useState([]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If user is a doctor, only fetch their schedules
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (doctorId) {
          response = await getSchedulesByDoctor(doctorId);
        } else {
          setError('Doctor profile not found. Please contact administrator.');
          setSchedules([]);
          setLoading(false);
          return;
        }
      } else if (doctorFilter) {
        // Admin can filter by doctor
        response = await getSchedulesByDoctor(doctorFilter);
      } else {
        // Admin can see all schedules
        response = await getDoctorSchedules();
      }
      
      setSchedules(response.data || []);
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
  }, [doctorFilter]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      // Continue without doctors - user can still enter doctor_id manually if needed
    }
  }, []);

  // Fetch schedules on component mount and when filter changes
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_patients' ? parseInt(value) || 1 : value
    }));
  };

  const handleFilterChange = (e) => {
    setDoctorFilter(e.target.value);
  };

  const handleOpenModal = async (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      // Handle populated doctor object, null doctor_id, or doctor ID string
      let doctorId = '';
      
      if (schedule.doctor_id === null) {
        // Backend sets doctor_id to null if doctor not found
        doctorId = '';
      } else if (typeof schedule.doctor_id === 'object') {
        // Populated doctor object
        doctorId = schedule.doctor_id._id || schedule.doctor_id || '';
      } else if (typeof schedule.doctor_id === 'string') {
        // Doctor ID string
        doctorId = schedule.doctor_id;
      }
      
      setFormData({
        doctor_id: doctorId,
        day_of_week: schedule.day_of_week || 'Monday',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        max_patients: schedule.max_patients || 1
      });
    } else {
      setEditingSchedule(null);
      // If user is a doctor, auto-fill their doctor_id
      let doctorId = '';
      if (isDoctor()) {
        doctorId = await getCurrentDoctorId() || '';
      }
      setFormData({
        doctor_id: doctorId,
        day_of_week: 'Monday',
        start_time: '',
        end_time: '',
        max_patients: 1
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      doctor_id: '',
      day_of_week: 'Monday',
      start_time: '',
      end_time: '',
      max_patients: 1
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate required fields
    if (!formData.doctor_id) {
      setError('Please select a doctor');
      return;
    }
    
    if (!formData.start_time || !formData.end_time) {
      setError('Please provide both start and end times');
      return;
    }
    
    // Validate time format (HH:MM with leading zeros)
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.start_time) || !timeRegex.test(formData.end_time)) {
      setError('Please provide valid time format (HH:MM)');
      return;
    }
    
    // Validate end time is after start time
    const start = formData.start_time.split(':').map(Number);
    const end = formData.end_time.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }
    
    try {
      // Prepare data with proper types
      const submitData = {
        doctor_id: formData.doctor_id,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_patients: parseInt(formData.max_patients, 10) || 1
      };
      
      if (editingSchedule) {
        await updateDoctorSchedule(editingSchedule._id, submitData);
        setSuccess('Doctor schedule updated successfully!');
      } else {
        await createDoctorSchedule(submitData);
        setSuccess('Doctor schedule created successfully!');
      }
      
      handleCloseModal();
      fetchSchedules();
    } catch (err) {
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to save doctor schedule';
      setError(errorMessage);
    }
  };

  const handleOpenRescheduleModal = (schedule) => {
    setReschedulingSchedule(schedule);
    setRescheduleFormData({
      day_of_week: schedule.day_of_week || 'Monday',
      start_time: schedule.start_time || '',
      end_time: schedule.end_time || '',
      max_patients: schedule.max_patients || 1
    });
    setShowRescheduleModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setReschedulingSchedule(null);
    setRescheduleFormData({
      day_of_week: 'Monday',
      start_time: '',
      end_time: '',
      max_patients: 1
    });
    setError(null);
    setSuccess(null);
  };

  const handleRescheduleInputChange = (e) => {
    const { name, value } = e.target;
    setRescheduleFormData(prev => ({
      ...prev,
      [name]: name === 'max_patients' ? parseInt(value) || 1 : value
    }));
  };

  // Helper function to get next date for a day of week
  const getNextDateForDay = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = days.indexOf(dayOfWeek);
    if (dayIndex === -1) return null;
    
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilTarget = dayIndex - currentDay;
    
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    if (daysUntilTarget === 0) {
      daysUntilTarget = 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate.toISOString().split('T')[0];
  };

  // Function to send email notification to patients via separate API endpoint
  const sendScheduleChangeNotifications = async (scheduleId, oldSchedule, newSchedule) => {
    try {
      const doctorId = typeof reschedulingSchedule.doctor_id === 'object' 
        ? reschedulingSchedule.doctor_id._id 
        : reschedulingSchedule.doctor_id;
      
      if (!doctorId) {
        console.warn('Cannot send notifications: Doctor ID not found');
        return { success: false, message: 'Doctor ID not found' };
      }

      // Get appointments for the old schedule
      const oldDate = getNextDateForDay(oldSchedule.day_of_week);
      if (!oldDate) {
        console.warn('Cannot send notifications: Invalid day of week');
        return { success: false, message: 'Invalid day of week' };
      }

      // Fetch appointments for the doctor on the old schedule date
      const appointmentsResponse = await getAppointments({
        doctor_id: doctorId,
        date: oldDate,
        status: 'scheduled'
      });

      const appointments = appointmentsResponse.data || [];
      
      // Filter appointments within the old schedule's time range
      const [oldStartHour, oldStartMin] = oldSchedule.start_time.split(':').map(Number);
      const [oldEndHour, oldEndMin] = oldSchedule.end_time.split(':').map(Number);
      const oldStartMinutes = oldStartHour * 60 + oldStartMin;
      const oldEndMinutes = oldEndHour * 60 + oldEndMin;

      const affectedAppointments = appointments.filter(apt => {
        if (!apt.appointment_time) return false;
        const [aptHour, aptMin] = apt.appointment_time.split(':').map(Number);
        const aptMinutes = aptHour * 60 + aptMin;
        return aptMinutes >= oldStartMinutes && aptMinutes <= oldEndMinutes;
      });

      if (affectedAppointments.length === 0) {
        console.log('No appointments found for this schedule');
        return { success: true, message: 'No appointments found for this schedule' };
      }

      // Get new schedule date
      const newDate = getNextDateForDay(newSchedule.day_of_week);
      
      // Update each appointment to match the new schedule
      // Calculate new appointment times based on the time difference from start_time
      const updatePromises = affectedAppointments.map(async (appointment) => {
        try {
          // Calculate time offset from old schedule start time
          const [oldStartHour, oldStartMin] = oldSchedule.start_time.split(':').map(Number);
          const [aptHour, aptMin] = appointment.appointment_time.split(':').map(Number);
          const oldStartMinutes = oldStartHour * 60 + oldStartMin;
          const aptMinutes = aptHour * 60 + aptMin;
          const timeOffsetMinutes = aptMinutes - oldStartMinutes;
          
          // Calculate new appointment time based on new schedule start time
          const [newStartHour, newStartMin] = newSchedule.start_time.split(':').map(Number);
          const newStartMinutes = newStartHour * 60 + newStartMin;
          const newAptMinutes = newStartMinutes + timeOffsetMinutes;
          
          // Ensure the new time is within the new schedule range
          const [newEndHour, newEndMin] = newSchedule.end_time.split(':').map(Number);
          const newEndMinutes = newEndHour * 60 + newEndMin;
          const clampedMinutes = Math.max(newStartMinutes, Math.min(newAptMinutes, newEndMinutes));
          
          const newAptHours = Math.floor(clampedMinutes / 60);
          const newAptMins = clampedMinutes % 60;
          const newAppointmentTime = `${String(newAptHours).padStart(2, '0')}:${String(newAptMins).padStart(2, '0')}`;
          
          // Update appointment with new date and time
          const appointmentUpdateData = {
            appointment_date: new Date(newDate).toISOString(),
            appointment_time: newAppointmentTime
          };
          
          await updateAppointment(appointment._id, appointmentUpdateData);
          return { appointment_id: appointment._id, status: 'updated' };
        } catch (updateErr) {
          console.error(`Failed to update appointment ${appointment._id}:`, updateErr);
          return { appointment_id: appointment._id, status: 'failed', error: updateErr.message };
        }
      });
      
      // Wait for all appointment updates to complete
      const updateResults = await Promise.all(updatePromises);
      const successfulUpdates = updateResults.filter(r => r.status === 'updated').length;
      const failedUpdates = updateResults.filter(r => r.status === 'failed').length;
      
      // Prepare notification payload
      const notificationPayload = {
        schedule_id: scheduleId,
        old_schedule: {
          day_of_week: oldSchedule.day_of_week,
          date: oldDate,
          start_time: oldSchedule.start_time,
          end_time: oldSchedule.end_time
        },
        new_schedule: {
          day_of_week: newSchedule.day_of_week,
          date: newDate,
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time
        },
        appointment_ids: affectedAppointments.map(apt => apt._id)
      };

      // Call separate email notification API endpoint using the service
      // Wrap in try-catch to handle notification errors gracefully
      let notificationResult = null;
      let notificationError = null;
      
      try {
        notificationResult = await notifyScheduleChange(notificationPayload);
        console.log(`Successfully sent email notifications to ${affectedAppointments.length} patient(s)`);
      } catch (notifyErr) {
        console.error('Error sending email notifications:', notifyErr);
        notificationError = notifyErr;
        // Don't fail the whole operation if notifications fail
      }
      
      console.log(`Successfully updated ${successfulUpdates} appointment(s)`);
      
      let message = `Schedule updated! ${successfulUpdates} appointment(s) updated`;
      if (failedUpdates > 0) {
        message += `, ${failedUpdates} failed to update`;
      }
      
      if (notificationResult) {
        message += `. ${notificationResult.data?.message || notificationResult.message || `Notifications sent to ${affectedAppointments.length} patient(s)`}`;
      } else if (notificationError) {
        message += `. Email notifications failed: ${notificationError.message}. Please notify patients manually.`;
      }
      
      return { 
        success: true, 
        message: message,
        data: { 
          notificationResult, 
          notificationError: notificationError?.message,
          updateResults, 
          successfulUpdates, 
          failedUpdates 
        }
      };
    } catch (err) {
      console.error('Error in sendScheduleChangeNotifications:', err);
      // Extract error message from the service error
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          'Failed to process schedule change notifications';
      return { success: false, message: errorMessage, error: err };
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!reschedulingSchedule) {
      setError('No schedule selected for rescheduling');
      return;
    }
    
    // Validate required fields
    if (!rescheduleFormData.start_time || !rescheduleFormData.end_time) {
      setError('Please provide both start and end times');
      return;
    }
    
    // Validate time format
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(rescheduleFormData.start_time) || !timeRegex.test(rescheduleFormData.end_time)) {
      setError('Please provide valid time format (HH:MM)');
      return;
    }
    
    // Validate end time is after start time
    const start = rescheduleFormData.start_time.split(':').map(Number);
    const end = rescheduleFormData.end_time.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }
    
    try {
      // Store old schedule data for comparison
      const oldSchedule = {
        day_of_week: reschedulingSchedule.day_of_week,
        start_time: reschedulingSchedule.start_time,
        end_time: reschedulingSchedule.end_time,
        max_patients: reschedulingSchedule.max_patients
      };

      // Check if schedule actually changed
      const hasChanged = 
        oldSchedule.day_of_week !== rescheduleFormData.day_of_week ||
        oldSchedule.start_time !== rescheduleFormData.start_time ||
        oldSchedule.end_time !== rescheduleFormData.end_time ||
        oldSchedule.max_patients !== rescheduleFormData.max_patients;

      // Prepare update data (same as regular update)
      const submitData = {
        doctor_id: typeof reschedulingSchedule.doctor_id === 'object' 
          ? reschedulingSchedule.doctor_id._id 
          : reschedulingSchedule.doctor_id,
        day_of_week: rescheduleFormData.day_of_week,
        start_time: rescheduleFormData.start_time,
        end_time: rescheduleFormData.end_time,
        max_patients: parseInt(rescheduleFormData.max_patients, 10) || 1
      };
      
      // Update the schedule using the existing updateDoctorSchedule function
      await updateDoctorSchedule(reschedulingSchedule._id, submitData);
      setSuccess('Schedule updated successfully!');
      
      // If schedule changed, send email notifications to affected patients via separate API
      if (hasChanged) {
        const newSchedule = {
          day_of_week: rescheduleFormData.day_of_week,
          start_time: rescheduleFormData.start_time,
          end_time: rescheduleFormData.end_time,
          max_patients: rescheduleFormData.max_patients
        };
        
        // Send notifications via separate API endpoint
        const notificationResult = await sendScheduleChangeNotifications(
          reschedulingSchedule._id,
          oldSchedule,
          newSchedule
        );
        
        if (notificationResult.success) {
          setSuccess(`Schedule updated successfully! ${notificationResult.message}`);
        } else {
          setSuccess(`Schedule updated successfully, but notifications failed: ${notificationResult.message}`);
        }
      } else {
        setSuccess('Schedule information saved (no changes detected)');
      }
      
      handleCloseRescheduleModal();
      fetchSchedules();
    } catch (err) {
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to reschedule';
      setError(errorMessage);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this doctor schedule?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteDoctorSchedule(scheduleId);
      setSuccess('Doctor schedule deleted successfully!');
      fetchSchedules();
    } catch (err) {
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to delete doctor schedule';
      setError(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDoctorName = (doctor) => {
    // Handle null doctor_id (backend sets to null if doctor not found)
    if (!doctor || doctor === null) {
      return 'Doctor Not Found';
    }
    
    // Handle populated doctor object
    if (typeof doctor === 'object' && doctor.first_name && doctor.last_name) {
      return `Dr. ${doctor.first_name} ${doctor.last_name}`;
    }
    
    // Handle case where doctor might be just an ID string (not populated)
    if (typeof doctor === 'string') {
      return 'Doctor ID: ' + doctor;
    }
    
    return 'Unknown Doctor';
  };

  const getDoctorSpecialization = (doctor) => {
    // Handle null doctor_id
    if (!doctor || doctor === null || typeof doctor !== 'object') {
      return '';
    }
    return doctor.specialization || '';
  };

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  // Group schedules by day of week for better display
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {});

  // Sort days in order
  const sortedDays = daysOfWeek.filter(day => groupedSchedules[day]);

  return (
    <div className="doctor-schedules-page">
      <div className="doctor-schedules-header">
        <h1>Doctor Schedule Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {schedules.length > 0 && (
            <ReportButton
              data={schedules}
              entityType="doctorSchedules"
              title="Doctor Schedules Report"
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create Schedule
          </button>
        </div>
      </div>

      {/* Filters - Only show for admins */}
      {!isDoctor() && (
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-doctor">Filter by Doctor:</label>
          <select
            id="filter-doctor"
            value={doctorFilter}
            onChange={handleFilterChange}
          >
            <option value="">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.first_name} {doctor.last_name} {doctor.specialization ? `(${doctor.specialization})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setDoctorFilter('')}
        >
          Clear Filter
        </button>
      </div>
      )}

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Schedules Display */}
      {loading ? (
        <div className="loading">Loading doctor schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="no-data">No doctor schedules found</div>
      ) : (
        <div className="schedules-container">
          {sortedDays.length > 0 ? (
            sortedDays.map(day => (
              <div key={day} className="day-schedule-group">
                <h2 className="day-header">{day}</h2>
                <div className="schedules-list">
                  {groupedSchedules[day].map(schedule => (
                    <div key={schedule._id} className="schedule-card">
                      <div className="schedule-header">
                        <div className="schedule-doctor-info">
                          <h3 className={`doctor-name ${!schedule.doctor_id || schedule.doctor_id === null ? 'doctor-not-found' : ''}`}>
                            {getDoctorName(schedule.doctor_id)}
                          </h3>
                          {getDoctorSpecialization(schedule.doctor_id) && (
                            <span className="doctor-specialization">
                              {getDoctorSpecialization(schedule.doctor_id)}
                            </span>
                          )}
                          {(!schedule.doctor_id || schedule.doctor_id === null) && (
                            <span className="doctor-warning">⚠️ Doctor reference not found</span>
                          )}
                        </div>
                        <div className="schedule-time">
                          <span className="time-range">
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                        </div>
                      </div>
                      
                      <div className="schedule-details">
                        <div className="detail-item">
                          <span className="detail-label">Max Patients:</span>
                          <span className="detail-value">{schedule.max_patients}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">{formatDate(schedule.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="schedule-actions">
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => handleOpenModal(schedule)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-reschedule"
                          onClick={() => handleOpenRescheduleModal(schedule)}
                          style={{ backgroundColor: '#ff9800', color: 'white' }}
                        >
                          Re-schedule
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(schedule._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="schedules-list">
              {schedules.map(schedule => (
                <div key={schedule._id} className="schedule-card">
                  <div className="schedule-header">
                    <div className="schedule-doctor-info">
                      <h3 className={`doctor-name ${!schedule.doctor_id || schedule.doctor_id === null ? 'doctor-not-found' : ''}`}>
                        {getDoctorName(schedule.doctor_id)}
                      </h3>
                      {getDoctorSpecialization(schedule.doctor_id) && (
                        <span className="doctor-specialization">
                          {getDoctorSpecialization(schedule.doctor_id)}
                        </span>
                      )}
                      {(!schedule.doctor_id || schedule.doctor_id === null) && (
                        <span className="doctor-warning">⚠️ Doctor reference not found</span>
                      )}
                    </div>
                    <div className="schedule-time">
                      <span className="day-badge">{schedule.day_of_week}</span>
                      <span className="time-range">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                  </div>
                  
                  <div className="schedule-details">
                    <div className="detail-item">
                      <span className="detail-label">Max Patients:</span>
                      <span className="detail-value">{schedule.max_patients}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(schedule.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="schedule-actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleOpenModal(schedule)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-reschedule"
                      onClick={() => handleOpenRescheduleModal(schedule)}
                      style={{ backgroundColor: '#ff9800', color: 'white' }}
                    >
                      Re-schedule
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(schedule._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Doctor Schedule' : 'Create New Doctor Schedule'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
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
                ) : doctors.length > 0 ? (
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
                ) : (
                  <input
                    type="text"
                    id="doctor_id"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Doctor ID"
                  />
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="day_of_week">Day of Week *</label>
                  <select
                    id="day_of_week"
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    required
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="max_patients">Max Patients *</label>
                  <input
                    type="number"
                    id="max_patients"
                    name="max_patients"
                    value={formData.max_patients}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_time">Start Time *</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                  <small className="form-hint">Format: HH:MM (24-hour)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="end_time">End Time *</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                  <small className="form-hint">Must be after start time</small>
                </div>
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
                  {editingSchedule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && reschedulingSchedule && (
        <div className="modal-overlay" onClick={handleCloseRescheduleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Re-schedule Appointment</h2>
              <button className="modal-close" onClick={handleCloseRescheduleModal}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '1rem', marginLeft: '1.5rem', marginRight: '1.5rem', marginTop: '1rem' }}>
              <strong>⚠️ Important:</strong> Changing this schedule will automatically send email notifications to all patients who have appointments booked for this schedule.
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <label>Doctor:</label>
                <input
                  type="text"
                  value={getDoctorName(reschedulingSchedule.doctor_id)}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small className="form-hint">Doctor cannot be changed during reschedule</small>
              </div>

              <div className="form-row" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="reschedule_day_of_week">Day of Week *</label>
                  <select
                    id="reschedule_day_of_week"
                    name="day_of_week"
                    value={rescheduleFormData.day_of_week}
                    onChange={handleRescheduleInputChange}
                    required
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reschedule_max_patients">Max Patients *</label>
                  <input
                    type="number"
                    id="reschedule_max_patients"
                    name="max_patients"
                    value={rescheduleFormData.max_patients}
                    onChange={handleRescheduleInputChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="reschedule_start_time">Start Time *</label>
                  <input
                    type="time"
                    id="reschedule_start_time"
                    name="start_time"
                    value={rescheduleFormData.start_time}
                    onChange={handleRescheduleInputChange}
                    required
                  />
                  <small className="form-hint">Format: HH:MM (24-hour)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="reschedule_end_time">End Time *</label>
                  <input
                    type="time"
                    id="reschedule_end_time"
                    name="end_time"
                    value={rescheduleFormData.end_time}
                    onChange={handleRescheduleInputChange}
                    required
                  />
                  <small className="form-hint">Must be after start time</small>
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ margin: '1rem 1.5rem' }}>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseRescheduleModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ff9800' }}>
                  Re-schedule & Notify Patients
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedulesPage;

