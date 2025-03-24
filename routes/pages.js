/**
 * Main page routes
 */
const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const { timeEntries, calculateTimeDiff, formatTime, formatMinutes } = require('../utils/timeUtils');

// Home page
router.get('/', (req, res) => {
  res.render('index');
});

// Contact us page
router.get('/contact', (req, res) => {
  res.render('contact');
});

// Apply leave page (protected)
router.get('/apply-leave', checkAuth, (req, res) => {
  // Mock data
  const leaveData = {
    totalQuota: 25,
    usedLeaves: 15
  };
  res.render('apply-leave', { leaveData });
});

// Leave request form (protected)
router.get('/leave-request', checkAuth, (req, res) => {
  // Mock user data
  const userData = {
    employeeId: 'EMP123',
    name: 'John Doe',
    email: 'john.doe@example.com'
  };
  res.render('leave-request', { userData });
});

// Timesheet page (protected)
router.get('/timesheet', checkAuth, (req, res) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check for active entry and calculate remaining hours
  let loginTime = '---';
  let remainingHours = 0;
  
  if (timeEntries.activeEntry) {
    loginTime = timeEntries.activeEntry.login;
    
    // Calculate elapsed time in minutes
    const elapsedMinutes = calculateTimeDiff(loginTime, formatTime(now));
    
    // Calculate pause and unavailable time
    let pauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    let unavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    
    // Add current pause if on break
    if (timeEntries.activeEntry.pauseStart) {
      pauseMinutes += calculateTimeDiff(timeEntries.activeEntry.pauseStart, formatTime(now));
    }
    
    // Add current unavailable if unavailable
    if (timeEntries.activeEntry.unavailableStart) {
      unavailableMinutes += calculateTimeDiff(timeEntries.activeEntry.unavailableStart, formatTime(now));
    }
    
    // Calculate worked time
    const workedMinutes = elapsedMinutes - (pauseMinutes + unavailableMinutes);
    
    // 8-hour workday = 480 minutes
    remainingHours = (480 - workedMinutes) / 60;
    if (remainingHours < 0) remainingHours = 0;
  }
  
  const timesheetData = {
    loginTime: loginTime,
    remainingHours: remainingHours,
    timeEntries: timeEntries.entries,
    activeEntry: timeEntries.activeEntry
  };
  
  res.render('timesheet', { timesheetData });
});

module.exports = router;
