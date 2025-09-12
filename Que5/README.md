# P05 - Employee Site

Employee portal with JWT authentication for leave management.

## Setup
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Access at: http://localhost:3001

## Features
- JWT-based employee login
- Employee profile display
- Leave application (add/list)
- Logout functionality

## Usage
1. Use employee credentials from P04 admin panel
2. Login with Employee ID and password
3. View profile and apply for leaves

## API Endpoints
- POST /api/login - Employee login
- GET /api/profile - Get employee profile
- POST /api/leave - Apply for leave
- GET /api/leaves - Get employee leaves
- POST /api/logout - Logout