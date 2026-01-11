import React, { useState, useEffect } from 'react';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients
} from '../services/patientService';
import { getInsurances } from '../services/insuranceService';
import { getAppointmentsByDoctor } from '../services/appointmentService';
import { getCurrentDoctorId, isDoctor } from '../utils/doctorUtils';
import { getCurrentUser } from '../services/authService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './PatientsPage.css';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    address: {
      district: '',
      sector: ''
    },
    origin: 'Rwandan',
    insurance: '',
    patient_id: ''
  });
  
  // Insurance list state
  const [insurances, setInsurances] = useState([]);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Fetch patients and insurances on component mount
  useEffect(() => {
    fetchPatients();
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const response = await getInsurances();
      setInsurances(response.data || []);
    } catch (err) {
      console.error('Error fetching insurances:', err);
      // Don't show error to user, just log it - insurance is optional
    }
  };

  // Search patients when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500); // Debounce search by 500ms
      return () => clearTimeout(timeoutId);
    } else {
      fetchPatients();
    }
  }, [searchQuery]);


  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      let patientsData = [];
      
      // If user is a doctor, only fetch patients they have appointments with
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (!doctorId) {
          // If doctor profile not found, show all patients with a warning message
          const currentUser = getCurrentUser();
          console.warn('Doctor profile not found for user:', currentUser);
          // Set a warning (not error) - we'll show it differently
          const warningMsg = `Note: Doctor profile not found for ${currentUser?.email || currentUser?.name || 'your account'}. Showing all patients. Please contact administrator to create a doctor profile linked to your account (${currentUser?.email || 'N/A'}) for better access control.`;
          // Use a success-style alert for warnings (less alarming)
          setError({ message: warningMsg, type: 'warning' });
          // Still show all patients instead of blocking access
          const response = await getPatients();
          patientsData = response.data || [];
        } else {
          try {
            const appointmentsRes = await getAppointmentsByDoctor(doctorId);
            const appointments = appointmentsRes.data || [];
            // Get unique patient IDs from appointments
            const patientIds = new Set(
              appointments.map(apt => {
                const patientId = typeof apt.patient_id === 'object' ? apt.patient_id._id : apt.patient_id;
                return patientId;
              }).filter(Boolean)
            );
            // Fetch all patients and filter by those with appointments
            const allPatientsRes = await getPatients();
            const allPatients = allPatientsRes.data || [];
            patientsData = allPatients.filter(patient => patientIds.has(patient._id));
          } catch (apptError) {
            console.error('Error fetching doctor appointments:', apptError);
            // If we can't fetch appointments, still try to show patients (fallback)
            const response = await getPatients();
            patientsData = response.data || [];
          }
        }
      } else {
        // Admin can see all patients
      const response = await getPatients();
        patientsData = response.data || [];
      }
      
      // Apply gender filter if set
      if (genderFilter) {
        patientsData = patientsData.filter(patient => patient.gender === genderFilter);
      }
      
      setPatients(patientsData);
    } catch (err) {
      // Pass the full error object to ErrorDisplay component
      setError(err);
      console.error('Error fetching patients:', err);
      console.error('Error details:', err.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      fetchPatients();
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      let patientsData = [];
      
      // If user is a doctor, search only among their patients
      if (isDoctor()) {
        const doctorId = await getCurrentDoctorId();
        if (doctorId) {
          const appointmentsRes = await getAppointmentsByDoctor(doctorId);
          const appointments = appointmentsRes.data || [];
          const patientIds = new Set(
            appointments.map(apt => {
              const patientId = typeof apt.patient_id === 'object' ? apt.patient_id._id : apt.patient_id;
              return patientId;
            }).filter(Boolean)
          );
          const searchRes = await searchPatients(query);
          const allSearchResults = searchRes.data || [];
          patientsData = allSearchResults.filter(patient => patientIds.has(patient._id));
        } else {
          setPatients([]);
          setLoading(false);
          return;
        }
      } else {
        // Admin can search all patients
      const response = await searchPatients(query);
        patientsData = response.data || [];
      }
      
      // Apply gender filter if set
      if (genderFilter) {
        patientsData = patientsData.filter(patient => patient.gender === genderFilter);
      }
      
      setPatients(patientsData);
    } catch (err) {
      // Pass the full error object to ErrorDisplay component
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name === 'district' || name === 'sector') {
      setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [name]: value
          }
      }));
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        // Ensure origin always has a value
        if (name === 'origin' && (!value || value.trim() === '')) {
            newData.origin = 'Rwandan';
        }
        return newData;
      });
    }
  };

  const handleFilterChange = (e) => {
    setGenderFilter(e.target.value);
  };

  const handleOpenModal = (patient = null) => {
    if (patient) {
      setEditingPatient(patient);
      // Format date for input field (YYYY-MM-DD)
      const dob = patient.date_of_birth 
        ? new Date(patient.date_of_birth).toISOString().split('T')[0]
        : '';
      
      // Handle nested address structure
      const address = patient.address && typeof patient.address === 'object' 
        ? patient.address 
        : { district: '', sector: '' };
      
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        gender: patient.gender || 'male',
        date_of_birth: dob,
        phone: patient.phone || '',
        email: patient.email || '',
        address: {
          district: address.district || '',
          sector: address.sector || ''
        },
        origin: patient.origin || 'Rwandan',
        insurance: patient.insurance && typeof patient.insurance === 'object' 
          ? patient.insurance._id 
          : (patient.insurance || ''),
        patient_id: patient.patient_id || ''
      });
    } else {
      setEditingPatient(null);
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'male',
        date_of_birth: '',
        phone: '',
        email: '',
        address: {
          district: '',
          sector: ''
        },
        origin: 'Rwandan',
        insurance: '',
        patient_id: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
    
    // Ensure origin is always set after opening modal
    setTimeout(() => {
      setFormData(prev => {
        if (!prev.origin || prev.origin.trim() === '') {
          return { ...prev, origin: 'Rwandan' };
        }
        return prev;
      });
    }, 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'male',
      date_of_birth: '',
      phone: '',
      email: '',
      address: {
        district: '',
        sector: ''
      },
      origin: 'Rwandan',
      insurance: '',
      patient_id: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.first_name || !formData.first_name.trim()) {
        setError('First name is required');
        return;
      }
      if (!formData.last_name || !formData.last_name.trim()) {
        setError('Last name is required');
        return;
      }
      if (!formData.email || !formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.phone || !formData.phone.trim()) {
        setError('Phone number is required');
        return;
      }
      if (!formData.date_of_birth) {
        setError('Date of birth is required');
        return;
      }
      if (!formData.address.district || !formData.address.district.trim()) {
        setError('District is required');
        return;
      }
      if (!formData.address.sector || !formData.address.sector.trim()) {
        setError('Sector is required');
        return;
      }
      // Prepare data for submission
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        address: {
          district: formData.address.district.trim(),
          sector: formData.address.sector.trim()
        },
        origin: formData.origin || 'Rwandan'
      };
      
      // Only include insurance if provided and not empty
      if (formData.insurance && formData.insurance.trim() !== '') {
        submitData.insurance = formData.insurance.trim();
      }
      
      // Only include patient_id if provided (optional - will be auto-generated if not provided)
      if (formData.patient_id && formData.patient_id.trim() !== '') {
        submitData.patient_id = formData.patient_id.trim();
      }
      
      if (editingPatient) {
        await updatePatient(editingPatient._id, submitData);
        setSuccess('Patient updated successfully!');
      } else {
        await createPatient(submitData);
        setSuccess('Patient created successfully!');
      }
      
      handleCloseModal();
      fetchPatients();
    } catch (err) {
      // Pass the full error object to ErrorDisplay component
      console.error('Error creating/updating patient:', err);
      setError(err);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deletePatient(patientId);
      setSuccess('Patient deleted successfully!');
      fetchPatients();
    } catch (err) {
      // Pass the full error object to ErrorDisplay component
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

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Apply gender filter to displayed patients
  const filteredPatients = genderFilter
    ? patients.filter(patient => patient.gender === genderFilter)
    : patients;

  return (
    <div className="patients-page">
      <div className="patients-header">
        <h1>Patient Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {filteredPatients.length > 0 && (
            <ReportButton
              data={filteredPatients}
              entityType="patients"
              title="Patients Report"
              filters={{ gender: genderFilter }}
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Patient
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-group">
          <label htmlFor="search">Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-gender">Gender:</label>
          <select
            id="filter-gender"
            value={genderFilter}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <button className="btn btn-secondary" onClick={() => {
          setSearchQuery('');
          setGenderFilter('');
          fetchPatients();
        }}>
          Clear Filters
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorDisplay error={error} />}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Patients Table */}
      {loading ? (
        <div className="loading">Loading patients...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="no-data">
          {searchQuery ? 'No patients found matching your search' : 'No patients found'}
        </div>
      ) : (
        <div className="table-container">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Date of Birth</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Origin</th>
                <th>Insurance</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#007bff' }}>
                      {patient.patient_id || 'N/A'}
                    </span>
                  </td>
                  <td className="patient-name">
                    {patient.first_name} {patient.last_name}
                  </td>
                  <td>
                    <span className={`gender-badge gender-${patient.gender}`}>
                      {patient.gender}
                    </span>
                  </td>
                  <td>{patient.age || calculateAge(patient.date_of_birth)} years</td>
                  <td>{formatDate(patient.date_of_birth)}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.email}</td>
                  <td className="address-cell">
                    {patient.address && typeof patient.address === 'object' ? (
                      <>
                        {patient.address.district && <div>{patient.address.district}</div>}
                        {patient.address.sector && <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{patient.address.sector}</div>}
                        {!patient.address.district && !patient.address.sector && <span className="text-muted">N/A</span>}
                      </>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    <span className={`origin-badge origin-${patient.origin?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                      {patient.origin || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {patient.insurance && typeof patient.insurance === 'object' 
                      ? patient.insurance.insurance_name || 'N/A'
                      : 'N/A'}
                  </td>
                  <td>{formatDate(patient.createdAt || patient.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(patient)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(patient._id)}
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
              <h2>{editingPatient ? 'Edit Patient' : 'Create New Patient'}</h2>
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
                  <label htmlFor="date_of_birth">Date of Birth *</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
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
                  placeholder="e.g., +1234567890"
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
                  placeholder="patient@example.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="district">District *</label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter district..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sector">Sector *</label>
                  <input
                    type="text"
                    id="sector"
                    name="sector"
                    value={formData.address.sector}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter sector..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="origin">Origin *</label>
                  <select
                    id="origin"
                    name="origin"
                    value={formData.origin || 'Rwandan'}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Rwandan">Rwandan</option>
                    <option value="East Africa">East Africa</option>
                    <option value="African">African</option>
                    <option value="Rest of the World">Rest of the World</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="insurance">Insurance</label>
                  <select
                    id="insurance"
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleInputChange}
                  >
                    <option value="">None</option>
                    {insurances.map(insurance => (
                      <option key={insurance._id} value={insurance._id}>
                        {insurance.insurance_name || insurance.name || insurance._id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="patient_id">Patient ID</label>
                <input
                  type="text"
                  id="patient_id"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  placeholder="e.g., PAT-000001"
                  disabled={!editingPatient}
                  style={{
                    backgroundColor: editingPatient ? 'white' : '#f5f5f5',
                    cursor: editingPatient ? 'text' : 'not-allowed'
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  Patient ID is auto-generated, but you can edit it here when updating a patient.
                </small>
              </div>

              {error && <ErrorDisplay error={error} />}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPatient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;

