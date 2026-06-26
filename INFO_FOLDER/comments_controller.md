# Detailed Breakdown: `server/controllers/comments.ts`

## 1. Overview & Importance
This controller manages threaded discussions on specific tasks. While `messages.ts` handles global project-wide chat, `comments.ts` allows users to have hyper-focused discussions (e.g., "Why is this bug happening?", "I've uploaded the new logo") attached directly to a single Kanban card.

**What problem it solves:**
By isolating comments to individual tasks, team members can collaborate asynchronously without clogging up the global project chat room. 

**Pro Upgrades Implemented:**
1.  **Deep Relational Security:** A comment belongs to a Task, but authorization is determined by the Project. To verify if a user is allowed to comment on Task A, we must look up Task A, find its parent Project, and check the Project's member array. This "Deep Relation" check ensures absolute tenant isolation.

---

## 2. Line-by-Line Breakdown

### Deep Relational Security Check
```typescript
const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } }
});

if (!task.project.members.some(m => m.id === req.user.id)) {
    throw new AppError('You do not have permission to comment here.', 403);
}
```
*   **Why we used it:** This is the most complex security check in the app. Prisma allows us to deeply nest our queries (`include -> include`). Instead of running three separate database queries (Find Task -> Find Project -> Check Members), we instruct Prisma to join all three tables in one highly efficient SQL query.

### Create Comment
```typescript
const newComment = await prisma.comment.create({
    data: {
        content: validatedData.content,
        taskId,
        authorId: req.user.id
    },
    include: { author: { select: { id: true, name: true, avatar: true } } }
});
```
*   **Why we used it:** Similar to messages, when a user creates a comment, the frontend instantly needs the new comment object to append to the UI. By using `include: { author }`, we return the fully populated comment (with the author's name and picture) in a single database transaction.
