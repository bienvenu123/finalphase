import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getPatients } from '../services/patientService';
import { getAppointments } from '../services/appointmentService';
import { getNotificationsByUser } from '../services/notificationService';
import { getContacts } from '../services/contactService';
import HospitalLogo from '../components/HospitalLogo';
import ErrorDisplay from '../components/ErrorDisplay';
import './PRDashboardPage.css';

const PRDashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalMessages: 0,
    pendingMessages: 0,
    appointments: 0,
    patients: 0,
    notifications: 0
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPRDashboardData();
  }, []);

  const fetchPRDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const user = getCurrentUser();
      setCurrentUser(user);

      // Fetch all statistics in parallel
      const [
        patientsRes,
        appointmentsRes,
        contactsRes,
        notificationsRes
      ] = await Promise.all([
        getPatients().catch(() => ({ data: [] })),
        getAppointments().catch(() => ({ data: [] })),
        getContacts().catch(() => ({ data: [] })),
        user ? getNotificationsByUser(user._id || user.id).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const contacts = contactsRes.data || [];
      const pendingContacts = contacts.filter(c => c.status === 'pending' || !c.status);

      setStats({
        totalMessages: contacts.length,
        pendingMessages: pendingContacts.length,
        appointments: appointmentsRes.data?.length || 0,
        patients: patientsRes.data?.length || 0,
        notifications: notificationsRes.data?.length || 0
      });

      // Get recent messages (last 5)
      if (contacts.length > 0) {
        const recent = contacts
          .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
          .slice(0, 5);
        setRecentMessages(recent);
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
      setError(err.message || 'Failed to load PR dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      responded: 'status-confirmed',
      resolved: 'status-completed',
      closed: 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  };

  const statCards = [
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      icon: '💬',
      color: 'blue',
      link: '/contacts'
    },
    {
      title: 'Pending Messages',
      value: stats.pendingMessages,
      icon: '⏳',
      color: 'orange',
      link: '/contacts'
    },
    {
      title: 'Total Patients',
      value: stats.patients,
      icon: '🏥',
      color: 'green',
      link: '/patients'
    },
    {
      title: 'Appointments',
      value: stats.appointments,
      icon: '📋',
      color: 'purple',
      link: '/appointments'
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
      <div className="pr-dashboard-page">
        <div className="loading">Loading PR dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-dashboard-page">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="pr-dashboard-page">
      {/* Hospital Header */}
      <div className="hospital-header">
        <div className="hospital-info">
          <h1 className="hospital-name">KIGALI ORTHOPAEDIC SPECIALIZED HOSPITAL</h1>
          <p className="hospital-subtitle">Public Relations Dashboard</p>
        </div>
        <div className="hospital-logo">
          <HospitalLogo size="xlarge" shape="circle" />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>👋 Welcome, {currentUser?.name || 'PR Officer'}</h2>
        <p>Manage patient communications and public relations activities</p>
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

      {/* Recent Contact Messages Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>💬 Recent Contact Messages</h2>
          <Link to="/contacts" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {recentMessages.length === 0 ? (
          <div className="no-data-card">
            <svg className="no-data-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
            </svg>
            <p>No contact messages found</p>
          </div>
        ) : (
          <div className="messages-list">
            {recentMessages.map((message) => (
              <div key={message._id} className="message-card">
                <div className="message-info">
                  <div className="message-main">
                    <h3>{message.name || 'Anonymous'}</h3>
                    <p className="message-contact">
                      {message.email || 'N/A'} • {message.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="message-details">
                    <div className="detail-item">
                      <span className="detail-label">Subject:</span>
                      <span className="detail-value">{message.subject || 'No subject'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Message:</span>
                      <span className="detail-value">
                        {message.message?.substring(0, 100)}
                        {message.message?.length > 100 ? '...' : ''}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${getStatusBadgeClass(message.status || 'pending')}`}>
                        {message.status || 'pending'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDateTime(message.createdAt || message.created_at)}</span>
                    </div>
                  </div>
                </div>
                <Link to="/contacts" className="message-link">
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
                  {notification.user_id?.name || notification.user_id?.email || 'System'} • {formatDateTime(notification.sent_at || notification.createdAt || notification.created_at)}
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
          <Link to="/contacts" className="quick-action-card">
            <div className="quick-action-icon">💬</div>
            <div className="quick-action-text">View Messages</div>
          </Link>
          <Link to="/patients" className="quick-action-card">
            <div className="quick-action-icon">🏥</div>
            <div className="quick-action-text">View Patients</div>
          </Link>
          <Link to="/appointments" className="quick-action-card">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-text">View Appointments</div>
          </Link>
          <Link to="/notifications" className="quick-action-card">
            <div className="quick-action-icon">🔔</div>
            <div className="quick-action-text">Notifications</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PRDashboardPage;

