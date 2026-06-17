# Detailed Breakdown: `server/lib/prisma.ts`

## 1. Overview & Importance
This file is incredibly simple but incredibly important. It instantiates (starts up) the Prisma Client that we use to talk to the database.

**What problem it solves:**
If we created a `new PrismaClient()` inside every single route file (`auth.ts`, `tasks.ts`, `projects.ts`), we would accidentally open hundreds of separate database connections to AWS. AWS RDS would eventually crash from "Too many connections." By creating it exactly once in this file and exporting it, we use a single, shared connection pool across our entire Express app (the "Singleton" pattern).

---

## 2. Line-by-Line Breakdown
```typescript
import { PrismaClient } from '@prisma/client';
```
*   Imports the auto-generated TypeScript client that was created when you ran `npx prisma generate`.

```typescript
export const prisma = new PrismaClient();
```
*   Creates exactly one instance of the client. Any file that needs to talk to the database will now `import { prisma } from '../lib/prisma';`.
