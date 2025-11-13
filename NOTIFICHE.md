# Sistema di Notifiche - EventHub

## Overview

EventHub implementa un sistema di notifiche **in tempo reale** usando Socket.IO per avvisare gli utenti di:
- **Iscrizioni** a un evento (quando qualcuno si iscrive)
- **Disiscrizioni** da un evento (quando qualcuno annulla l'iscrizione)
- **Attività nella chat** dell'evento (quando partecipanti entrano/escono)

Le notifiche si dividono in **due categorie**:
1. **Notifiche globali** → a dashboard (tutti gli utenti connessi)
2. **Notifiche event-specific** → nella chat dell'evento (solo partecipanti)

---

## Architettura

### Backend

#### Flusso di una Iscrizione

```
Laura clicks "✅ Iscriviti" event di Mario
  ↓
registerToEvent() controller
  ↓
Event.participants.push(laura._id)
  ↓
Emit 2 events:
  a) io.to(`event:${eventId}`).emit('event_registration_activity', ...)
     → Chi è nella chat dell'evento lo riceve
**2. Eventi Socket Emessi**

| Evento | Destinatari | Payload | Quando |
|--------|------------|---------|--------|
| `event_registration_activity` | Solo nella room `event:<eventId>` | `{ eventId, type: 'register'\|'unregister', user }` | Utente si/disiscrive |
| `global_registration_activity` | TUTTI i client | `{ eventId, type: 'register'\|'unregister', user }` | Utente si/disiscrive |
| `event_participants_update` | Solo nella room `event:<eventId>` | `{ eventId, participants: [...] }` | Utente si/disiscrive |

```javascript
const io = req.app?.locals?.io;
if (io) {
  const room = `event:${event._id}`;
  
  // Per chi è nella chat (chat room)
  io.to(room).emit('event_participants_update', { ... });
  io.to(room).emit('event_registration_activity', { 
    type: 'register',
    user: { _id, name, email }
  });
  
  // Per TUTTI (dashboard globale)
  io.emit('global_registration_activity', {
    type: 'register',
    user: { _id, name, email }
  });
}
```

**`controllers/eventController.js`** - `unregisterFromEvent()`: Stesso pattern con `type: 'unregister'`.

---

### Frontend

#### Listeners Socket

**File**: `public/js/dashboard.js`

**1. Listener evento chat-room**
```javascript
socket.on('event_registration_activity', ({ eventId, type, user }) => {
    // Se la chat di questo evento è aperta, aggiorna status
    if (activeChatEventId === eventId) {
        setChatStatus(`${user.name} si è ${type === 'register' ? 'iscritto' : 'discritto'}`);
    }
    
    // Aggiorna liste
    loadUserEvents();
    loadAvailableEvents();
});
```

**2. Listener notifiche globali** (NUOVO)
```javascript
socket.on('global_registration_activity', ({ eventId, type, user }) => {
    // Mostra toast (visibile ovunque sulla dashboard)
    const action = type === 'register' ? 'si è iscritto' : 'ha annullato l\'iscrizione';
    showToast(`📣 ${user.name} ${action} ad un evento`);
    
    // Aggiorna liste
    loadUserEvents();
    loadAvailableEvents();
});
```

#### Toast System

**Funzione**: `showToast(message, timeout = 3500)`

```javascript
function showToast(message, timeout = 3500) {
    // Crea elemento toast
 ✅ **Scalabilità**: Non importa quanti utenti sono connessi, solo i destinatari ricevono
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    // Mostra con animazione
    requestAnimationFrame(() => toast.classList.add('show'));
    
    // Nasconde dopo timeout
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}
```

**Stili** (`public/css/styles.css`):
```css
.toast-container {
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.85em;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    opacity: 0;
    transform: translateY(-8px);
    transition: opacity .3s ease, transform .3s ease;
}

.toast.show {
    opacity: 1;
    transform: translateY(0);
}
```

---

## Scenario Completo

### Passo 1: Configurazione Iniziale

```
Mario (admin, creatore evento)
Browser 1: localhost:5000/pages/dashboard.html
  - Logged in
  - Socket inizializzato con listener globale
  - Vede evento "Backend Workshop" in "I miei eventi creati"

Laura (utente)
Browser 2: localhost:5000/pages/dashboard.html
  - Logged in
  - Socket inizializzato con listener globale
  - Vede evento "Backend Workshop" in "Tutti gli eventi disponibili"
```

### Passo 2: Laura si Iscrive

```
Laura clicks "✅ Iscriviti" on "Backend Workshop"

Backend Flow:
├─ registerToEvent() viene eseguita
├─ laura._id added to event.participants
├─ event.save()
├─ io.to(`event:${eventId}`).emit('event_registration_activity', ...)
│  └─ Nessuno è nella chat ancora, quindi nessun effetto
└─ io.emit('global_registration_activity', ...)
   └─ Tutti i client connessi ricevono l'evento

Frontend Flow (Mario - Browser 1):
├─ socket.on('global_registration_activity', ...) triggered
├─ showToast("📣 Laura si è iscritta ad un evento") ← TOAST APPARE TOP-RIGHT
├─ loadUserEvents() → aggiorna "I miei eventi creati"
│  └─ Partecipanti: 1/30
└─ loadAvailableEvents() → aggiorna "Tutti gli eventi disponibili"
   └─ "Backend Workshop" potrebbe sparire (se Mario fosse un utente normale)

Frontend Flow (Laura - Browser 2):
├─ UI si aggiorna localmente dopo iscrizione
├─ Vede evento spostato da "Disponibili" a "Iscritti"
└─ socket.on('global_registration_activity', ...) triggered
   └─ showToast("📣 Laura si è iscritta ad un evento") ← TOAST (si auto-genera)
```

### Passo 3: Mario Apre Chat dell'Evento

```
Mario clicks "💬 Chat" on "Backend Workshop"

Frontend Flow:
├─ openChat(eventId, eventTitle)
├─ Socket joins room `event:<eventId>`
├─ Fetch GET /api/events/:id/messages → carica ultimi 50 messaggi
└─ Socket listener attivo: event_participants_update, event_registration_activity

Se ora Laura si disiscrive:
├─ backend emette: event_registration_activity with type='unregister'
├─ Mario in chat riceve: "Laura ha annullato l'iscrizione" in status bar
└─ Stesso toast globale anche a chi è sulla dashboard
```

---

## Tipi di Notifiche

### 1. Notifiche di Iscrizione/Disiscrizione (Toast)

**Quando**: Un utente si iscrive o disiscrive da un evento.

**Chi riceve**: TUTTI gli utenti connessi via socket.

**Visualizzazione**:
- Toast animato top-right
- Messaggio: "📣 [Nome Utente] si è iscritto/ha annullato l'iscrizione ad un evento"
- Scompare dopo 3.5 secondi
- Aggiorna liste (partecipanti, disponibilità evento)

**Example**:
```
Toast appare in alto a destra:
┌─────────────────────────────────┐
│ 📣 Laura si è iscritta ad un    │
│    evento                        │
└─────────────────────────────────┘
```

### 2. Notifiche di Chat (Status Bar)

**Quando**: Un partecipante si iscrive/disiscrive **mentre hai la chat aperta**.

**Chi riceve**: Solo chi è nella room della chat.

**Visualizzazione**:
- Status bar sotto il titolo della chat
- Messaggio: "[Nome Utente] si è iscritto/ha annullato l'iscrizione"
- Aggiornamento lista partecipanti

**Trigger**: Campo `activeChatEventId` ≠ null e listener `event_registration_activity` con match di eventId.

---

## Filtro Notifiche: Solo Creatore e Partecipanti

**Attualmente Implementato**: Le notifiche vengono inviate **SOLO** al creatore dell'evento e ai partecipanti interessati, **non a tutti gli utenti**.

### Come Funziona

**Backend** (`server.js` + `eventController.js`):

1. **Socket.IO Middleware** (server.js):
   ```javascript
   io.use((socket, next) => {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     socket.data.userId = decoded.id; // Salva userId per filtri successivi
     return next();
   });
   ```

2. **registerToEvent()** (eventController.js):
   ```javascript
   try {
     const io = req.app?.locals?.io;
     if (io) {
       // ... room-specific events ...
       
       // Notifica SOLO creatore e partecipanti
       const recipientIds = [
         event.creator._id.toString(), 
         ...event.participants.map(p => p._id.toString())
       ];
       
       io.sockets.sockets.forEach((socket) => {
         if (socket.data?.userId && recipientIds.includes(socket.data.userId)) {
           socket.emit('global_registration_activity', {
             eventId: String(event._id),
             type: 'register',
             user: { _id: String(req.user._id), name: req.user.name, email: req.user.email }
           });
         }
       });
     }
   } catch (e) { ... }
   ```

### Flusso

```
Laura si iscrive all'evento di Mario
  ↓
registerToEvent() controller
  ↓
Event.participants.push(laura._id)
  ↓
Raccoglia destinatari: [mario._id, laura._id, ...altri_partecipanti]
  ↓
Per OGNI socket connesso:
  - Se socket.data.userId è in destinatari → Invia global_registration_activity
  - Se socket.data.userId NON è in destinatari → Non invia nulla
  ↓
Mario vede notifica toast: "📣 Laura si è iscritta..."
Laura vede notifica toast (su evento diverso): "📣 Ti sei iscritto a..."
Giovanni (non iscritto) → NON vede nulla
```

### Benefici

✅ **Privacy**: Utenti non iscritti non vedono attività di eventi che non li riguardano  
✅ **Performance**: Meno emit, solo ai destinatari reali  
✅ **Esperienza UX**: Notifiche rilevanti solo per chi interessato  
✅ **Scalabilità**: Non importa quanti utenti sono connessi, solo i destinatari ricevono

---

## Debugging

### Notifiche non compaiono

**Checklist**:
1. ✅ Socket.IO è inizializzato? → `ensureSocket()` deve essere chiamato
2. ✅ Browser console mostra `connect` event? → Controllare Network → WS
3. ✅ User è loggato? → Token valido in localStorage
4. ✅ Server sta emettendo? → Controllare console Node.js per errori

### Verificare Socket Connection

**Browser Console** (`F12` → Console):
```javascript
// Verifica stato socket
console.log(socket ? 'Socket connesso' : 'Socket non inizializzato');
console.log(socket?.connected);

// Ascolta manualmente eventi per debug
socket.on('global_registration_activity', (data) => {
    console.log('Notifica ricevuta:', data);
});
```

### Server Logs

**Node.js Console**:
```
Registrazione di Laura:
→ emit event_registration_activity a room event:xyz
→ emit global_registration_activity a tutti

Se non vedi questi log, verifica:
- registerToEvent() è completato senza errori
- req.app.locals.io esiste
- Nessuna exception nel catch block
```

---

## Miglioramenti Futuri

1. **Notifiche Persistenti**: Salvare notifiche nel DB per utenti offline
2. **Badge Counter**: Numero notifiche non lette sulla navbar
3. **Impostazioni Notifiche**: Utente disabilita notifiche specifiche
4. **Suono**: Suono di notifica quando qualcuno si iscrive
5. **Notifiche Browser**: Push notification (se PWA)
6. **Categorizzazione**: "X si è iscritto all'evento Y" vs "Evento Y ha 3 nuovi iscritti"

---

## References

- [Socket.IO Rooms & Namespaces](https://socket.io/docs/v4/rooms/)
- [Socket.IO Broadcasting](https://socket.io/docs/v4/broadcasting-events/)
- [EventHub CHAT.md](./CHAT.md) - Documentazione dettagliata della chat

---

## Segnalazioni Evento (Report) - Notifiche agli Admin

È stato aggiunto un sistema di "segnalazione evento" che consente a qualsiasi utente di segnalare un evento per motivazioni quali abuso, violenza o discriminazione. Le segnalazioni vengono salvate nel DB e **inviate live solo agli amministratori connessi**.

### Endpoint

- POST `/api/events/:id/report`
  - Body: `{ reason: 'abuse'|'violence'|'discrimination'|'other', details?: string }`
  - Autenticazione: richiesta (JWT)
  - Risposta: 201 con `{ message: 'Segnalazione inviata', report }`

### Evento Socket Emesso

- `report_event_activity` (solo agli admin connessi)
  - Payload:
    ```json
    {
      "_id": "<reportId>",
      "event": { "_id": "<eventId>", "title": "<eventTitle>" },
      "reporter": { "_id": "<userId>", "name": "Nome" , "email": "..." },
      "reason": "abuse|violence|discrimination|other",
      "details": "...",
      "createdAt": "..."
    }
    ```

### Chi riceve

Solo gli utenti con ruolo `admin` connessi via Socket.IO riceveranno l'evento `report_event_activity`.

### Flusso Backend

1. L'utente invia POST `/api/events/:id/report` con motivo e dettagli.
2. Il controller crea il documento `Report` nel DB.
3. Il controller itera su `io.sockets.sockets` ed emette `report_event_activity` ai socket dove `socket.data.role === 'admin'`.

### Frontend

Gli admin hanno un listener socket che mostra una toast di segnalazione:

```javascript
socket.on('report_event_activity', (payload) => {
  showToast(`🚨 Segnalazione: ${payload.reporter.name} ha segnalato '${payload.event.title}' (${payload.reason})`, 8000);
});
```

### Privacy & Security

- Le segnalazioni sono memorizzate nel DB e possono essere revisionate dagli admin.
- Solo gli admin vedono le segnalazioni in tempo reale; gli utenti che segnalano non ricevono dettagli pubblici.


