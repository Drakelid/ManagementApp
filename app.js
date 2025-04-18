const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Import middleware
const { setAuthLocals } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const timeTrackingRoutes = require('./routes/timeTracking');

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

// Set authentication data for all routes
app.use(setAuthLocals);

// Register routes
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/api', timeTrackingRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
