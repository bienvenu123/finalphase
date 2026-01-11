import React, { useState, useEffect, useCallback } from 'react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../services/departmentService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './DepartmentsPage.css';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    status: 'active'
  });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDepartments();
      let departmentsData = response.data || [];
      
      // Apply status filter if set
      if (statusFilter) {
        departmentsData = departmentsData.filter(dept => dept.status === statusFilter);
      }
      
      setDepartments(departmentsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch departments on component mount and when filter changes
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        department_name: department.department_name || '',
        description: department.description || '',
        status: department.status || 'active'
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        department_name: '',
        description: '',
        status: 'active'
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      department_name: '',
      description: '',
      status: 'active'
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment._id, formData);
        setSuccess('Department updated successfully!');
      } else {
        await createDepartment(formData);
        setSuccess('Department created successfully!');
      }
      
      handleCloseModal();
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to save department');
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteDepartment(departmentId);
      setSuccess('Department deleted successfully!');
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to delete department');
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

  // Apply status filter to displayed departments
  const filteredDepartments = statusFilter
    ? departments.filter(dept => dept.status === statusFilter)
    : departments;

  return (
    <div className="departments-page">
      <div className="departments-header">
        <h1>Department Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {filteredDepartments.length > 0 && (
            <ReportButton
              data={filteredDepartments}
              entityType="departments"
              title="Departments Report"
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Department
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-status">Status:</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setStatusFilter('')}
        >
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

      {/* Departments Table */}
      {loading ? (
        <div className="loading">Loading departments...</div>
      ) : filteredDepartments.length === 0 ? (
        <div className="no-data">No departments found</div>
      ) : (
        <div className="table-container">
          <table className="departments-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map(department => (
                <tr key={department._id}>
                  <td className="department-name">{department.department_name}</td>
                  <td className="department-description">
                    {department.description || <span className="text-muted">No description</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${department.status}`}>
                      {department.status}
                    </span>
                  </td>
                  <td>{formatDate(department.createdAt)}</td>
                  <td>{formatDate(department.updatedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(department)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(department._id)}
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
              <h2>{editingDepartment ? 'Edit Department' : 'Create New Department'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="department_name">Department Name *</label>
                <input
                  type="text"
                  id="department_name"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Cardiology, Emergency, Pediatrics"
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
                  placeholder="Enter department description..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;

