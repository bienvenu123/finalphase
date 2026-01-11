/**
 * Report Service
 * Handles data export and report generation (CSV, PDF, Excel)
 */

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects { key, label }
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = getNestedValue(row, header.key);
      // Escape commas and quotes in CSV
      const stringValue = value === null || value === undefined ? '' : String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'patient.name')
 * @returns {any} Value or empty string
 */
const getNestedValue = (obj, path) => {
  if (!path) return '';
  
  // Check if processed value already exists (from processDataForReport)
  if (obj[path] !== undefined) {
    return obj[path];
  }
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Handle MongoDB populated fields
      if (value._id && value[key] !== undefined) {
        value = value[key];
      } else if (value[key] !== undefined) {
        value = value[key];
      } else {
        return '';
      }
    } else {
      return '';
    }
  }
  
  return value !== null && value !== undefined ? value : '';
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename = 'report.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Generate PDF report using browser print functionality
 * @param {string} title - Report title
 * @param {Array} data - Data array
 * @param {Array} headers - Header configuration
 * @param {Object} filters - Applied filters
 */
export const generatePDF = (title, data, headers, filters = {}) => {
  // Create a new window with the report content
  const printWindow = window.open('', '_blank');
  
  const filterText = Object.entries(filters)
    .filter(([key, value]) => value && value !== '')
    .map(([key, value]) => {
      // Format date filters nicely
      if (key === 'dateFrom' || key === 'dateTo') {
        try {
          return `${key === 'dateFrom' ? 'From' : 'To'}: ${new Date(value).toLocaleDateString()}`;
        } catch {
          return `${key}: ${value}`;
        }
      }
      return `${key}: ${value}`;
    })
    .join(', ');
  
  const tableRows = data.map(row => {
    const cells = headers.map(header => {
      const value = getNestedValue(row, header.key);
      return `<td>${value || ''}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const headerCells = headers.map(h => `<th>${h.label}</th>`).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
        }
        .report-info {
          margin: 20px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="report-info">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        ${filterText ? `<p><strong>Filters:</strong> ${filterText}</p>` : ''}
        <p><strong>Total Records:</strong> ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        <p>Hospital Management System - ${new Date().getFullYear()}</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};

/**
 * Generate Excel file (CSV format with .xls extension for Excel compatibility)
 * @param {Array} data - Data array
 * @param {Array} headers - Header configuration
 * @param {string} filename - Filename
 */
export const generateExcel = (data, headers, filename = 'report.xls') => {
  const csvContent = convertToCSV(data, headers);
  const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return String(date);
  }
};

/**
 * Format datetime for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return String(date);
  }
};

/**
 * Get report headers for different entity types
 */
export const getReportHeaders = {
  appointments: [
    { key: 'patient_id.first_name', label: 'Patient First Name' },
    { key: 'patient_id.last_name', label: 'Patient Last Name' },
    { key: 'doctor_id.first_name', label: 'Doctor First Name' },
    { key: 'doctor_id.last_name', label: 'Doctor Last Name' },
    { key: 'appointment_date', label: 'Date' },
    { key: 'appointment_time', label: 'Time' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' },
    { key: 'createdAt', label: 'Created At' }
  ],
  patients: [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'createdAt', label: 'Created At' }
  ],
  doctors: [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'department_id.name', label: 'Department' },
    { key: 'license_number', label: 'License Number' },
    { key: 'createdAt', label: 'Created At' }
  ],
  medicalRecords: [
    { key: 'patient_id.first_name', label: 'Patient First Name' },
    { key: 'patient_id.last_name', label: 'Patient Last Name' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'treatment_notes', label: 'Treatment Notes' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' }
  ],
  users: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'createdAt', label: 'Created At' }
  ],
  departments: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At' }
  ],
  notifications: [
    { key: 'user_id.name', label: 'User Name' },
    { key: 'message', label: 'Message' },
    { key: 'notification_type', label: 'Type' },
    { key: 'is_read', label: 'Read' },
    { key: 'sent_at', label: 'Sent At' }
  ],
  doctorSchedules: [
    { key: 'doctor_id.first_name', label: 'Doctor First Name' },
    { key: 'doctor_id.last_name', label: 'Doctor Last Name' },
    { key: 'day_of_week', label: 'Day of Week' },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    { key: 'is_available', label: 'Available' },
    { key: 'createdAt', label: 'Created At' }
  ],
  auditLogs: [
    { key: 'user_id.name', label: 'User Name' },
    { key: 'action_type', label: 'Action Type' },
    { key: 'entity_type', label: 'Entity Type' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At' }
  ],
  contacts: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject' },
    { key: 'message', label: 'Message' },
    { key: 'createdAt', label: 'Created At' }
  ],
  appointmentChanges: [
    { key: 'appointment_id._id', label: 'Appointment ID' },
    { key: 'appointment_id.appointment_date', label: 'Appointment Date' },
    { key: 'appointment_id.appointment_time', label: 'Appointment Time' },
    { key: 'change_type', label: 'Change Type' },
    { key: 'reason', label: 'Reason' },
    { key: 'changed_at', label: 'Changed At' },
    { key: 'createdAt', label: 'Created At' }
  ]
};

/**
 * Process data for report (format dates, handle nested objects)
 * @param {Array} data - Raw data array
 * @param {string} entityType - Type of entity
 * @returns {Array} Processed data array
 */
export const processDataForReport = (data, entityType) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => {
    const processed = { ...item };
    
    // Format dates
    if (processed.appointment_date) {
      processed.appointment_date = formatDate(processed.appointment_date);
    }
    if (processed.date_of_birth) {
      processed.date_of_birth = formatDate(processed.date_of_birth);
    }
    if (processed.createdAt) {
      processed.createdAt = formatDateTime(processed.createdAt);
    }
    if (processed.updatedAt) {
      processed.updatedAt = formatDateTime(processed.updatedAt);
    }
    if (processed.sent_at) {
      processed.sent_at = formatDateTime(processed.sent_at);
    }
    
    // Handle nested objects
    if (processed.patient_id && typeof processed.patient_id === 'object') {
      processed['patient_id.first_name'] = processed.patient_id.first_name || '';
      processed['patient_id.last_name'] = processed.patient_id.last_name || '';
    }
    if (processed.doctor_id && typeof processed.doctor_id === 'object') {
      processed['doctor_id.first_name'] = processed.doctor_id.first_name || '';
      processed['doctor_id.last_name'] = processed.doctor_id.last_name || '';
    }
    if (processed.user_id && typeof processed.user_id === 'object') {
      processed['user_id.name'] = processed.user_id.name || '';
    }
    if (processed.department_id && typeof processed.department_id === 'object') {
      processed['department_id.name'] = processed.department_id.name || '';
    }
    
    // Format boolean values
    if (processed.is_read !== undefined) {
      processed.is_read = processed.is_read ? 'Yes' : 'No';
    }
    if (processed.is_available !== undefined) {
      processed.is_available = processed.is_available ? 'Yes' : 'No';
    }
    
    // Handle appointment changes nested structure
    if (processed.appointment_id && typeof processed.appointment_id === 'object') {
      processed['appointment_id._id'] = processed.appointment_id._id || '';
      processed['appointment_id.appointment_date'] = processed.appointment_id.appointment_date || '';
      processed['appointment_id.appointment_time'] = processed.appointment_id.appointment_time || '';
    }
    
    // Format changed_at for appointment changes
    if (processed.changed_at) {
      processed.changed_at = formatDateTime(processed.changed_at);
    }
    
    return processed;
  });
};

