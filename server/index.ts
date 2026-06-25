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


const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io with strict CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.APP_URL || 'http://localhost:3000',
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

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

//Security & Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true // Crucial for JWT cookies
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (up to 10mb for base64 fallbacks if needed)
app.use(cookieParser()); // Parse cookies from incoming requests


//Api Routes

//auth routes
app.use('/api/auth', authRoutes);
//project routes
app.use('/api/projects', projectRoutes);
//task routes
app.use('/api/tasks', taskRoutes);
//file routes
app.use('/api/files', fileRoutes);



//ERROR HANDLER
app.use(errorHandler);

//Start Server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});