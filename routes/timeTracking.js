/**
 * Time tracking API routes
 */
const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const { timeEntries, formatTime, calculateTimeDiff, formatMinutes } = require('../utils/timeUtils');

// Clock in route
router.post('/clock-in', checkAuth, (req, res) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if already clocked in today
  const existingEntry = timeEntries.entries.find(entry => entry.date === today);
  
  if (existingEntry && existingEntry.status !== 'complete') {
    return res.status(400).json({ error: 'Already clocked in today' });
  }
  
  const currentTime = formatTime(now);
  
  const newEntry = {
    date: today,
    login: currentTime,
    logout: '',
    pause: '00:00',
    unavailable: '00:00',
    totalAvailable: '00:00',
    status: 'active',
    pauseStart: null,
    unavailableStart: null
  };
  
  timeEntries.entries.unshift(newEntry);
  timeEntries.activeEntry = newEntry;
  timeEntries.currentDay = today;
  
  res.json({ success: true, entry: newEntry });
});

// Clock out route
router.post('/clock-out', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  // If there's an active pause or unavailable period, end it
  if (timeEntries.activeEntry.pauseStart) {
    const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    timeEntries.activeEntry.pauseStart = null;
  }
  
  if (timeEntries.activeEntry.unavailableStart) {
    const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    timeEntries.activeEntry.unavailableStart = null;
  }
  
  // Calculate total available time
  const loginMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.login);
  const logoutMinutes = calculateTimeDiff('00:00', currentTime);
  const pauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
  const unavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
  
  const totalAvailableMinutes = (logoutMinutes - loginMinutes) - (pauseMinutes + unavailableMinutes);
  
  timeEntries.activeEntry.logout = currentTime;
  timeEntries.activeEntry.totalAvailable = formatMinutes(totalAvailableMinutes);
  timeEntries.activeEntry.status = 'complete';
  timeEntries.activeEntry = null;
  
  res.json({ success: true });
});

// Start break route
router.post('/start-break', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  // If already on break
  if (timeEntries.activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Already on break' });
  }
  
  // If unavailable, end that first
  if (timeEntries.activeEntry.unavailableStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    timeEntries.activeEntry.unavailableStart = null;
  }
  
  const now = new Date();
  timeEntries.activeEntry.pauseStart = formatTime(now);
  
  res.json({ success: true });
});

// End break route
router.post('/end-break', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || !timeEntries.activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Not on break' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
  const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
  
  timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
  timeEntries.activeEntry.pauseStart = null;
  
  res.json({ success: true });
});

// Start unavailable route
router.post('/start-unavailable', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  // If already unavailable
  if (timeEntries.activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Already unavailable' });
  }
  
  // If on break, end that first
  if (timeEntries.activeEntry.pauseStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    timeEntries.activeEntry.pauseStart = null;
  }
  
  const now = new Date();
  timeEntries.activeEntry.unavailableStart = formatTime(now);
  
  res.json({ success: true });
});

// End unavailable route
router.post('/end-unavailable', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || !timeEntries.activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Not unavailable' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
  const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
  
  timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
  timeEntries.activeEntry.unavailableStart = null;
  
  res.json({ success: true });
});

// Get timesheet status
router.get('/timesheet-status', checkAuth, (req, res) => {
  res.json({
    activeEntry: timeEntries.activeEntry,
    entries: timeEntries.entries.slice(0, 10) // Return last 10 entries
  });
});

module.exports = router;
