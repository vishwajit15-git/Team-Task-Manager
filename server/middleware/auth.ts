import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //1.get the token from secure HttpOnly cookie
    const token = req.cookies.jwt;

    if (!token) {
        throw new AppError('Not authorized,no token provided', 401);
    }
    //2.verify the token using our secret key
    //if this fails then it  thros an error that catchAsync handles 
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    //3.Find the user in the database (exclude the password hash!)
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    if (!user) {
        throw new AppError('Not authorized,user no longer exists', 401);
    }

    //4.Attach the user to the request object and pass control to the API route
    req.user = user;
    next();
});