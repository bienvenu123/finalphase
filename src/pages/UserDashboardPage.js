import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getAppointments } from '../services/appointmentService';
import { getNotificationsByUser } from '../services/notificationService';
import HospitalLogo from '../components/HospitalLogo';
import ErrorDisplay from '../components/ErrorDisplay';
import SvgIcon from '../components/SvgIcon';
import './UserDashboardPage.css';

const UserDashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    myAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    notifications: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserDashboardData();
  }, []);

  const fetchUserDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setError('Please login to access your dashboard');
        setLoading(false);
        return;
      }

      // Fetch data
      const [
        appointmentsRes,
        notificationsRes
      ] = await Promise.all([
        getAppointments().catch(() => ({ data: [] })),
        getNotificationsByUser(user._id || user.id).catch(() => ({ data: [] }))
      ]);

      const allAppointments = appointmentsRes.data || [];
      
      // Filter appointments for current user (if patient data is available)
      const myAppointments = allAppointments;
      
      // Separate upcoming and completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = myAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && (apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'pending');
      });

      const completed = myAppointments.filter(apt => 
        apt.status === 'completed'
      );

      setStats({
        myAppointments: myAppointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        notifications: notificationsRes.data?.length || 0
      });

      // Set upcoming appointments (sorted by date)
      const sortedUpcoming = upcoming
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
        .slice(0, 5);
      setUpcomingAppointments(sortedUpcoming);

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
      title: 'My Appointments',
      value: stats.myAppointments,
      icon: 'clipboard',
      color: 'blue',
      link: '/scheduled-appointments'
    },
    {
      title: 'Upcoming',
      value: stats.upcomingAppointments,
      icon: 'calendar',
      color: 'green',
      link: '/scheduled-appointments'
    },
    {
      title: 'Completed',
      value: stats.completedAppointments,
      icon: 'chart',
      color: 'purple',
      link: '/scheduled-appointments'
    },
    {
      title: 'Notifications',
      value: stats.notifications,
      icon: 'bell',
      color: 'red',
      link: '/notifications'
    }
  ];

  if (loading) {
    return (
      <div className="user-dashboard-page">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-dashboard-page">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="user-dashboard-page">
      {/* Hospital Header */}
      <div className="hospital-header">
        <div className="hospital-info">
          <h1 className="hospital-name">KIGALI ORTHOPAEDIC SPECIALIZED HOSPITAL</h1>
          <p className="hospital-subtitle">Patient Portal</p>
        </div>
        <div className="hospital-logo">
          <HospitalLogo size="xlarge" shape="circle" />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>👋 Welcome back, {currentUser?.name || 'User'}</h2>
        <p>Manage your appointments and health information</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link key={index} to={card.link} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-icon"><SvgIcon name={card.icon} /></div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
            </div>
            <div className="stat-arrow">→</div>
          </Link>
        ))}
      </div>

      {/* Upcoming Appointments Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📅 Upcoming Appointments</h2>
          <Link to="/scheduled-appointments" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {upcomingAppointments.length === 0 ? (
          <div className="no-data-card">
            <svg className="no-data-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM17 10H7V12H17V10ZM15 14H7V16H15V14Z" fill="currentColor"/>
            </svg>
            <p>No upcoming appointments</p>
            <Link to="/scheduled-appointments" className="btn-primary" style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}>
              Schedule Appointment
            </Link>
          </div>
        ) : (
          <div className="appointments-list">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-info">
                  <div className="appointment-main">
                    <h3>
                      {appointment.doctor_id?.first_name ? (
                        `Dr. ${appointment.doctor_id.first_name} ${appointment.doctor_id.last_name || ''}`
                      ) : (
                        'Doctor TBA'
                      )}
                    </h3>
                    {appointment.doctor_id?.department_id && (
                      <p className="appointment-department">
                        {appointment.doctor_id.department_id.department_name || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">📅 Date & Time:</span>
                      <span className="detail-value">
                        {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                      </span>
                    </div>
                    {appointment.reason && (
                      <div className="detail-item">
                        <span className="detail-label">📝 Reason:</span>
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
                <Link to="/scheduled-appointments" className="appointment-link">
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>
            🔔 Notifications
            {unreadNotificationCount > 0 && (
              <span className="notification-badge">
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
          <div className="notifications-list">
            {recentNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
              >
                {!notification.is_read && (
                  <span className="unread-dot"></span>
                )}
                <div className="notification-type">
                  {notification.notification_type || 'info'}
                </div>
                <p className="notification-message">
                  {notification.message}
                </p>
                <div className="notification-meta">
                  {notification.user_id?.name || notification.user_id?.email || 'System'} • {formatDateTime(notification.sent_at || notification.createdAt || notification.created_at, '')}
                </div>
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
          <Link to="/scheduled-appointments" className="quick-action-card">
            <div className="quick-action-icon"><SvgIcon name="calendar" size={20} /></div>
            <div className="quick-action-text">Book Appointment</div>
          </Link>
          <Link to="/scheduled-appointments" className="quick-action-card">
            <div className="quick-action-icon"><SvgIcon name="clipboard" size={20} /></div>
            <div className="quick-action-text">My Appointments</div>
          </Link>
          <Link to="/notifications" className="quick-action-card">
            <div className="quick-action-icon"><SvgIcon name="bell" size={20} /></div>
            <div className="quick-action-text">Notifications</div>
          </Link>
          <Link to="/contact-patient" className="quick-action-card">
            <div className="quick-action-icon"><SvgIcon name="chat" size={20} /></div>
            <div className="quick-action-text">Contact Us</div>
          </Link>
        </div>
      </div>

      {/* Health Tips Section */}
      <div className="dashboard-section health-tips-section">
        <div className="section-header">
          <h2>💡 Health Tips</h2>
        </div>
        <div className="health-tips-grid">
          <div className="health-tip-card">
            <div className="tip-icon">🏃</div>
            <h3>Stay Active</h3>
            <p>Regular physical activity helps maintain bone and joint health</p>
          </div>
          <div className="health-tip-card">
            <div className="tip-icon">🥗</div>
            <h3>Eat Healthy</h3>
            <p>A balanced diet rich in calcium and vitamin D supports bone strength</p>
          </div>
          <div className="health-tip-card">
            <div className="tip-icon">💊</div>
            <h3>Take Medications</h3>
            <p>Follow your prescribed medication schedule consistently</p>
          </div>
          <div className="health-tip-card">
            <div className="tip-icon">⏰</div>
            <h3>Regular Checkups</h3>
            <p>Don't skip your scheduled appointments and follow-ups</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;

