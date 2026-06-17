import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// We will import our routes here tomorrow (Day 2)
// import authRoutes from './routes/auth';

const app = express();

// --- Security & Middleware ---
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true // Crucial for JWT cookies
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (up to 10mb for base64 fallbacks if needed)
app.use(cookieParser()); // Parse cookies from incoming requests

// --- Basic Health Check Route ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Team Task Manager API is running!' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
