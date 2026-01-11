import React from 'react';
import './ErrorDisplay.css';

/**
 * ErrorDisplay Component
 * Displays error messages in a user-friendly format
 * Handles both simple error strings and validation error arrays
 */
const ErrorDisplay = ({ error, className = '' }) => {
  if (!error) return null;

  // If error is a string, display it directly
  if (typeof error === 'string') {
    return (
      <div className={`alert alert-error ${className}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  // If error is an object with type 'warning', show as warning
  if (error.type === 'warning') {
    return (
      <div className={`alert alert-warning ${className}`}>
        <div className="error-icon">ℹ️</div>
        <div className="error-content">
          <strong>Note:</strong> {error.message || error}
        </div>
      </div>
    );
  }

  // If error is an object with message
  if (error.message) {
    // Check if there are validation errors in the data (backend format: { success: false, message: 'Validation error', errors: [...] })
    if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
      return (
        <div className={`alert alert-error alert-validation ${className}`}>
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong>{error.data.message || 'Validation Error'}:</strong>
            <ul className="error-list">
              {error.data.errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // Check if error.data has a message (for single error messages from backend)
    if (error.data && error.data.message) {
      return (
        <div className={`alert alert-error ${className}`}>
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong>Error:</strong> {error.data.message}
            {error.data.errors && Array.isArray(error.data.errors) && error.data.errors.length > 0 && (
              <ul className="error-list">
                {error.data.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    // Display the error message
    return (
      <div className={`alert alert-error ${className}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <strong>Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  // If error is an array
  if (Array.isArray(error)) {
    return (
      <div className={`alert alert-error alert-validation ${className}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <strong>Validation Errors:</strong>
          <ul className="error-list">
            {error.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Fallback for any other error format
  return (
    <div className={`alert alert-error ${className}`}>
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <strong>Error:</strong> {JSON.stringify(error)}
      </div>
    </div>
  );
};

export default ErrorDisplay;

