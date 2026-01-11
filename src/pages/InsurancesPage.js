import React, { useState, useEffect } from 'react';
import {
  getInsurances,
  getInsurance,
  createInsurance,
  updateInsurance,
  deleteInsurance
} from '../services/insuranceService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './InsurancesPage.css';

const InsurancesPage = () => {
  const [insurances, setInsurances] = useState([]);
  const [allInsurances, setAllInsurances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [formData, setFormData] = useState({
    insurance_name: ''
  });
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch insurances on component mount
  useEffect(() => {
    fetchInsurances();
  }, []);

  // Search insurances when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allInsurances.filter(insurance =>
        insurance.insurance_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setInsurances(filtered);
    } else {
      setInsurances(allInsurances);
    }
  }, [searchQuery, allInsurances]);

  const fetchInsurances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInsurances();
      const insurancesData = response.data || [];
      setAllInsurances(insurancesData);
      setInsurances(insurancesData);
    } catch (err) {
      setError(err);
      console.error('Error fetching insurances:', err);
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

  const handleOpenModal = (insurance = null) => {
    if (insurance) {
      setEditingInsurance(insurance);
      setFormData({
        insurance_name: insurance.insurance_name || ''
      });
    } else {
      setEditingInsurance(null);
      setFormData({
        insurance_name: ''
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInsurance(null);
    setFormData({
      insurance_name: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingInsurance) {
        await updateInsurance(editingInsurance._id, formData);
        setSuccess('Insurance updated successfully!');
      } else {
        await createInsurance(formData);
        setSuccess('Insurance created successfully!');
      }
      
      handleCloseModal();
      fetchInsurances();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (insuranceId) => {
    if (!window.confirm('Are you sure you want to delete this insurance?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await deleteInsurance(insuranceId);
      setSuccess('Insurance deleted successfully!');
      fetchInsurances();
    } catch (err) {
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


  return (
    <div className="insurances-page">
      <div className="insurances-header">
        <h1>Insurance Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {insurances.length > 0 && (
            <ReportButton
              data={insurances}
              entityType="insurances"
              title="Insurances Report"
            />
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Insurance
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-filters-section">
        <div className="search-group">
          <label htmlFor="search">Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search by insurance name..."
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
        
        <button className="btn btn-secondary" onClick={() => {
          setSearchQuery('');
          fetchInsurances();
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

      {/* Insurances Table */}
      {loading ? (
        <div className="loading">Loading insurances...</div>
      ) : insurances.length === 0 ? (
        <div className="no-data">
          {searchQuery ? 'No insurances found matching your search' : 'No insurances found'}
        </div>
      ) : (
        <div className="table-container">
          <table className="insurances-table">
            <thead>
              <tr>
                <th>Insurance Name</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {insurances.map(insurance => (
                <tr key={insurance._id}>
                  <td className="insurance-name">
                    {insurance.insurance_name}
                  </td>
                  <td>{formatDate(insurance.createdAt)}</td>
                  <td>{formatDate(insurance.updatedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleOpenModal(insurance)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(insurance._id)}
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
              <h2>{editingInsurance ? 'Edit Insurance' : 'Create New Insurance'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="insurance_name">Insurance Name *</label>
                <input
                  type="text"
                  id="insurance_name"
                  name="insurance_name"
                  value={formData.insurance_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter insurance name..."
                  minLength={2}
                />
              </div>

              {error && <ErrorDisplay error={error} />}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInsurance ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurancesPage;

