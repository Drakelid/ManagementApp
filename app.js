const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
  secret: 'timemanagementappsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Mock user data for demo purposes
let isAuthenticated = false;

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/');
  }
  next();
};

// Routes

// Home page
app.get('/', (req, res) => {
  res.render('index', { isAuthenticated: req.session.isAuthenticated });
});

// Contact us page
app.get('/contact', (req, res) => {
  res.render('contact', { isAuthenticated: req.session.isAuthenticated });
});

// Apply leave page (protected)
app.get('/apply-leave', checkAuth, (req, res) => {
  // Mock data
  const leaveData = {
    totalQuota: 25,
    usedLeaves: 15
  };
  res.render('apply-leave', { leaveData, isAuthenticated: req.session.isAuthenticated });
});

// Leave request form (protected)
app.get('/leave-request', checkAuth, (req, res) => {
  // Mock user data
  const userData = {
    employeeId: 'EMP123',
    name: 'John Doe',
    email: 'john.doe@example.com'
  };
  res.render('leave-request', { userData, isAuthenticated: req.session.isAuthenticated });
});

// Timesheet page (protected)
app.get('/timesheet', checkAuth, (req, res) => {
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
  
  res.render('timesheet', { timesheetData, isAuthenticated: req.session.isAuthenticated });
});

// Login handler (for demo purposes)
app.post('/login', (req, res) => {
  // In a real app, you'd validate credentials here
  req.session.isAuthenticated = true;
  res.redirect('/timesheet');
});

// Logout handler
app.get('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  res.redirect('/');
});

// Time Tracking API Routes
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

// Clock in route
app.post('/api/clock-in', checkAuth, (req, res) => {
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
app.post('/api/clock-out', checkAuth, (req, res) => {
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
app.post('/api/start-break', checkAuth, (req, res) => {
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
app.post('/api/end-break', checkAuth, (req, res) => {
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
app.post('/api/start-unavailable', checkAuth, (req, res) => {
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
app.post('/api/end-unavailable', checkAuth, (req, res) => {
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
app.get('/api/timesheet-status', checkAuth, (req, res) => {
  res.json({
    activeEntry: timeEntries.activeEntry,
    entries: timeEntries.entries.slice(0, 10) // Return last 10 entries
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
