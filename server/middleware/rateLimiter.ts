import rateLimit from 'express-rate-limit';

//we will be applying rate limiter diferently for diff work , for auth routes it will be more strict than for the api routes

//1.strict for auth routes: prevents rute-force attacks
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 min window
    max: 10,//only 10 attemps per 15 min
    message: {
        status: 'error',
        message: 'Too many attempts.Please try again after 15 minutes.'
    },
    standardHeaders: true,//sends rate limit info in 'Ratelimit' headers
    legacyHeaders: false,
});

//2.relaxed ratelimiter for normal api
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, //100 req per 15 min
    message: {
        status: 'error',
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});