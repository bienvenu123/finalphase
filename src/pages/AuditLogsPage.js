import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuditLogs, getAuditLogsByUser, getAuditLogsByEntityType, testAuditLogsConnection } from '../services/auditLogService';
import { getUsers } from '../services/userService';
import ErrorDisplay from '../components/ErrorDisplay';
import './AuditLogsPage.css';

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const monitoringIntervalRef = useRef(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    user_id: '',
    action_type: '',
    entity_type: '',
    start_date: '',
    end_date: ''
  });
  
  // Dropdown data
  const [users, setUsers] = useState([]);
  
  // Available action types
  const actionTypes = [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' }
  ];
  
  // Available entity types
  const entityTypes = [
    { value: 'user', label: 'User' },
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'department', label: 'Department' },
    { value: 'schedule', label: 'Schedule' },
    { value: 'medical_record', label: 'Medical Record' },
    { value: 'notification', label: 'Notification' }
  ];

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      const usersData = Array.isArray(response) ? response : (response?.data || []);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Test endpoint connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testAuditLogsConnection();
      if (isConnected) {
        console.log('✅ Audit logs endpoint is available and responding');
      } else {
        console.warn('⚠️ Audit logs endpoint test failed - check backend connection');
      }
    };
    
    // Run test after a short delay to avoid interfering with main fetch
    const timer = setTimeout(testConnection, 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If specific filters are set, use specialized endpoints
      if (filters.user_id && !filters.action_type && !filters.entity_type && !filters.start_date && !filters.end_date) {
        response = await getAuditLogsByUser(filters.user_id);
      } else if (filters.entity_type && !filters.user_id && !filters.action_type && !filters.start_date && !filters.end_date) {
        response = await getAuditLogsByEntityType(filters.entity_type);
      } else {
        // Use general endpoint with filters
        response = await getAuditLogs(filters);
      }
      
      // Backend returns { success: true, data: [...], count, total, ... }
      // Handle both old format (array) and new format (object with data property)
      let logsData = [];
      if (Array.isArray(response)) {
        logsData = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        logsData = response.data;
        console.log(`✅ Successfully loaded ${logsData.length} audit logs (Total: ${response.total || logsData.length})`);
      } else if (response && Array.isArray(response.data)) {
        logsData = response.data;
      } else if (Array.isArray(response)) {
        logsData = response;
      }
      
      setAuditLogs(logsData);
      setLastUpdate(new Date());
      
      // Clear any previous errors if we successfully loaded data
      if (logsData.length > 0) {
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        name: err.name,
        stack: err.stack
      });
      
      // Provide user-friendly error message
      const errorMessage = err.message || 'Failed to fetch audit logs';
      
      // Check for endpoint not available (network error or endpoint not found)
      if (errorMessage === 'ENDPOINT_NOT_AVAILABLE' || 
          errorMessage === 'ENDPOINT_NOT_FOUND' || 
          err.status === 404 || 
          err.status === 0 ||
          errorMessage.includes('ENDPOINT_NOT_FOUND') ||
          errorMessage.includes('ENDPOINT_NOT_AVAILABLE') ||
          errorMessage.includes('JSON') || 
          errorMessage.includes('invalid response') || 
          errorMessage.includes('not available') ||
          errorMessage.includes('Failed to fetch') ||
          err.name === 'TypeError') {
        // Set a special flag for endpoint not available
        setError('ENDPOINT_NOT_AVAILABLE');
      } else if (errorMessage.includes('Network error') || errorMessage.includes('Unable to connect')) {
        // Network/connection error
        setError('ENDPOINT_NOT_AVAILABLE');
      } else {
        setError(errorMessage);
      }
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Real-time monitoring effect
  useEffect(() => {
    if (!isMonitoring) {
      // Clear interval when monitoring is disabled
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      return;
    }

    // Fetch logs every 5 seconds when monitoring is enabled
    monitoringIntervalRef.current = setInterval(() => {
      fetchAuditLogs();
    }, 5000);

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonitoring]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: '',
      action_type: '',
      entity_type: '',
      start_date: '',
      end_date: ''
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getActionClass = (action) => {
    const actionMap = {
      create: 'action-create',
      update: 'action-update',
      delete: 'action-delete',
      view: 'action-view',
      login: 'action-login',
      logout: 'action-logout'
    };
    return actionMap[action?.toLowerCase()] || 'action-default';
  };

  const getUserName = (user) => {
    if (!user) return 'N/A';
    if (typeof user === 'object') {
      // Handle populated user object from backend
      if (user.name) return user.name;
      if (user.email) return user.email;
      if (user._id) return `User ${user._id.substring(0, 8)}`;
      return 'N/A';
    }
    return user;
  };

  const hasActiveFilters = () => {
    return filters.user_id || filters.action_type || filters.entity_type || filters.start_date || filters.end_date;
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address'],
      ...auditLogs.map(log => [
        formatDateTime(log.timestamp || log.createdAt || log.created_at),
        getUserName(log.user_id || log.user),
        log.action_type || log.action || 'N/A',
        log.entity_type || log.entity || 'N/A',
        log.entity_id ? (log.entity_id._id || log.entity_id) : 'N/A',
        log.description || log.message || log.details || 'N/A',
        log.ip_address || log.ip || 'N/A'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter logs by search query
  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const user = getUserName(log.user_id || log.user).toLowerCase();
    const action = (log.action_type || log.action || '').toLowerCase();
    const entity = (log.entity_type || log.entity || '').toLowerCase();
    const description = (log.description || log.message || log.details || '').toLowerCase();
    const ip = (log.ip_address || log.ip || '').toLowerCase();
    
    return user.includes(query) || 
           action.includes(query) || 
           entity.includes(query) || 
           description.includes(query) ||
           ip.includes(query);
  });

  return (
    <div className="audit-logs-page">
      <div className="audit-logs-header">
        <div className="header-content">
          <div>
            <h1>Audit Logs Monitor</h1>
            <p className="page-subtitle">Track all system activities and changes in real-time</p>
            {lastUpdate && (
              <p className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
                {isMonitoring && <span className="monitoring-indicator">● Live</span>}
              </p>
            )}
          </div>
          <div className="header-actions">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button 
              className={`btn btn-monitor ${isMonitoring ? 'monitoring-active' : ''}`}
              onClick={toggleMonitoring}
            >
              <svg className="monitor-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {isMonitoring ? (
                  <path d="M6 6H18V18H6V6ZM4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M15 10L11 14L9 12M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
              <span>{isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
            </button>
            <button className="btn btn-export" onClick={handleExport}>
              <svg className="export-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
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
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-action">Action Type:</label>
            <select
              id="filter-action"
              name="action_type"
              value={filters.action_type}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-entity">Entity Type:</label>
            <select
              id="filter-entity"
              name="entity_type"
              value={filters.entity_type}
              onChange={handleFilterChange}
            >
              <option value="">All Entities</option>
              {entityTypes.map(entity => (
                <option key={entity.value} value={entity.value}>
                  {entity.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-start-date">Start Date:</label>
            <input
              type="date"
              id="filter-start-date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-end-date">End Date:</label>
            <input
              type="date"
              id="filter-end-date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        {hasActiveFilters() && (
          <button className="btn btn-secondary btn-clear-filters" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && error !== 'ENDPOINT_NOT_AVAILABLE' && <ErrorDisplay error={error} />}
      
      {/* Endpoint Not Available Message */}
      {error === 'ENDPOINT_NOT_AVAILABLE' && (
        <div className="endpoint-not-available">
          <div className="endpoint-message-card">
            <svg className="endpoint-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            <h2>Audit Logs Endpoint Not Available</h2>
            <p>The audit logs API endpoint is not yet implemented in the backend.</p>
            <div className="endpoint-info">
              <p><strong>Expected Endpoints:</strong></p>
              <ul>
                <li><code>GET /api/audit-logs</code> - Get all audit logs</li>
                <li><code>GET /api/audit-logs/user/:userId</code> - Get logs by user</li>
                <li><code>GET /api/audit-logs/entity/:entityType</code> - Get logs by entity type</li>
              </ul>
              <p className="endpoint-note">
                Once the backend endpoints are implemented, the audit logs will automatically appear here.
                The monitoring features will be available once the API is ready.
              </p>
              <div className="endpoint-troubleshoot">
                <p><strong>Troubleshooting Steps:</strong></p>
                <ol>
                  <li>Ensure your backend server is running on <code>http://localhost:5000</code></li>
                  <li>Verify the routes are registered in your main app file:
                    <pre className="code-block">const auditLogRoutes = require('./routes/auditLogRoutes');
app.use('/api/audit-logs', auditLogRoutes);</pre>
                  </li>
                  <li>Test the endpoint directly in your browser or Postman:
                    <pre className="code-block">GET http://localhost:5000/api/audit-logs</pre>
                  </li>
                  <li>Check browser console (F12) for detailed error messages</li>
                  <li>Verify CORS is configured to allow requests from your frontend origin</li>
                  <li>Check that your route file exports the router correctly</li>
                </ol>
                <p className="endpoint-debug">
                  <strong>Debug Info:</strong> Open browser console (F12) to see detailed request/response information.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      {loading ? (
        <div className="loading">
          <svg className="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12H20C20 7.58 16.42 4 12 4Z" fill="currentColor"/>
          </svg>
          <span>Loading audit logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="no-data">
          <svg className="no-data-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM17 10H7V12H17V10ZM15 14H7V16H15V14Z" fill="currentColor"/>
          </svg>
          <p>
            {searchQuery 
              ? 'No audit logs found matching your search query' 
              : hasActiveFilters() 
                ? 'No audit logs found matching your filters' 
                : 'No audit logs found'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header-info">
            <span className="log-count">Showing {filteredLogs.length} of {auditLogs.length} logs</span>
          </div>
          <table className="audit-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log._id}>
                  <td className="timestamp-cell">
                    {formatDateTime(log.timestamp || log.createdAt || log.created_at || log.updatedAt)}
                  </td>
                  <td className="user-cell">
                    {getUserName(log.user_id || log.user)}
                  </td>
                  <td>
                    <span className={`action-badge ${getActionClass(log.action_type || log.action)}`}>
                      {(log.action_type || log.action || 'N/A').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="entity-badge">
                      {(log.entity_type || log.entity || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="entity-id-cell">
                    {log.entity_id ? (
                      typeof log.entity_id === 'object' 
                        ? (log.entity_id._id || log.entity_id.id || JSON.stringify(log.entity_id)).substring(0, 8) + '...'
                        : String(log.entity_id).substring(0, 8) + '...'
                    ) : 'N/A'}
                  </td>
                  <td className="description-cell">
                    {log.description || log.message || log.details || 'N/A'}
                  </td>
                  <td className="ip-cell">
                    {log.ip_address || log.ip || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;

