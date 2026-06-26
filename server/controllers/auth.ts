import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas";

//1.register
export const register = catchAsync(async (req: Request, res: Response) => {
    //Zod validates the data.If it fails, catchAsync sends the error to the global handler.
    const validatedData = registerSchema.parse(req.body);

    //check if email exists
    const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
    });

    if (existingUser) {
        throw new AppError('Email is already registered', 400);
    }

    //hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    //Save to AWS RDS database 
    const user = await prisma.user.create({
        data: {
            name: validatedData.name,
            email: validatedData.email,
            passwordHash
        },
    });

    //generate a secure token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    //Attach token to a highly secure HTTP-only cookie
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, //7days
    });

    res.status(201).json({
        message: "Registration succesful",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
});

//2.login
export const login = catchAsync(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);

    //check if user exists
    const user = await prisma.user.findUnique({
        where: {
            email: validatedData.email
        }
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    //verify the password against the hash
    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);

    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    //generate new token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        message: 'Login succesful',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
});

//3.logout
export const logout = catchAsync(async (req: Request, res: Response) => {
    //Destroy the cookie by setting it to empty and expriing it immediately
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        message: 'Logged out successfully'
    });
});

//4.get current user (session persistance)
export const getMe = catchAsync(async (req: Request, res: Response) => {
    //req.user is already attached by the protect middleware 
    res.status(200).json({
        user: req.user
    });
});

//5.forgot password
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // We throw a generic message so attackers can't fish for emails
        return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry (1 hour) to db
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetExpires: new Date(Date.now() + 60 * 60 * 1000)
        }
    });

    // In a real app, you would send an email via SendGrid/AWS SES here
    // For now, we simulate success
    // e.g. await sendEmail({ to: user.email, text: `Reset link: /reset-password/${resetToken}` })

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
});

//6.reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const { password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetExpires: { gt: new Date() } // Must not be expired
        }
    });

    if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user and clear reset tokens
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            resetToken: null,
            resetExpires: null
        }
    });

    res.status(200).json({ message: 'Password has been successfully reset. Please log in.' });
});