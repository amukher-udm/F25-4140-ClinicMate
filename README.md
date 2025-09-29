# ClinicMate v1.0

A full-stack web application using React+Express .

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Development**: vite-express (serves Vite as Express middleware)
- **Monorepo**: npm workspaces

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

This starts the Express server on http://localhost:3000 with Vite handling the frontend through middleware.

## Build for Production

Build the client:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

- `packages/client/` - React frontend application
- `packages/server/` - Express backend API
- `package.json` - Root package.json with workspace configuration
