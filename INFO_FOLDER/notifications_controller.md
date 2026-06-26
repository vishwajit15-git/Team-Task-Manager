# Detailed Breakdown: `server/controllers/notifications.ts`

## 1. Overview & Importance
This controller manages the Notifications engine. It allows users to retrieve a history of their alerts, mark them as read, and clear their inbox. 

**What problem it solves:**
Without a notification system, a user would never know if they were assigned a new task unless they manually checked every single project. This controller provides the data structure needed to power a "Bell Icon" dropdown in the frontend.

**Pro Upgrades Implemented:**
1.  **Security/Ownership Checks:** A user can only fetch or modify their *own* notifications. We strictly verify `notification.userId === req.user.id` before allowing any updates.
2.  **Bulk Operations:** We implemented a `/read-all` endpoint (Quality of Life feature). Instead of forcing the frontend to loop through 50 notifications and send 50 individual `PATCH` requests, the frontend can instantly clear the queue with a single optimized Prisma `updateMany` command.

---

## 2. Line-by-Line Breakdown

### Mark All As Read
```typescript
await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true }
});
```
*   **Why we used it:** `updateMany` is extremely powerful. Instead of loading the records into server RAM and updating them one by one in a loop (which would crash the server under heavy load), `updateMany` generates a single raw SQL `UPDATE` statement that the database executes instantly. 
*   **Optimization:** We added `read: false` to the `where` clause. This tells the database to ignore notifications that are already read, saving processing time!

---

## 3. The Real-Time Trigger (How they get created)
This controller only *reads* and *updates* notifications. So where are they created?
They are dynamically generated inside **other controllers** (like `tasks.ts` and `members.ts`).

**Example Flow (Task Assignment):**
1. User A assigns Task 1 to User B (`PATCH /api/tasks/1`).
2. The `updateTask` controller creates a new record in the `Notification` table for User B.
3. The `updateTask` controller grabs the WebSocket server (`req.app.get('io')`).
4. It emits an event directly to User B's personal socket room: `io.to(User_B_ID).emit('notification', newNotification)`.
5. User B's browser instantly shows a popup alert!
