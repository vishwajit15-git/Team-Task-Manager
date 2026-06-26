# Detailed Breakdown: `server/controllers/messages.ts`

## 1. Overview & Importance
This controller powers the "Team Chat" feature of the application. Unlike standard controllers that only handle database persistence, this controller acts as a bridge between the **REST API** (saving the message) and the **WebSocket Engine** (broadcasting the message in real-time).

**What problem it solves:**
If we only used WebSockets without saving to a database, chat history would disappear the moment you refresh the page. If we only used REST without WebSockets, you would have to refresh the page to see new messages. This controller combines both for a modern chat experience.

**Pro Upgrades Implemented:**
1.  **Strict Room Authorization:** Before allowing a user to read or send a message, we query the `Project` model and check the `members` array. If they aren't in the project, they are blocked (403 Forbidden). This prevents users from guessing project IDs and spying on private team chats.
2.  **Hybrid Real-Time Pipeline:** The `sendMessage` function first awaits `prisma.message.create()` to ensure the message is safely stored. Only *after* a successful database commit does it execute `io.to(projectId).emit()`, guaranteeing that no "ghost messages" are broadcasted if the database fails.

---

## 2. Line-by-Line Breakdown

### Get Messages
```typescript
const messages = await prisma.message.findMany({
    where: { projectId },
    include: {
        sender: { select: { id: true, name: true, avatar: true } }
    },
    orderBy: { createdAt: 'asc' } 
});
```
*   **Why we used it:** 
    *   `include.sender`: We don't just want the message text; the frontend needs the user's name and avatar to draw the chat UI.
    *   `orderBy.createdAt: 'asc'`: Standard REST APIs usually return newest data first (`desc`). However, chat applications always display the *oldest* messages at the top and *newest* at the bottom. We sort ascending so the frontend doesn't have to manually reverse the array.

### Send Message (The Hybrid approach)
```typescript
const io = req.app.get('io');
if (io) {
    io.to(projectId).emit('new_message', newMessage);
}
```
*   **Why we used it:** 
    *   Because our WebSocket server was initialized in `index.ts`, the controller doesn't inherently have access to it. We use Express's internal variable storage (`app.set` and `req.app.get`) to grab the active Socket.io instance from anywhere in our app.
    *   `io.to(projectId)` ensures that if User A is chatting in Project 1, their message is not accidentally broadcasted to User B sitting in Project 2.
