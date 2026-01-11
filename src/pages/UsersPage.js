import React, { useState, useEffect, useCallback } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../services/userService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    role: ''
  });
  
  // Available roles (enum values)
  const availableRoles = [
    { value: 'Admin', label: 'Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'PR', label: 'PR' },
    { value: 'user', label: 'User' }
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers(filters);
      // getUsers returns data.data from the API response
      // So response should be the users array directly
      let usersData = Array.isArray(response) ? response : [];
      
      // If response is an object with data property, use that
      if (!Array.isArray(response) && response?.data) {
        usersData = Array.isArray(response.data) ? response.data : [];
      }
      
      // Client-side filtering by role if filter is set
      if (filters.role && usersData.length > 0) {
        usersData = usersData.filter(user => user.role === filters.role);
      }
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.data || err);
      setError(err.message || 'Failed to fetch users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        role: user.role || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare data - clean up and validate with null checks
      const submitData = {
        name: (formData.name || '').trim(),
        email: (formData.email || '').trim().toLowerCase(),
        phone: (formData.phone || '').trim(),
        role: formData.role || ''
      };
      
      // For create, password is required
      if (!editingUser) {
        if (!formData.password || (formData.password || '').trim() === '') {
          setError('Password is required');
          return;
        }
        submitData.password = formData.password;
      } else {
        // For update, only include password if provided
        if (formData.password && formData.password.trim() !== '') {
          submitData.password = formData.password;
        }
      }
      
      // Validate required fields
      if (!submitData.name || submitData.name.length < 2) {
        setError('Name must be at least 2 characters long');
        return;
      }
      
      if (submitData.name.length > 100) {
        setError('Name cannot exceed 100 characters');
        return;
      }
      
      if (!submitData.email || !/^\S+@\S+\.\S+$/.test(submitData.email)) {
        setError('Please provide a valid email address');
        return;
      }
      
      if (!submitData.phone || submitData.phone.trim() === '') {
        setError('Phone number is required');
        return;
      }
      
      if (!submitData.role || submitData.role.trim() === '') {
        setError('Role is required');
        return;
      }
      
      // Validate role enum value
      const validRoles = ['doctor', 'Admin', 'receptionist', 'PR', 'user'];
      if (!validRoles.includes(submitData.role)) {
        setError(`Role must be one of: ${validRoles.join(', ')}`);
        return;
      }
      
      console.log('Submitting user data:', { ...submitData, password: submitData.password ? '***' : 'not provided' });
      
      if (editingUser) {
        await updateUser(editingUser._id, submitData);
        setSuccess('User updated successfully!');
      } else {
        await createUser(submitData);
        setSuccess('User created successfully!');
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      console.error('Error details:', err.data || err);
      
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.error) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          `Failed to save user: ${err.toString()}`;
      setError(errorMessage);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteUser(userId);
      setSuccess('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      const errorMessage = err.message || 
                          (err.data && err.data.message) ||
                          (err.data && err.data.errors && Array.isArray(err.data.errors) 
                            ? err.data.errors.join(', ') 
                            : null) ||
                          'Failed to delete user';
      setError(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>User Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {users.length > 0 && (
            <ReportButton
              data={users}
              entityType="users"
              title="Users Report"
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-role">Filter by Role:</label>
          <select
            id="filter-role"
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
          >
            <option value="">All Roles</option>
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
        
        <button className="btn btn-secondary" onClick={() => setFilters({ role: '' })}>
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

      {/* Users Table */}
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="no-data">No users found</div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                      {user.role || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.updatedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(user._id)}
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
              <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  pattern="^\S+@\S+\.\S+$"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+250123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a role</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
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
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

