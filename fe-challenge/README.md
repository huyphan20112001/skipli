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
