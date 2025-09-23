# Employee Task Management Frontend

A modern React frontend for employee task management built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Modern React 19 with TypeScript
- Tailwind CSS for styling
- Radix UI components
- React Query for data fetching
- Socket.IO for real-time updates
- React Hook Form with Zod validation
- React Router for navigation
- Dark/Light theme support

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** React Query
- **Real-time:** Socket.IO Client
- **Forms:** React Hook Form + Zod
- **Routing:** React Router DOM

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Backend API running on http://localhost:2001

### Step-by-Step Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd fe-challenge
   ```

2. **Install dependencies:**
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   NODE_ENV=development
   PORT=5173
   VITE_API_URL=http://localhost:2001
   ```

5. **Start development server:**
   ```bash
   # Using pnpm
   pnpm dev
   
   # Or using npm
   npm run dev
   ```

The application will start on http://localhost:5173

### Quick Start

```bash
cd fe-challenge
pnpm install
cp .env.example .env
pnpm dev
```

### Full Stack Setup

To run both frontend and backend together:

1. **Terminal 1 - Backend:**
   ```bash
   cd be-challenge
   npm install
   cp .env.example .env
   # Configure .env with your Firebase/Twilio/Mailtrap credentials
   npm run dev
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd fe-challenge
   pnpm install
   cp .env.example .env
   pnpm dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:2001

### Development Features

- **Hot Module Replacement (HMR)** - Instant updates during development
- **TypeScript** - Full type safety and IntelliSense
- **ESLint** - Code linting and formatting
- **Tailwind CSS** - Utility-first CSS framework
- **Component Library** - Pre-built Radix UI components

## Available Scripts

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── hooks/         # Custom React hooks
├── services/      # API service functions
├── types/         # TypeScript type definitions
├── contexts/      # React context providers
├── lib/           # Utility libraries and configurations
├── constants/     # Application constants
├── schemas/       # Zod validation schemas
└── utils/         # Helper functions
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:2001)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Development server port (default: 5173)


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

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Twilio account (for SMS verification)
- Mailtrap account (for email testing)

### Step-by-Step Setup

1. **Clone and navigate to the backend directory:**

   ```bash
   cd be-challenge
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Configuration:**

   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase:**

   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Go to Project Settings > Service Accounts
   - Generate a new private key (JSON file)
   - Extract the following values and add to your `.env`:
     ```env
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY_ID=your-private-key-id
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL=your-service-account-email
     FIREBASE_CLIENT_ID=your-client-id
     ```

5. **Configure Twilio (for SMS):**

   - Sign up at https://www.twilio.com
   - Get your Account SID, Auth Token, and phone number
   - Add to `.env`:
     ```env
     TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     TWILIO_AUTH_TOKEN=your-auth-token
     TWILIO_FROM_NUMBER=+1234567890
     ```

6. **Configure Mailtrap (for email testing):**

   - Sign up at https://mailtrap.io
   - Get SMTP credentials from your inbox
   - Add to `.env`:
     ```env
     MAILTRAP_HOST=sandbox.smtp.mailtrap.io
     MAILTRAP_PORT=2525
     MAILTRAP_USERNAME=your-username
     MAILTRAP_PASSWORD=your-password
     ```

7. **Set JWT Secret:**

   ```env
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
   ```

8. **Initialize the database:**

   ```bash
   npm run init-db
   ```

9. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on http://localhost:2001

### Quick Start (Minimal Setup)

For basic testing without external services:

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Set only these required variables:
   ```env
   PORT=2001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your-jwt-secret-key-minimum-32-characters
   ```
4. Run: `npm run dev`

Note: SMS and email features won't work without proper service configuration.

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
