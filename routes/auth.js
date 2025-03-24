/**
 * Authentication routes
 */
const express = require('express');
const router = express.Router();
const db = require('../database');

// Login handler (for demo purposes)
// router.post('/login', (req, res) => {
//   // In a real app, you'd validate credentials here
//   req.session.isAuthenticated = true;
//   res.redirect('/timesheet');
// });

// Logout handler
router.get('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  res.redirect('/');
});

// Example of user registration route
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            return res.status(400).send('Error registering user.');
        }
        res.status(201).send('User registered successfully.');
    });
});

// Example of user login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
            return res.status(401).send('Invalid username or password.');
        }
        if (row.password !== password) {
            return res.status(401).send('Invalid username or password.');
        }
        req.session.isAuthenticated = true;
        res.send('Login successful.');
    });
});

module.exports = router;
