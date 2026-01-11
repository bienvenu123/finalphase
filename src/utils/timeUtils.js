/**
 * Generate time slots in 10-minute intervals
 * @param {string} startTime - Start time in HH:MM format (e.g., "08:00")
 * @param {string} endTime - End time in HH:MM format (e.g., "18:00") - This is the final leaving time and will NOT be included
 * @returns {Array<string>} Array of time strings in HH:MM format (excludes endTime)
 */
export const generateTimeSlots = (startTime = '08:00', endTime = '18:00') => {
  const slots = [];
  
  // Parse start and end times
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Convert to minutes for easier calculation
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Generate 10-minute intervals
  // Stop before reaching endTime (endTime is the final leaving time, not available for booking)
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    slots.push(timeString);
    currentMinutes += 10; // Add 10 minutes
    
    // Stop if next interval would reach or exceed endTime
    if (currentMinutes >= endMinutes) {
      break;
    }
  }
  
  return slots;
};

/**
 * Check if a time is a valid 10-minute interval
 * @param {string} time - Time in HH:MM format
 * @returns {boolean} True if time is a valid 10-minute interval
 */
export const isValid15MinuteInterval = (time) => {
  if (!time || typeof time !== 'string') return false;
  
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) return false;
  
  const [, minutes] = time.split(':').map(Number);
  return minutes % 10 === 0; // Minutes should be divisible by 10
};

/**
 * Round time to nearest 10-minute interval
 * @param {string} time - Time in HH:MM format
 * @returns {string} Rounded time in HH:MM format
 */
export const roundTo15Minutes = (time) => {
  if (!time || typeof time !== 'string') return '08:00';
  
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) return '08:00';
  
  const [hours, minutes] = time.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / 10) * 10;
  
  let finalHours = hours;
  let finalMinutes = roundedMinutes;
  
  if (finalMinutes >= 60) {
    finalHours += 1;
    finalMinutes = 0;
  }
  
  if (finalHours >= 24) {
    finalHours = 23;
    finalMinutes = 50;
  }
  
  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
};

