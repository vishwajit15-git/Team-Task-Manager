import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    //by default if err has  no status code send 500(Internal server error) Error message 
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Zod validation errors — make them human-readable
    if (err instanceof ZodError) {
        statusCode = 400;
        const errors = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        message = errors.join(', ');
    }


    //theres a specific error code that describes duplicate variables like duplicate emails i.e P2002
    if (err.code === 'P2002') {
        statusCode = 400;
        message = 'This email is already in use.';
    }

    //this will be shown to the user
    res.status(statusCode).json({
        status: 'error',
        message,  //this is the error message shown to the user 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};