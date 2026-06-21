# Project Commands Log

This file tracks every terminal command we use throughout the manual rebuild of the Team Task Manager, along with an explanation of what it does.

## Day 1: Scaffolding & Setup

### 1. Initialize Frontend
```bash
npm create vite@latest ./ -- --template react-ts
```
**Why:** Bootstraps a brand new React application configured with Vite (for fast builds) and TypeScript.

### 2. Install Dependencies
```bash
npm i react-router-dom @tanstack/react-query tailwindcss @tailwindcss/vite shadcn lucide-react date-fns sonner motion emoji-picker-react @jitsi/react-sdk @fontsource-variable/geist socket.io-client class-variance-authority clsx tailwind-merge tw-animate-css express cors cookie-parser dotenv prisma @prisma/client bcryptjs jsonwebtoken zod express-rate-limit helmet socket.io multer @aws-sdk/client-s3 @aws-sdk/client-ses
npm i -D tsx typescript @types/node @types/express @types/cors @types/cookie-parser @types/bcryptjs @types/jsonwebtoken @types/multer vitest supertest @types/supertest
```
**Why:** Installs all the libraries needed for both the frontend (React Query, Tailwind, Socket.io client) and the backend (Express, Prisma, AWS SDKs, Security middleware).

### 3. Create Backend Folder Structure
```bash
mkdir -p server/middleware server/routes server/schemas server/lib src/lib src/components/ui src/pages
```
**Why:** Creates the architectural skeleton for our modular backend, replacing the old 1000-line monolithic server file.

### 4. Push Database Schema to AWS
```bash
npx prisma generate && npx prisma db push
```
**Why:** 
- `generate`: Reads `schema.prisma` and creates the autocomplete TypeScript types inside `node_modules`.
- `db push`: Connects to AWS RDS and instantly builds the PostgreSQL tables based on the schema.

### 5. View Database Tables (Prisma Studio)
```bash
npx prisma studio
```
**Why:** Opens a local web interface (usually `http://localhost:5555`) where you can view, edit, and manually add data directly into your AWS database.

## Day 2: Authentication & Security

### 6. Start Development Server
```bash
npm run dev
```
**Why:** Runs `tsx server/index.ts` which starts the Express server on `http://localhost:3000`. The server auto-restarts on file changes.

### 7. Test API Routes (Postman)
```
POST http://localhost:3000/api/auth/register   → Register a new user
POST http://localhost:3000/api/auth/login      → Login with credentials
POST http://localhost:3000/api/auth/logout     → Destroy JWT cookie
GET  http://localhost:3000/api/auth/me         → Get current logged-in user (requires cookie)
```
**Why:** Verifies the entire auth flow works end-to-end before building the frontend.

