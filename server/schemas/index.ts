import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


//project scchema 
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be atleast 2 characters'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

//task schema
export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
});

//member schemas
export const addMemberSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

//message schema
export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

//comments schema
export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

// meeting schema
export const createMeetingSchema = z.object({
  title: z.string().min(2, "Meeting title must be at least 2 characters"),
  description: z.string().optional(),
  date: z.string().datetime("Must be a valid ISO Date string"),
});

// poll schema
export const createPollSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "Must have at least 2 options"),
});
