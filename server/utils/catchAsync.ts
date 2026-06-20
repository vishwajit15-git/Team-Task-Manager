import { Request, Response, NextFunction } from 'express';

export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        //if the function throws an error, it gets caught and sent to the global handler
        fn(req, res, next).catch(next);
    };
};