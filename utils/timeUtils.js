/**
 * Time utility functions for time tracking
 */

// Mock data storage for time tracking
const timeEntries = {
  currentDay: null,
  entries: [
    { date: '2025-03-21', login: '08:30', logout: '17:30', pause: '01:00', unavailable: '00:00', totalAvailable: '08:00', status: 'complete' },
    { date: '2025-03-20', login: '08:45', logout: '17:45', pause: '01:00', unavailable: '00:30', totalAvailable: '07:30', status: 'complete' }
  ],
  activeEntry: null
};

// Format time in HH:MM format
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Calculate time difference in minutes
const calculateTimeDiff = (startTime, endTime) => {
  const start = new Date(`2025-03-21T${startTime}`);
  const end = new Date(`2025-03-21T${endTime}`);
  return Math.round((end - start) / (1000 * 60));
};

// Format minutes as HH:MM
const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

module.exports = {
  timeEntries,
  formatTime,
  calculateTimeDiff,
  formatMinutes
};
