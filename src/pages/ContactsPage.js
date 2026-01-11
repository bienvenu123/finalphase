import React, { useState, useEffect, useCallback } from 'react';
import { getContacts, deleteContact } from '../services/contactService';
import ErrorDisplay from '../components/ErrorDisplay';
import ReportButton from '../components/ReportButton';
import './ContactsPage.css';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    serviceInterest: '',
    status: ''
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getContacts();
      let contactsData = response.data || [];
      
      // Apply filters
      if (filters.serviceInterest) {
        contactsData = contactsData.filter(contact => 
          contact.serviceInterest === filters.serviceInterest
        );
      }
      
      setContacts(contactsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters.serviceInterest]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) {
      return;
    }

    try {
      await deleteContact(id);
      setSuccess('Contact message deleted successfully');
      fetchContacts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const serviceOptions = [
    'Trauma Orthopaedics',
    'Sports Orthopaedics',
    'Arthroplasty',
    'Pediatric Orthopaedics',
    'Foot and Ankle',
    'Tumor and Sepsis',
    'Other'
  ];

  return (
    <div className="contacts-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Contact Messages</h1>
          {contacts.length > 0 && (
            <ReportButton
              data={contacts}
              entityType="contacts"
              title="Contact Messages Report"
              filters={filters}
            />
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <ErrorDisplay error={error} />
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="serviceInterest">Filter by Service Interest</label>
            <select
              id="serviceInterest"
              name="serviceInterest"
              value={filters.serviceInterest}
              onChange={handleFilterChange}
            >
              <option value="">All Services</option>
              {serviceOptions.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        {loading ? (
          <div className="loading">Loading contact messages...</div>
        ) : contacts.length === 0 ? (
          <div className="no-data">No contact messages found</div>
        ) : (
          <div className="table-container">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subject</th>
                  <th>Service Interest</th>
                  <th>Message</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => (
                  <tr key={contact._id}>
                    <td className="contact-name">{contact.fullName}</td>
                    <td className="contact-email">{contact.email}</td>
                    <td>{contact.phoneNumber || <span className="text-muted">N/A</span>}</td>
                    <td className="contact-subject">{contact.subject}</td>
                    <td>
                      <span className="service-badge">{contact.serviceInterest}</span>
                    </td>
                    <td className="contact-message">
                      <div className="message-preview">
                        {contact.message.length > 100 
                          ? `${contact.message.substring(0, 100)}...` 
                          : contact.message}
                      </div>
                      {contact.message.length > 100 && (
                        <button 
                          className="btn-view-full"
                          onClick={() => {
                            alert(contact.message);
                          }}
                        >
                          View Full
                        </button>
                      )}
                    </td>
                    <td>{formatDate(contact.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(contact._id)}
                          title="Delete message"
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
      </div>
    </div>
  );
};

export default ContactsPage;

