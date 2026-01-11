import React, { useState, useEffect } from 'react';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../services/roleService';
import ErrorDisplay from '../components/ErrorDisplay';
import './RolesPage.css';

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    role_name: '',
    description: ''
  });

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRoles();
      setRoles(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        role_name: role.role_name,
        description: role.description || ''
      });
    } else {
      setEditingRole(null);
      setFormData({
        role_name: '',
        description: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      role_name: '',
      description: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingRole) {
        await updateRole(editingRole._id, formData);
        setSuccess('Role updated successfully!');
      } else {
        await createRole(formData);
        setSuccess('Role created successfully!');
      }
      
      handleCloseModal();
      fetchRoles();
    } catch (err) {
      setError(err.message || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteRole(roleId);
      setSuccess('Role deleted successfully!');
      fetchRoles();
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="roles-page">
      <div className="roles-header">
        <h1>Role Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add New Role
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Roles Table */}
      {loading ? (
        <div className="loading">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="no-data">No roles found</div>
      ) : (
        <div className="table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role._id}>
                  <td className="role-name">{role.role_name}</td>
                  <td className="role-description">
                    {role.description || <span className="text-muted">No description</span>}
                  </td>
                  <td>{formatDate(role.createdAt)}</td>
                  <td>{formatDate(role.updatedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(role)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(role._id)}
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
              <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="role_name">Role Name *</label>
                <input
                  type="text"
                  id="role_name"
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Admin, Doctor, Nurse"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter role description..."
                />
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
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;

