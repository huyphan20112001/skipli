# Employee Task Management Backend

A RESTful API backend for employee task management built with ExpressJS, Firebase, and Socket.IO.

## Features

- Owner authentication via phone number and SMS verification
- Employee authentication via email verification
- Real-time communication using Socket.IO
- Firebase Firestore database integration
- TypeScript support
- Security middleware (Helmet, CORS, Rate limiting)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** ExpressJS
- **Database:** Firebase Firestore
- **Real-time:** Socket.IO
- **Language:** TypeScript
- **Authentication:** JWT

## Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/         # API route definitions
├── services/       # Business logic and external service integrations
├── middleware/     # Custom middleware functions
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`

4. Build the project:
   ```bash
   npm run build
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run clean` - Remove build artifacts

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Owner Authentication
- `POST /api/owner/create-access-code` - Generate access code for phone number
- `POST /api/owner/validate-access-code` - Validate access code and get JWT token

### Employee Management
- `GET /api/employee/:employeeId` - Get employee details
- `POST /api/employee/create` - Create new employee
- `POST /api/employee/delete` - Delete employee

### Employee Authentication
- `POST /api/employee/login-email` - Generate access code for email
- `POST /api/employee/validate-access-code` - Validate access code and get JWT token

## Environment Variables

See `.env.example` for required environment variables.

## Development

The project uses TypeScript with strict type checking enabled. All source code is in the `src/` directory and gets compiled to the `dist/` directory.

For development, use `npm run dev` which will automatically restart the server when files change.