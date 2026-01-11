import React, { useState, useEffect, useCallback } from 'react';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorsByDepartment
} from '../services/doctorService';
import { getDepartments } from '../services/departmentService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './DoctorsPage.css';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    phone: '',
    email: '',
    specialization: '',
    department_id: '',
    status: 'active'
  });
  
  // Filter state
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Departments state for dropdowns
  const [departments, setDepartments] = useState([]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (departmentFilter) {
        response = await getDoctorsByDepartment(departmentFilter);
      } else {
        response = await getDoctors();
      }
      const doctorsData = response.data || [];
      console.log('Fetched doctors:', doctorsData.length, doctorsData);
      setDoctors(doctorsData);
    } catch (err) {
      // Pass the full error object to ErrorDisplay component
      setError(err);
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      // Continue without departments - user can still enter department_id manually if needed
    }
  }, []);

  // Fetch doctors on component mount and when filter changes
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Fetch departments on component mount
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
    setDepartmentFilter(e.target.value);
  };

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        first_name: doctor.first_name || '',
        last_name: doctor.last_name || '',
        gender: doctor.gender || 'male',
        phone: doctor.phone || '',
        email: doctor.email || '',
        specialization: doctor.specialization || '',
        department_id: doctor.department_id._id || doctor.department_id || '',
        status: doctor.status || 'active'
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'male',
        phone: '',
        email: '',
        specialization: '',
        department_id: '',
        status: 'active'
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'male',
      phone: '',
      email: '',
      specialization: '',
      department_id: '',
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
      if (editingDoctor) {
        await updateDoctor(editingDoctor._id, formData);
        setSuccess('Doctor updated successfully!');
      } else {
        await createDoctor(formData);
        setSuccess('Doctor created successfully!');
      }
      
      handleCloseModal();
      // Refresh doctors list after successful create/update
      await fetchDoctors();
    } catch (err) {
      // Pass the full error object to show detailed validation errors
      setError(err);
      console.error('Error creating/updating doctor:', err);
      // If doctor already exists, still refresh the list to show it
      if (err.message && err.message.includes('already exists')) {
        console.log('Doctor already exists, refreshing list...');
        setTimeout(() => {
          fetchDoctors();
        }, 1000);
      }
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteDoctor(doctorId);
      setSuccess('Doctor deleted successfully!');
      fetchDoctors();
    } catch (err) {
      // Pass the full error object to show detailed validation errors
      setError(err);
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

  // Apply department filter to displayed doctors
  const filteredDoctors = departmentFilter
    ? doctors.filter(doctor => {
        const deptId = typeof doctor.department_id === 'object' 
          ? (doctor.department_id._id || doctor.department_id.id)
          : doctor.department_id;
        return deptId === departmentFilter;
      })
    : doctors;
  
  // Debug: Log filtered results
  console.log('Filtered doctors:', {
    total: doctors.length,
    filtered: filteredDoctors.length,
    departmentFilter: departmentFilter || 'none',
    doctors: doctors.map(d => ({
      name: `${d.first_name} ${d.last_name}`,
      email: d.email,
      phone: d.phone,
      department_id: d.department_id,
      department_name: typeof d.department_id === 'object' ? d.department_id.department_name : 'N/A'
    }))
  });

  return (
    <div className="doctors-page">
      <div className="doctors-header">
        <h1>Doctor Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {filteredDoctors.length > 0 && (
            <ReportButton
              data={filteredDoctors}
              entityType="doctors"
              title="Doctors Report"
              filters={{ department_id: departmentFilter }}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Doctor
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-department">Filter by Department:</label>
          <select
            id="filter-department"
            value={departmentFilter}
            onChange={handleFilterChange}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setDepartmentFilter('')}
        >
          Clear Filter
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => fetchDoctors()}
          title="Refresh doctors list"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div>
          <ErrorDisplay error={error} />
          {error.message && typeof error.message === 'string' && error.message.includes('already exists') && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#e7f3ff', borderRadius: '6px', color: '#0066cc' }}>
              <strong>Note:</strong> The doctor exists in the database. Click "Refresh" above to reload the list, or check if a department filter is hiding them.
            </div>
          )}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Doctors Table */}
      {loading ? (
        <div className="loading">Loading doctors...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="no-data">No doctors found</div>
      ) : (
        <div className="table-container">
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map(doctor => (
                <tr key={doctor._id}>
                  <td className="doctor-name">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </td>
                  <td>
                    <span className={`gender-badge gender-${doctor.gender}`}>
                      {doctor.gender}
                    </span>
                  </td>
                  <td>{doctor.specialization || <span className="text-muted">N/A</span>}</td>
                  <td>
                    {doctor.department_id?.department_name || 'N/A'}
                  </td>
                  <td>{doctor.email}</td>
                  <td>{doctor.phone}</td>
                  <td>
                    <span className={`status-badge status-${doctor.status}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td>{formatDate(doctor.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(doctor)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(doctor._id)}
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
              <h2>{editingDoctor ? 'Edit Doctor' : 'Create New Doctor'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                  placeholder="doctor@example.com"
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
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Cardiology, Neurology"
                />
              </div>

              <div className="form-group">
                <label htmlFor="department_id">Department *</label>
                {departments.length > 0 ? (
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
                ) : (
                  <input
                    type="text"
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Department ID"
                  />
                )}
              </div>

              {error && <ErrorDisplay error={error} />}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDoctor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;

