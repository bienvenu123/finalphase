import React, { useState, useMemo } from 'react';
import {
  convertToCSV,
  downloadCSV,
  generatePDF,
  generateExcel,
  processDataForReport,
  getReportHeaders
} from '../services/reportService';
import './ReportButton.css';

const ReportButton = ({ 
  data = [], 
  entityType = 'appointments', 
  title = 'Report',
  filters = {},
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'

  // Filter data based on time period
  const getFilteredDataByPeriod = (period) => {
    if (period === 'all' || !data || data.length === 0) {
      return data;
    }

    const now = new Date();
    let startDate = null;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      // Determine which date field to use based on entity type
      let itemDate = null;
      
      if (entityType === 'appointments') {
        itemDate = item.appointment_date || item.createdAt;
      } else if (entityType === 'patients') {
        itemDate = item.createdAt || item.date_of_birth;
      } else if (entityType === 'notifications') {
        itemDate = item.sent_at || item.createdAt;
      } else {
        itemDate = item.createdAt || item.updatedAt;
      }
      
      if (!itemDate) return false;
      
      const itemDateObj = new Date(itemDate);
      itemDateObj.setHours(0, 0, 0, 0);
      
      return itemDateObj >= startDate && itemDateObj <= now;
    });
  };

  const filteredData = useMemo(() => {
    return getFilteredDataByPeriod(timePeriod);
  }, [data, timePeriod, entityType]);

  const handleExport = (format) => {
    const dataToExport = filteredData.length > 0 ? filteredData : data;
    
    if (!dataToExport || dataToExport.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = getReportHeaders[entityType] || [];
    const processedData = processDataForReport(dataToExport, entityType);
    
    // Create filename with time period
    const today = new Date();
    let periodSuffix = '';
    if (timePeriod === 'daily') {
      periodSuffix = `_daily_${today.toISOString().split('T')[0]}`;
    } else if (timePeriod === 'weekly') {
      periodSuffix = `_weekly_${today.toISOString().split('T')[0]}`;
    } else if (timePeriod === 'monthly') {
      periodSuffix = `_monthly_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    } else if (timePeriod === 'yearly') {
      periodSuffix = `_yearly_${today.getFullYear()}`;
    } else {
      periodSuffix = `_${today.toISOString().split('T')[0]}`;
    }
    
    const filename = `${entityType}_report${periodSuffix}`;

    // Update filters to include time period
    const exportFilters = {
      ...filters,
      timePeriod: timePeriod !== 'all' ? timePeriod : undefined
    };

    try {
      switch (format) {
        case 'csv':
          const csvContent = convertToCSV(processedData, headers);
          downloadCSV(csvContent, `${filename}.csv`);
          break;
        
        case 'excel':
          generateExcel(processedData, headers, `${filename}.xls`);
          break;
        
        case 'pdf':
          generatePDF(title, processedData, headers, exportFilters);
          break;
        
        default:
          console.error('Unknown export format:', format);
      }
      
      setShowMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className={`report-button-container ${className}`}>
      <button
        className="btn btn-secondary report-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Generate Report"
      >
        📊 Generate Report
      </button>
      
      {showMenu && (
        <>
          <div 
            className="report-menu-overlay"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="report-menu">
            <div className="report-menu-header">
              <h4>Export Report</h4>
              <button 
                className="report-menu-close"
                onClick={() => setShowMenu(false)}
              >
                ×
              </button>
            </div>
            <div className="report-menu-content">
              {/* Time Period Selection */}
              <div className="time-period-section">
                <label className="time-period-label">Time Period:</label>
                <div className="time-period-buttons">
                  <button
                    className={`time-period-btn ${timePeriod === 'all' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('all')}
                    title="All Records"
                  >
                    All
                  </button>
                  <button
                    className={`time-period-btn ${timePeriod === 'daily' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('daily')}
                    title="Today's Records"
                  >
                    Daily
                  </button>
                  <button
                    className={`time-period-btn ${timePeriod === 'weekly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('weekly')}
                    title="This Week's Records"
                  >
                    Weekly
                  </button>
                  <button
                    className={`time-period-btn ${timePeriod === 'monthly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('monthly')}
                    title="This Month's Records"
                  >
                    Monthly
                  </button>
                  <button
                    className={`time-period-btn ${timePeriod === 'yearly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('yearly')}
                    title="This Year's Records"
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <p className="report-info">
                Exporting <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> record{data.length !== 1 ? 's' : ''}
                {timePeriod !== 'all' && (
                  <span className="period-indicator"> ({timePeriod})</span>
                )}
              </p>
              
              <div className="report-options">
                <button
                  className="report-option-btn"
                  onClick={() => handleExport('csv')}
                >
                  <span className="report-icon">📄</span>
                  <span>Export as CSV</span>
                </button>
                <button
                  className="report-option-btn"
                  onClick={() => handleExport('excel')}
                >
                  <span className="report-icon">📊</span>
                  <span>Export as Excel</span>
                </button>
                <button
                  className="report-option-btn"
                  onClick={() => handleExport('pdf')}
                >
                  <span className="report-icon">📑</span>
                  <span>Export as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportButton;

