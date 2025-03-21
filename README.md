# Time Management Application

A comprehensive time management application built with Node.js and Express.js. This application helps employees track their work hours, manage leaves, and improve productivity.

## Features

- **User Authentication**: Secure login system for users
- **Time Tracking**: Track work hours, breaks, and available time
- **Leave Management**: Apply for leaves and track leave balance
- **Timesheet View**: View timesheet data by week, month, or year
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
   or for development with auto-reload:
   ```
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the login button on the home page
3. Access the various features:
   - View your timesheet
   - Apply for leaves
   - Check leave balance
   - Contact support if needed

## Project Structure

- `/public`: Static assets (CSS, JavaScript, images)
- `/views`: EJS templates for rendering pages
- `/app.js`: Main application file
- `/package.json`: Project dependencies and scripts

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Template Engine**: EJS
- **Session Management**: express-session

## License

[MIT](LICENSE)
