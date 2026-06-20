import { string } from "zod";

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;    //by default true, indicates this is an expected error, not an random crash

        //captures the exact line of code where the error happened 
        Error.captureStackTrace(this, this.constructor);

        /*Syntax:
        Error.captureStackTrace(targetObject, constructorOpt)
            targetObject:The object where the .stack property will be attached.
            constructorOpt:A function in the call stack. Every frame above and including this function will be hidden from the stack trace.
        */

    }
}