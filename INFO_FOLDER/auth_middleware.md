# Detailed Breakdown: `server/middleware/auth.ts`

## 1. Overview & Importance
This file acts as the "Bouncer" for our secure API routes. Any route that requires the user to be logged in (like creating a task) will pass through this function first. 

**What problem it solves:**
In the original broken project, the frontend stored the user's ID in `localStorage` and sent it manually. This is highly insecure because hackers can easily edit `localStorage` to pretend to be someone else. We solve this by using **HttpOnly Cookies** and **JSON Web Tokens (JWTs)**. The server signs a mathematical token that cannot be forged. This middleware checks the cookie, validates the math, and figures out exactly who the user is.

---

## 2. Line-by-Line Breakdown

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
```
*   **Why we used it:** By default, Express's `Request` object does not have a `.user` property. We have to tell TypeScript: *"Hey, we are going to attach a user object to the request, so please don't throw an error."*

```typescript
const token = req.cookies.jwt;
```
*   **Why we used it:** We use `req.cookies` (made possible by the `cookie-parser` in `index.ts`) to grab the token. Because it's an HttpOnly cookie, JavaScript in the browser cannot read it, making it immune to XSS attacks.

```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
```
*   **Why we used it:** This checks if the token is valid, hasn't expired, and was actually created by our server. If a hacker tampered with the token, this function instantly throws an error and drops into the `catch` block.

```typescript
const user = await prisma.user.findUnique({
  where: { id: decoded.userId },
  select: { id: true, name: true, email: true, role: true, avatar: true },
});
```
*   **Why we used it:** We query the database to make sure the user still exists (what if they were deleted while they were logged in?). Notice the `select` block—we specifically **do not** select `passwordHash`. It is a critical security rule to never attach password hashes to request objects.

```typescript
req.user = user;
next();
```
*   **Why we used it:** `next()` is an Express function that says: *"The Bouncer has approved this person. Pass them on to the actual API route."* Now, the actual API route can easily access `req.user.id` to know exactly who is creating the task!
