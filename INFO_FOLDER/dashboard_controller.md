# Detailed Breakdown: `server/controllers/dashboard.ts`

## 1. Overview & Importance
This controller powers the high-level metrics displayed on the user's dashboard (e.g., Active Projects, Open Tasks, Completed Tasks, and Team Capacity).

**What problem it solves:**
If we didn't have this controller, the React frontend would have to fetch hundreds or thousands of Tasks and Projects just to count them. That would cause massive network bloat, high memory usage in the browser, and slow loading screens. This controller uses PostgreSQL's native `count` aggregations to calculate the numbers on the database level in milliseconds, sending only a tiny JSON object back to the client.

**Pro Upgrades Implemented:**
1.  **Database-Level Aggregation (`prisma.task.count`):** PostgreSQL counts the rows natively instead of sending data payloads to the Express server.
2.  **Cross-Project Unique Constraints (Team Capacity):** To calculate Team Capacity, we fetch all projects the user belongs to, iterate through their members, and use a JavaScript `Set` (`new Set()`) to ensure we don't count the same team member twice if they are in multiple projects.

---

## 2. Line-by-Line Breakdown

### Optimal Counting
```typescript
const openTasks = await prisma.task.count({
    where: {
        assigneeId: userId,
        status: { not: 'COMPLETED' }
    }
});
```
*   **Why we used it:** The `{ not: 'COMPLETED' }` syntax is extremely powerful. Instead of checking for `status: 'TODO' OR status: 'IN_PROGRESS' OR status: 'REVIEW'`, we just ask for everything that isn't finished. It future-proofs the code in case we add more status types later.

### Deduplicating Arrays (Team Capacity)
```typescript
const uniqueMemberIds = new Set();
projects.forEach(p => p.members.forEach(m => uniqueMemberIds.add(m.id)));
const teamCapacity = uniqueMemberIds.size;
```
*   **Why we used it:** A `Set` is a data structure that strictly prevents duplicate values. If "Alice" is in Project A and Project B, her ID is only added to the Set once, giving us a highly accurate "Total Team Members" count across all of the user's projects.
