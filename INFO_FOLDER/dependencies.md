# Detailed Breakdown: Project Dependencies

## 1. Overview

This file documents the major libraries installed via `package.json`. Understanding *why* a specific dependency was chosen over its alternatives is a crucial skill for a Full-Stack Engineer and makes for great interview talking points.

---

## 2. Backend Architecture & Security

| Dependency                                | What problem it solves                                                | Why we chose it (Alternatives considered)                                                                                                                               |
| :---------------------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`express`**                     | Handles HTTP requests and routing.                                    | The absolute industry standard for Node.js. (Alternatives: Fastify, NestJS).                                                                                            |
| **`prisma` & `@prisma/client`** | Communicates with PostgreSQL. Maps SQL tables to TypeScript objects.  | Provides the best Type Safety and developer experience. Replaces the need to write raw SQL. (Alternatives: TypeORM, Sequelize).                                         |
| **`zod`**                         | Validates incoming data (like ensuring passwords are > 6 chars).      | TypeScript-first validation. Throws clean errors before bad data hits the database. (Alternatives: Joi, Yup).                                                           |
| **`bcryptjs`**                    | Hashes passwords before saving them to the database.                  | Standard security practice. We use `bcryptjs` instead of `bcrypt` because it doesn't require native C++ build tools to install, making it easier for Windows users. |
| **`jsonwebtoken`**                | Generates secure "tickets" (JWTs) to keep users logged in.            | Replaces insecure local-storage authentication. Allows stateless scaling across multiple servers.                                                                       |
| **`helmet`**                      | Secures Express apps by setting various HTTP headers.                 | Instantly protects against common web vulnerabilities like Cross-Site Scripting (XSS).                                                                                  |
| **`cors`**                        | Allows our React frontend (port 5173) to talk to Express (port 3000). | Browsers block cross-port communication by default for security. CORS fixes this.                                                                                       |
| **`express-rate-limit`**          | Prevents brute-force attacks and DDOS.                                | Automatically blocks IP addresses if they spam the login route too many times.                                                                                          |

---

## 3. Cloud & File Handling

| Dependency                        | What problem it solves                                  | Why we chose it                                                                                                                  |
| :-------------------------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| **`@aws-sdk/client-s3`**  | Uploads avatars and project files to Amazon S3.         | Replaces the old, broken method of storing files as heavy Base64 strings in the database. AWS S3 is infinitely scalable.         |
| **`@aws-sdk/client-ses`** | Sends real emails (like "Forgot Password").             | Replaces the old Resend API key approach. SES is AWS's native, highly reliable email service.                                    |
| **`multer`**              | Parses `multipart/form-data` requests (file uploads). | Express cannot read file uploads natively. Multer intercepts the file from the frontend and hands it to our AWS S3 upload logic. |

---

## 4. Frontend Ecosystem

| Dependency                          | What problem it solves                                           | Why we chose it                                                                                                                                 |
| :---------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`vite`**                  | Builds and serves the React application.                         | 10x faster than traditional `create-react-app` (Webpack) for local development.                                                               |
| **`react-router-dom`**      | Handles navigation between pages without refreshing the browser. | The industry standard for Single Page Applications (SPAs).                                                                                      |
| **`@tanstack/react-query`** | Fetches data from our Express API and caches it.                 | Eliminates the need for messy `useEffect` and `useState` fetching loops. It automatically handles loading states and background refetching. |
| **`tailwindcss`**           | Styles the UI using utility classes directly in the HTML/JSX.    | Massively speeds up development compared to writing custom `.css` files.                                                                      |
| **`shadcn` / `radix-ui`** | Pre-built, accessible UI components (buttons, dialogs).          | Gives a premium, enterprise-grade look without having to design components from scratch.                                                        |

---

## 5. Real-Time Communication

| Dependency                                     | What problem it solves                         | Why we chose it                                                                                                                                                                                                                 |
| :--------------------------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`socket.io` & `socket.io-client`** | Enables real-time bidirectional communication. | In the old project, the frontend had to "poll" the server every 3 seconds to check for new messages, which crashed the server. Socket.io keeps an open pipe, instantly pushing messages to users the millisecond they are sent. |
