import { getCurrentUser } from '../services/authService';
import { getDoctors } from '../services/doctorService';

/**
 * Get the current doctor ID for the logged-in doctor user
 * @returns {Promise<string|null>} Doctor ID or null if not found or not a doctor
 */
export const getCurrentDoctorId = async () => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return null;
    }

    // If user is not a doctor, return null
    if (currentUser.role?.toLowerCase() !== 'doctor') {
      return null;
    }

    // Get all doctors
    const doctorsRes = await getDoctors();
    const doctors = doctorsRes.data || [];

    let doctor = null;

    // Attempt to match by user_id (handle both object and string formats)
    if (currentUser._id || currentUser.id) {
      const userId = currentUser._id || currentUser.id;
      doctor = doctors.find(d => {
        if (!d.user_id) return false;
        // Handle populated user_id (object) or direct ID (string)
        const doctorUserId = typeof d.user_id === 'object' ? d.user_id._id || d.user_id.id : d.user_id;
        return doctorUserId === userId;
      });
      if (doctor) return doctor._id;
    }

    // Fallback: match by email (case-insensitive)
    if (currentUser.email) {
      doctor = doctors.find(d => {
        if (!d.email) return false;
        return d.email.toLowerCase() === currentUser.email.toLowerCase();
      });
      if (doctor) return doctor._id;
    }

    // Fallback: match by _id if the user object itself is a doctor record
    const userId = currentUser._id || currentUser.id;
    if (userId) {
      doctor = doctors.find(d => d._id === userId);
      if (doctor) return doctor._id;
    }

    // Fallback: match by name (less reliable)
    if (currentUser.name) {
      const nameParts = currentUser.name.split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        doctor = doctors.find(d =>
          d.first_name?.toLowerCase() === firstName?.toLowerCase() &&
          d.last_name?.toLowerCase() === lastName?.toLowerCase()
        );
        if (doctor) {
          console.log('Found doctor by name:', doctor._id);
          return doctor._id;
        }
      }
    }

    // Debug: Log what we're looking for vs what's available
    console.warn('Doctor profile not found. Current user:', {
      _id: currentUser._id,
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role
    });
    console.warn('Available doctors:', doctors.map(d => ({
      _id: d._id,
      email: d.email,
      user_id: d.user_id,
      user_id_type: typeof d.user_id,
      user_id_value: typeof d.user_id === 'object' ? (d.user_id._id || d.user_id.id) : d.user_id,
      first_name: d.first_name,
      last_name: d.last_name
    })));

    return null;
  } catch (error) {
    console.error('Error getting current doctor ID:', error);
    return null;
  }
};

/**
 * Check if the current user is a doctor
 * @returns {boolean}
 */
export const isDoctor = () => {
  const currentUser = getCurrentUser();
  return currentUser?.role?.toLowerCase() === 'doctor';
};

/**
 * Check if the current user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const currentUser = getCurrentUser();
  return currentUser?.role === 'Admin' || currentUser?.role === 'admin';
};

