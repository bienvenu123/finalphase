import React, { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead
} from '../services/notificationService';
import { getUsers } from '../services/userService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    message: '',
    notification_type: 'info',
    sent_at: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    user_id: '',
    notification_type: '',
    is_read: ''
  });
  
  // Users state for dropdowns
  const [users, setUsers] = useState([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications(filters);
      setNotifications(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await getUsers();
      // getUsers() returns the users array directly (data.data from API)
      // Handle both array and object with data property
      const usersArray = Array.isArray(usersData) 
        ? usersData 
        : (usersData?.data || []);
      setUsers(usersArray);
      console.log('✅ Loaded users for notification:', usersArray.length);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      setUsers([]);
    }
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch notifications on component mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const handleOpenModal = (notification = null) => {
    if (notification) {
      setEditingNotification(notification);
      const sentAt = notification.sent_at 
        ? new Date(notification.sent_at).toISOString().slice(0, 16)
        : '';
      setFormData({
        user_id: notification.user_id._id || notification.user_id || '',
        message: notification.message || '',
        notification_type: notification.notification_type || 'info',
        sent_at: sentAt
      });
    } else {
      setEditingNotification(null);
      setFormData({
        user_id: '',
        message: '',
        notification_type: 'info',
        sent_at: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNotification(null);
    setFormData({
      user_id: '',
      message: '',
      notification_type: 'info',
      sent_at: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const submitData = { ...formData };
      // Only include sent_at if provided
      if (!submitData.sent_at) {
        delete submitData.sent_at;
      } else {
        // Convert to ISO string
        submitData.sent_at = new Date(submitData.sent_at).toISOString();
      }
      
      if (editingNotification) {
        await updateNotification(editingNotification._id, submitData);
        setSuccess('Notification updated successfully!');
      } else {
        await createNotification(submitData);
        setSuccess('Notification created successfully!');
      }
      
      handleCloseModal();
      fetchNotifications();
    } catch (err) {
      setError(err.message || 'Failed to save notification');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteNotification(notificationId);
      setSuccess('Notification deleted successfully!');
      fetchNotifications();
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setSuccess('Notification marked as read!');
      fetchNotifications();
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async (userId) => {
    if (!userId) {
      setError('Please select a user first');
      return;
    }
    
    try {
      const response = await markAllAsRead(userId);
      setSuccess(response.message || 'All notifications marked as read!');
      fetchNotifications();
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
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

  const getNotificationTypeClass = (type) => {
    return `notification-type-${type}`;
  };

  const notificationTypes = [
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'system', label: 'System' }
  ];

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notification Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {notifications.length > 0 && (
            <ReportButton
              data={notifications}
              entityType="notifications"
              title="Notifications Report"
              filters={filters}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create Notification
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-user">User:</label>
          <select
            id="filter-user"
            name="user_id"
            value={filters.user_id}
            onChange={handleFilterChange}
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-type">Type:</label>
          <select
            id="filter-type"
            name="notification_type"
            value={filters.notification_type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {notificationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-read">Read Status:</label>
          <select
            id="filter-read"
            name="is_read"
            value={filters.is_read}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
        
        <div className="filter-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setFilters({ user_id: '', notification_type: '', is_read: '' })}
          >
            Clear Filters
          </button>
          {filters.user_id && (
            <button 
              className="btn btn-info" 
              onClick={() => handleMarkAllAsRead(filters.user_id)}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="no-data">No notifications found</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''} ${getNotificationTypeClass(notification.notification_type)}`}
            >
              <div className="notification-content">
                <div className="notification-header">
                  <div className="notification-meta">
                    <span className="notification-type-badge">
                      {notification.notification_type}
                    </span>
                    <span className="notification-user">
                      {notification.user_id?.name || notification.user_id?.username || notification.user_id?.email || 'Unknown User'}
                    </span>
                    <span className="notification-date">
                      {formatDate(notification.sent_at)}
                    </span>
                    {!notification.is_read && (
                      <span className="unread-badge">Unread</span>
                    )}
                  </div>
                </div>
                <div className="notification-message">
                  {notification.message}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="btn btn-sm btn-mark-read"
                    onClick={() => handleMarkAsRead(notification._id)}
                    title="Mark as read"
                  >
                    ✓ Read
                  </button>
                )}
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() => handleOpenModal(notification)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(notification._id)}
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
              <h2>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user_id">User *</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.username || user.email || `User ${user._id?.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter notification message..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="notification_type">Notification Type *</label>
                <select
                  id="notification_type"
                  name="notification_type"
                  value={formData.notification_type}
                  onChange={handleInputChange}
                  required
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sent_at">Sent At (optional)</label>
                <input
                  type="datetime-local"
                  id="sent_at"
                  name="sent_at"
                  value={formData.sent_at}
                  onChange={handleInputChange}
                />
                <small className="form-hint">Leave empty to use current time</small>
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
                  {editingNotification ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

