import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { registerSchema, loginSchema } from "../schemas";
import { tr } from "date-fns/locale";
import { email } from "zod";

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