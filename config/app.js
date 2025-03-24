/**
 * Application configuration
 */
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Configure the Express application
const configureApp = (app) => {
  // Set up view engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layout');

  // Static files middleware
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // Body parser middleware
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Session configuration
  app.use(session({
    secret: 'timemanagementappsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));

  return app;
};

module.exports = { configureApp };
