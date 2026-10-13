import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import fileRoutes from './routes/files';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import { AppError } from './utils/AppError';


const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io with strict CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make `io` accessible inside all Express controllers (req.app.get('io'))
app.set('io', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When frontend emits 'join_project', put them in a unique room
  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project room: ${projectId}`);
  });

  // Let the user join their own personal ID room for notifications!
  socket.on('join_personal_room', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined personal room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

//Security & Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Crucial for JWT cookies
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (up to 10mb for base64 fallbacks if needed)
app.use(cookieParser()); // Parse cookies from incoming requests


// Api Routes

// Root Route — Provides API status and frontend direction
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Task Manager - API Server</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0d1117;
            color: #c9d1d9;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 36px;
            max-width: 560px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: rgba(35, 134, 54, 0.2);
            color: #3fb950;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 20px;
            margin-bottom: 16px;
            border: 1px solid rgba(63, 185, 80, 0.3);
          }
          .dot {
            width: 8px;
            height: 8px;
            background-color: #3fb950;
            border-radius: 50%;
          }
          h1 {
            color: #f0f6fc;
            margin: 0 0 12px 0;
            font-size: 24px;
          }
          p {
            line-height: 1.6;
            margin: 0 0 24px 0;
            color: #8b949e;
          }
          .btn {
            display: inline-block;
            background-color: #C6A15B;
            color: #111111;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 700;
            text-decoration: none;
            transition: opacity 0.2s;
            margin-bottom: 24px;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .endpoints {
            border-top: 1px solid #30363d;
            padding-top: 20px;
          }
          .endpoints-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8b949e;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .tag {
            background-color: #21262d;
            color: #58a6ff;
            padding: 4px 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #30363d;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">
            <span class="dot"></span>
            Backend API Online (Port ${PORT})
          </div>
          <h1>Team Task Manager API</h1>
          <p>This port runs the <strong>Express REST API & WebSocket</strong> server. The interactive web application user interface is hosted by Vite at <strong>${frontendUrl}</strong>.</p>
          <a class="btn" href="${frontendUrl}">Open Frontend Web Application &rarr;</a>
          
          <div class="endpoints">
            <div class="endpoints-title">Active API Endpoints</div>
            <div class="tag-list">
              <span class="tag">/api/auth</span>
              <span class="tag">/api/projects</span>
              <span class="tag">/api/tasks</span>
              <span class="tag">/api/files</span>
              <span class="tag">/api/notifications</span>
              <span class="tag">/api/dashboard</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  res.json({
    status: 'success',
    service: 'Team Task Manager API',
    port: PORT,
    frontendUrl,
    message: 'Backend server is running healthy'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    service: 'Team Task Manager API',
    endpoints: [
      '/api/auth',
      '/api/projects',
      '/api/tasks',
      '/api/files',
      '/api/notifications',
      '/api/dashboard'
    ]
  });
});

//auth routes
app.use('/api/auth', authRoutes);
//project routes
app.use('/api/projects', projectRoutes);
//task routes
app.use('/api/tasks', taskRoutes);
//file routes
app.use('/api/files', fileRoutes);
//notification routes
app.use('/api/notifications', notificationRoutes);
//dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Handler for undefined paths
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server. Did you mean to access the frontend at ${frontendUrl}?`, 404));
});

//ERROR HANDLER
app.use(errorHandler);

//Start Server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});