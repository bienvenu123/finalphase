import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import WhatsAppButton from './components/WhatsAppButton';
import { isAuthenticated, getCurrentUser } from './services/authService';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import './App.css';
import './styles/global.css';

// Import all pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import PRDashboardPage from './pages/PRDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import InsurancesPage from './pages/InsurancesPage';
import DoctorSchedulesPage from './pages/DoctorSchedulesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentStatusHistoryPage from './pages/AppointmentStatusHistoryPage';
import AppointmentChangesPage from './pages/AppointmentChangesPage';
import ScheduledAppointmentsPage from './pages/ScheduledAppointmentsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import ContactPage from './pages/ContactPage';
import ContactDoctorPage from './pages/ContactDoctorPage';
import ContactAdminPage from './pages/ContactAdminPage';
import ContactPatientPage from './pages/ContactPatientPage';
import ContactsPage from './pages/ContactsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import DoctorsChatPage from './pages/DoctorsChatPage';

function AppContent() {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role?.toLowerCase();
  
  // Initialize session timeout (2 minutes)
  useSessionTimeout(2);
  
  // Hide navigation on public pages
  const publicPages = ['/scheduled-appointments', '/login', '/home', '/', '/contact', '/contact-patient', '/doctors-chat'];
  const isPublicPage = publicPages.includes(location.pathname);
  const showNavigation = !isPublicPage;

  // Receptionist should only access Patients + Appointments (management pages)
  if (authenticated && userRole === 'receptionist' && showNavigation) {
    const receptionistAllowed = ['/patients', '/appointments'];
    if (!receptionistAllowed.includes(location.pathname)) {
      return <Navigate to="/patients" replace />;
    }
  }

  return (
    <div className="App">
      {showNavigation && <Navigation />}
      <main className={`main-content ${isPublicPage ? 'login-layout' : ''}`}>
        {location.pathname !== '/login' && <WhatsAppButton />}
        <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={
              authenticated ? (() => {
                const user = getCurrentUser();
                const userRole = user?.role?.toLowerCase();
                // Redirect doctors to doctor dashboard, others to admin dashboard
                if (userRole === 'doctor') {
                  return <Navigate to="/doctor-dashboard" replace />;
                }
                // Redirect PR to PR dashboard
                if (userRole === 'pr') {
                  return <Navigate to="/pr-dashboard" replace />;
                }
                // Receptionist starts on patient management
                if (userRole === 'receptionist') {
                  return <Navigate to="/patients" replace />;
                }
                return <Navigate to="/dashboard" replace />;
              })() : <LoginPage />
            } />
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
            <Route path="/pr-dashboard" element={<PRDashboardPage />} />
            <Route path="/user-dashboard" element={<UserDashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/insurances" element={<InsurancesPage />} />
            <Route path="/doctor-schedules" element={<DoctorSchedulesPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/scheduled-appointments" element={<ScheduledAppointmentsPage />} />
            <Route path="/appointment-status-history" element={<AppointmentStatusHistoryPage />} />
            <Route path="/appointment-changes" element={<AppointmentChangesPage />} />
            <Route path="/medical-records" element={<MedicalRecordsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/contact-doctor" element={<ContactDoctorPage />} />
            <Route path="/contact-admin" element={<ContactAdminPage />} />
            <Route path="/contact-patient" element={<ContactPatientPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/doctors-chat" element={<DoctorsChatPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
