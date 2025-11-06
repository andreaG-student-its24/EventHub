# Chat Feature - EventHub

## Overview

EventHub includes a real-time, participant-only chat system for each event using Socket.IO. Only users registered as participants in an event can join the chat room and exchange messages.

---

## Architecture

### Server-Side (Node.js + Express + Socket.IO)

#### Socket.IO Integration (`server.js`)

- **HTTP Server Creation**: Uses `http.createServer(app)` with Socket.IO initialization to support real-time bidirectional communication.
- **JWT Authentication**: All socket connections are authenticated using JWT tokens passed in the handshake.
- **CORS Configuration**: Allows cross-origin socket connections for development.

#### Socket Events

The server listens for and emits the following socket events:

##### **Client → Server**

1. **`join_event`**
   - **Payload**: `{ eventId }`
   - **Purpose**: User joins the chat room for a specific event.
   - **Validation**: 
     - Checks that the event exists.
     - Verifies that the user is a registered participant.
   - **On Success**: User joins room `event:<eventId>` and receives `joined_event` confirmation.
   - **On Failure**: Emits `error_message` to the client.

2. **`chat_message`**
   - **Payload**: `{ eventId, text }`
   - **Purpose**: User sends a chat message to an event's room.
   - **Validation**:
     - Checks that `text` is not empty.
     - Verifies participant membership.
   - **Persistence**: Message is saved to MongoDB (`Message` collection) with sender and timestamp.
   - **Broadcast**: Message is broadcast to all users in the room with full sender details.
   - **On Failure**: Emits `error_message` to the user.

##### **Server → Client**

1. **`chat_message`** (broadcast to room)
   - **Payload**: `{ _id, event, sender: { _id, name, email }, text, createdAt }`
   - **Triggered**: After a message is successfully persisted.
   - **Scope**: All participants in the event's room.

2. **`error_message`**
   - **Payload**: String error description.
   - **Triggered**: On authorization failures, validation errors, or server errors.

3. **`joined_event`**
   - **Payload**: `{ eventId }`
   - **Triggered**: After user successfully joins a room.
   - **Use**: Confirms join and enables UI (send button, input field).

4. **`event_participants_update`** (broadcast to room)
   - **Payload**: `{ eventId, participants: [{ _id, name, email }, ...] }`
   - **Triggered**: When a user registers or unregisters from the event.
   - **Scope**: All participants in the room.
   - **Use**: Refreshes participant list in chat UI.

5. **`event_registration_activity`** (broadcast to room)
   - **Payload**: `{ eventId, type: 'register' | 'unregister', user: { _id, name, email } }`
   - **Triggered**: When a user registers or unregisters from the event.
   - **Scope**: All participants in the room.
   - **Use**: Shows activity notifications ("Mario si è iscritto...").

---

### Client-Side (Frontend)

#### Socket.IO Client Integration (`public/js/dashboard.js`)

**Initialization**:
```javascript
function ensureSocket() {
    if (socket) return socket;
    socket = io({
        auth: { token } // JWT passed in handshake
    });
    
    // Global listeners for notifications
    socket.on('chat_message', handleChatMessage);
    socket.on('error_message', handleError);
    socket.on('event_participants_update', refreshLists);
    socket.on('event_registration_activity', showToast);
    
    return socket;
}
```

**Opening Chat for an Event**:
```javascript
async function openChat(eventId, eventTitle) {
    activeChatEventId = eventId;
    
    // 1. Initialize socket if needed
    const s = ensureSocket();
    
    // 2. Join the event room
    s.emit('join_event', { eventId });
    
    // 3. Fetch message history (latest 50 messages)
    const resp = await fetch(`/api/events/${eventId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (resp.ok) {
        const messages = await resp.json();
        renderChatMessages(messages);
        setChatStatus('Connesso alla chat. Puoi inviare messaggi.');
        toggleChatInput(true);
    }
}
```

**Sending a Message**:
```javascript
document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const text = document.getElementById('chatInput').value.trim();
    if (!text || !activeChatEventId) return;
    
    const s = ensureSocket();
    if (!s.connected) {
        setChatStatus('Non connesso alla chat. Riprova tra poco...', true);
        return;
    }
    
    // Emit to socket
    s.emit('chat_message', { eventId: activeChatEventId, text });
    
    // Optimistic rendering (immediate UI feedback)
    appendChatMessage({
        sender: currentUser,
        text,
        createdAt: new Date().toISOString(),
        event: activeChatEventId
    });
    
    document.getElementById('chatInput').value = '';
});
```

**Receiving Messages**:
```javascript
socket.on('chat_message', (message) => {
    const eventId = message.event?._id || message.event;
    
    // Only render if the chat of this event is open
    if (!activeChatEventId || String(eventId) !== String(activeChatEventId)) {
        return;
    }
    
    // Skip if the sender is the current user (already rendered optimistically)
    if (String(message.sender._id) === String(currentUser._id)) {
        return;
    }
    
    appendChatMessage(message);
});
```

---

### Data Model (`models/Message.js`)

```javascript
const messageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Compound index for efficient queries
messageSchema.index({ event: 1, createdAt: -1 });
```

---

### API Endpoints

#### GET `/api/events/:id/messages`

**Purpose**: Retrieve chat message history for an event.

**Authentication**: Required (JWT in `Authorization` header).

**Query Parameters**:
- `limit` (optional, default 50): Maximum number of messages to retrieve.

**Access Control**: 
- Only event participants can fetch messages.
- Returns 403 if user is not a participant.

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439012",
    "sender": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Mario Rossi",
      "email": "mario@example.com"
    },
    "text": "Ciao a tutti!",
    "createdAt": "2025-11-06T10:30:00.000Z",
    "updatedAt": "2025-11-06T10:30:00.000Z"
  },
  ...
]
```

**Example**:
```bash
curl -X GET "http://localhost:5000/api/events/507f1f77bcf86cd799439012/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Registration/Unregistration Notifications

When a user registers or unregisters from an event:

1. **Backend** (`eventController.js`):
   - Saves participant change to database.
   - Emits `event_participants_update` to all participants in the room.
   - Emits `event_registration_activity` to all participants in the room.

2. **Frontend** (`dashboard.js`):
   - Displays toast notification (e.g., "📣 Mario si è iscritto ad un evento").
   - Auto-refreshes event lists to update participant counts and availability.
   - If chat for that event is open, updates the chat status bar.

---

## Security Considerations

### Access Control

1. **Socket Authentication**:
   - JWT token is verified on every socket connection.
   - Invalid/expired tokens are rejected.

2. **Room Authorization**:
   - Server verifies participant membership before allowing `join_event`.
   - Only registered participants receive messages broadcast to the room.

3. **Message Persistence**:
   - Sender is automatically set from the authenticated socket user.
   - Participant check is re-verified before message storage.

### Data Validation

- Message text is trimmed and max 2000 characters.
- Empty messages are rejected.
- Event IDs are validated against the database.

---

## User Experience Flow

### Scenario: Two Users in the Same Event

**User A**:
1. Logs in and sees "I miei eventi" (created events) and "Eventi a cui sono iscritto" (registered events).
2. For an event they're registered to, clicks "💬 Chat".
3. Chat modal opens; status shows "Connessione alla chat...".
4. Socket joins the event room; history loads; status updates to "Connesso alla chat. Puoi inviare messaggi."
5. Input field and send button are enabled.
6. Sends message: "Ciao ragazzi!" → appears immediately on their screen.

**User B** (same event):
1. Simultaneously opens the chat for the same event.
2. Joins the room and receives chat history (including User A's previous message if any).
3. Receives User A's message in real-time as it arrives on the socket.
4. Sends reply: "Ciao!" → appears immediately on their screen, broadcasted to User A.

**User A (live update)**:
- Receives User B's message in real-time.
- If User B registers or unregisters from the event while the chat is open:
  - User A sees a toast notification.
  - Chat status updates briefly.
  - Event lists refresh to show new participant count.

---

## Debugging

### Common Issues

1. **"Token non valido" error**:
   - Check that the JWT is valid and not expired.
   - Ensure the token is correctly stored in `localStorage`.

2. **"Accesso negato: non sei iscritto a questo evento"**:
   - Verify that the current user is listed in the event's `participants` array in the database.
   - Ensure you're opening the chat from "Eventi a cui sono iscritto" section.

3. **Messages not appearing on recipient**:
   - Check browser console for socket connection errors.
   - Verify that both users are in the same room (check server-side socket logs).
   - Ensure the message was successfully persisted (check MongoDB `messages` collection).

4. **Chat input disabled**:
   - Status should show "Connessione alla chat..." while joining.
   - If it shows an error, check the JavaScript console for details.
   - Reload the page and try again.

### Server-Side Logging

Enable Socket.IO debug logging in development by setting `debug: true` in Socket.IO config:

```javascript
const io = new SocketIOServer(server, {
  debug: true,
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
```

Check Node.js console output for socket events:
```
join_event event:507f1f77bcf86cd799439012
chat_message: "Ciao a tutti!" from user 507f1f77bcf86cd799439013
```

---

## Future Enhancements

- **Message Reactions**: Emoji reactions to messages.
- **Typing Indicators**: Show "X is typing..." when a participant is composing.
- **Message Editing/Deletion**: Allow users to edit or delete their own messages.
- **File Sharing**: Upload and share images/documents in chat.
- **Read Receipts**: Show message delivery and read status.
- **Mentions**: Tag users with `@username` and send notifications.
- **Message Search**: Full-text search across chat history.
- **Offline Notifications**: Badge/counter showing unread messages when chat is closed.

---

## References

- [Socket.IO Documentation](https://socket.io/)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [MongoDB Indexing](https://docs.mongodb.com/manual/indexes/)
- [JWT Authentication](https://jwt.io/)

