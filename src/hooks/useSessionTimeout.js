import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, isAuthenticated } from '../services/authService';

/**
 * Custom hook to handle session timeout
 * Automatically logs out user after specified inactivity period
 * @param {number} timeoutMinutes - Timeout in minutes (default: 2)
 */
export const useSessionTimeout = (timeoutMinutes = 2) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Convert minutes to milliseconds
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const resetTimer = useCallback(() => {
    if (!isAuthenticated()) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated()) {
        logout();
        navigate('/login', { 
          state: { 
            message: 'Your session has expired due to inactivity. Please login again.' 
          },
          replace: true 
        });
      }
    }, timeoutMs);

    lastActivityRef.current = Date.now();
  }, [navigate, timeoutMs]);

  useEffect(() => {
    // Only set up timeout if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    // Initialize timer
    resetTimer();

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer]);

  return { resetTimer };
};

