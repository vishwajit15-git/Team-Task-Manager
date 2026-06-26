# Detailed Breakdown: `server/controllers/meetings.ts`

## 1. Overview & Importance
This controller manages the creation and retrieval of Video Conference Meetings for a specific project. 

**What problem it solves:**
In a remote work environment, team members need a central place to schedule syncs. This controller links a `Meeting` directly to a `Project`, ensuring that only authorized project members can view the schedule or join the meeting.

**Pro Upgrades Implemented:**
1.  **Strict Data Parsing:** By using `z.string().datetime()` in our Zod schema, we guarantee that the frontend sends a perfectly formatted ISO-8601 date string. If they send "tomorrow", Zod rejects it immediately, preventing database crashes.
2.  **Chronological Sorting:** The `getMeetings` query sorts by `date: 'asc'`, meaning the soonest upcoming meetings always appear at the top of the list for the user.

---

## 2. Line-by-Line Breakdown

### Create Meeting
```typescript
const newMeeting = await prisma.meeting.create({
    data: {
        title: validatedData.title,
        description: validatedData.description,
        date: new Date(validatedData.date),
        projectId
    }
});
```
*   **Why we used it:** We wrap `validatedData.date` in `new Date()` to convert the validated ISO string into a native JavaScript Date object, which Prisma requires to correctly save the timestamp to the PostgreSQL database.
