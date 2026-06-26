# Detailed Breakdown: `server/controllers/polls.ts`

## 1. Overview & Importance
This controller powers the interactive "Voting Poll" feature, allowing team members to make democratic decisions (e.g., "Which logo should we use?", "When is the deadline?").

**What problem it solves:**
Building a polling system is incredibly complex because of data normalization and race conditions. You have to store a Question, multiple Options, and track who voted for what to prevent duplicate votes. This controller handles all of that relational complexity seamlessly.

**Pro Upgrades Implemented:**
1.  **Nested Prisma Creation:** When creating a poll, we use Prisma's `create` syntax inside the `options` array to create the Poll and all of its Options in a single, atomic database transaction.
2.  **Upsert Voting Logic:** When a user votes, we use `findFirst` to check if they already voted. If they did, we `update` their existing vote instead of throwing an error. This creates a smooth UX where users can change their minds.
3.  **Real-Time Notifications:** We emit a `new_poll` WebSocket event so everyone looking at the dashboard sees the new poll instantly.

---

## 2. Line-by-Line Breakdown

### Nested Creation
```typescript
const newPoll = await prisma.poll.create({
    data: {
        question: validatedData.question,
        projectId,
        creatorId: req.user.id,
        options: {
            create: validatedData.options.map(text => ({ text }))
        }
    }
});
```
*   **Why we used it:** If we didn't do this, we would have to `create` the poll, get the generated ID, and then run a `for` loop to insert every single option individually. Prisma's nested writes handle all the foreign key linking automatically in one query.

### Smart Voting Logic
```typescript
if (existingVote) {
    await prisma.vote.update({
        where: { id: existingVote.id },
        data: { pollOptionId: optionId }
    });
} else {
    await prisma.vote.create({
        data: { userId: req.user.id, pollOptionId: optionId }
    });
}
```
*   **Why we used it:** This pattern guarantees absolute data integrity. A user can only ever have exactly 1 vote per poll in the database, but they are free to switch their vote to a different option at any time.
