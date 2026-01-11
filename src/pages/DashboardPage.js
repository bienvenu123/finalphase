import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../services/userService';
import { getPatients } from '../services/patientService';
import { getDoctors } from '../services/doctorService';
import { getAppointments } from '../services/appointmentService';
import { getDepartments } from '../services/departmentService';
import { getMedicalRecords } from '../services/medicalRecordService';
import { getNotifications } from '../services/notificationService';
import HospitalLogo from '../components/HospitalLogo';
import ErrorDisplay from '../components/ErrorDisplay';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    users: 0,
    patients: 0,
    doctors: 0,
    appointments: 0,
    departments: 0,
    medicalRecords: 0,
    notifications: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all statistics in parallel
      const [
        usersRes,
        patientsRes,
        doctorsRes,
        appointmentsRes,
        departmentsRes,
        medicalRecordsRes,
        notificationsRes
      ] = await Promise.all([
        getUsers().catch(() => ({ data: [] })),
        getPatients().catch(() => ({ data: [] })),
        getDoctors().catch(() => ({ data: [] })),
        getAppointments().catch(() => ({ data: [] })),
        getDepartments().catch(() => ({ data: [] })),
        getMedicalRecords().catch(() => ({ data: [] })),
        getNotifications().catch(() => ({ data: [] }))
      ]);

      setStats({
        users: usersRes.data?.length || 0,
        patients: patientsRes.data?.length || 0,
        doctors: doctorsRes.data?.length || 0,
        appointments: appointmentsRes.data?.length || 0,
        departments: departmentsRes.data?.length || 0,
        medicalRecords: medicalRecordsRes.data?.length || 0,
        notifications: notificationsRes.data?.length || 0
      });

      // Get recent appointments (last 5)
      if (appointmentsRes.data && appointmentsRes.data.length > 0) {
        const recent = appointmentsRes.data
          .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
          .slice(0, 5);
        setRecentAppointments(recent);
      }

      // Get recent notifications (last 5) and unread count
      if (notificationsRes.data && notificationsRes.data.length > 0) {
        const notifications = notificationsRes.data;
        const unreadCount = notifications.filter(n => !n.is_read).length;
        setUnreadNotificationCount(unreadCount);
        
        const recent = notifications
          .sort((a, b) => new Date(b.sent_at || b.createdAt || b.created_at) - new Date(a.sent_at || a.createdAt || a.created_at))
          .slice(0, 5);
        setRecentNotifications(recent);
      } else {
        setUnreadNotificationCount(0);
        setRecentNotifications([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.patients,
      icon: '🏥',
      color: 'blue',
      link: '/patients'
    },
    {
      title: 'Doctors',
      value: stats.doctors,
      icon: '👨‍⚕️',
      color: 'green',
      link: '/doctors'
    },
    {
      title: 'Appointments',
      value: stats.appointments,
      icon: '📋',
      color: 'purple',
      link: '/appointments'
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: '🏢',
      color: 'orange',
      link: '/departments'
    },
    {
      title: 'Medical Records',
      value: stats.medicalRecords,
      icon: '📝',
      color: 'teal',
      link: '/medical-records'
    },
    {
      title: 'Users',
      value: stats.users,
      icon: '👥',
      color: 'indigo',
      link: '/users'
    },
    {
      title: 'Notifications',
      value: stats.notifications,
      icon: '🔔',
      color: 'red',
      link: '/notifications'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hospital Header */}
      <div className="hospital-header">
        <div className="hospital-info">
          <h1 className="hospital-name">KIGALI ORTHOPAEDIC SPECIALIZED HOSPITAL</h1>
          <p className="hospital-subtitle">Hospital Management System Dashboard</p>
        </div>
        <div className="hospital-logo">
          <HospitalLogo size="xlarge" shape="circle" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link key={index} to={card.link} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
            </div>
            <div className="stat-arrow">→</div>
          </Link>
        ))}
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
                  {notification.user_id?.name || notification.user_id?.email || 'System'} • {formatDateTime(notification.sent_at || notification.createdAt || notification.created_at, '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Appointments</h2>
          <Link to="/appointments" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {recentAppointments.length === 0 ? (
          <div className="no-data-card">
            <p>No recent appointments found</p>
          </div>
        ) : (
          <div className="appointments-list">
            {recentAppointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-info">
                  <div className="appointment-main">
                    <h3>
                      {appointment.patient_id?.first_name || 'N/A'}{' '}
                      {appointment.patient_id?.last_name || ''}
                    </h3>
                    <p className="appointment-doctor">
                      Dr. {appointment.doctor_id?.first_name || 'N/A'}{' '}
                      {appointment.doctor_id?.last_name || ''}
                      {appointment.doctor_id?.department_id && (
                        <span className="department-name">
                          {' '}• {appointment.doctor_id.department_id.department_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">
                        {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                      </span>
                    </div>
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

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/appointments" className="quick-action-card">
            <div className="quick-action-icon">📅</div>
            <div className="quick-action-text">Create Appointment</div>
          </Link>
          <Link to="/patients" className="quick-action-card">
            <div className="quick-action-icon">➕</div>
            <div className="quick-action-text">Add Patient</div>
          </Link>
          <Link to="/doctors" className="quick-action-card">
            <div className="quick-action-icon">👨‍⚕️</div>
            <div className="quick-action-text">Add Doctor</div>
          </Link>
          <Link to="/doctor-schedules" className="quick-action-card">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-text">Manage Schedules</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

