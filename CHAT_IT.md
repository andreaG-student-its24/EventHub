# Chat in Tempo Reale - EventHub

## Overview

EventHub include un sistema di **chat in tempo reale** e **riservato ai partecipanti** di ogni evento, implementato con Socket.IO. Solo gli utenti registrati come partecipanti di un evento possono accedere alla chat dell'evento e scambiare messaggi.

---

## Architettura

### Backend (Node.js + Express + Socket.IO)

#### Integrazione Socket.IO (`server.js`)

- **Creazione Server HTTP**: Usa `http.createServer(app)` con Socket.IO per supportare comunicazione bidirezionale in tempo reale.
- **Autenticazione JWT**: Tutte le connessioni socket sono autenticate tramite token JWT passato nell'handshake.
- **Configurazione CORS**: Consente connessioni socket cross-origin (per sviluppo).

#### Eventi Socket

Il server ascolta e emette i seguenti eventi socket:

##### **Client → Server**

1. **`join_event`**
   - **Payload**: `{ eventId }`
   - **Scopo**: L'utente entra nella room chat di un evento specifico.
   - **Validazione**: 
     - Verifica che l'evento esista.
     - Controlla che l'utente sia registrato come partecipante.
   - **Al Successo**: L'utente entra nella room `event:<eventId>` e riceve conferma `joined_event`.
   - **In Caso di Errore**: Emette `error_message` al client.

2. **`chat_message`**
   - **Payload**: `{ eventId, text }`
   - **Scopo**: L'utente invia un messaggio chat alla room dell'evento.
   - **Validazione**:
     - Verifica che `text` non sia vuoto.
     - Controlla l'iscrizione del partecipante.
   - **Persistenza**: Il messaggio viene salvato su MongoDB (collection `Message`) con mittente e timestamp.
   - **Broadcast**: Il messaggio viene trasmesso a tutti gli utenti nella room con dettagli mittente completi.
   - **In Caso di Errore**: Emette `error_message` all'utente.

##### **Server → Client**

1. **`chat_message`** (broadcast a tutta la room)
   - **Payload**: `{ _id, event, sender: { _id, name, email }, text, createdAt }`
   - **Trigger**: Dopo che un messaggio è stato persistito con successo.
   - **Scope**: Tutti i partecipanti nella room dell'evento.

2. **`error_message`**
   - **Payload**: Descrizione errore (stringa).
   - **Trigger**: In caso di errori di autorizzazione, validazione o server.

3. **`joined_event`**
   - **Payload**: `{ eventId }`
   - **Trigger**: Dopo che l'utente ha unito una room con successo.
   - **Uso**: Conferma l'ingresso e abilita l'UI (pulsante invio, campo input).

4. **`event_participants_update`** (broadcast a tutta la room)
   - **Payload**: `{ eventId, participants: [{ _id, name, email }, ...] }`
   - **Trigger**: Quando un utente si iscrive o disiscrive dall'evento.
   - **Scope**: Tutti i partecipanti nella room.
   - **Uso**: Aggiorna la lista dei partecipanti nell'UI della chat.

5. **`event_registration_activity`** (broadcast a tutta la room)
   - **Payload**: `{ eventId, type: 'register' | 'unregister', user: { _id, name, email } }`
   - **Trigger**: Quando un utente si iscrive o disiscrive dall'evento.
   - **Scope**: Tutti i partecipanti nella room.
   - **Uso**: Mostra notifiche di attività ("Mario si è iscritto...").

---

### Frontend

#### Integrazione Client Socket.IO (`public/js/dashboard.js`)

**Inizializzazione**:
```javascript
function ensureSocket() {
    if (socket) return socket;
    socket = io({
        auth: { token } // JWT passato nell'handshake
    });
    
    // Listener globali per notifiche
    socket.on('chat_message', handleChatMessage);
    socket.on('error_message', handleError);
    socket.on('event_participants_update', refreshLists);
    socket.on('event_registration_activity', showToast);
    
    return socket;
}
```

**Apertura Chat per un Evento**:
```javascript
async function openChat(eventId, eventTitle) {
    activeChatEventId = eventId;
    
    // 1. Inizializza socket se necessario
    const s = ensureSocket();
    
    // 2. Entra nella room dell'evento
    s.emit('join_event', { eventId });
    
    // 3. Scarica cronologia messaggi (ultimi 50)
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

**Invio di un Messaggio**:
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
    
    // Emetti su socket
    s.emit('chat_message', { eventId: activeChatEventId, text });
    
    // Rendering ottimistico (feedback UI immediato)
    appendChatMessage({
        sender: currentUser,
        text,
        createdAt: new Date().toISOString(),
        event: activeChatEventId
    });
    
    document.getElementById('chatInput').value = '';
});
```

**Ricezione di Messaggi**:
```javascript
socket.on('chat_message', (message) => {
    const eventId = message.event?._id || message.event;
    
    // Renderizza solo se la chat di questo evento è aperta
    if (!activeChatEventId || String(eventId) !== String(activeChatEventId)) {
        return;
    }
    
    // Non renderizzare di nuovo se sei il mittente (già fatto in modo ottimistico)
    if (String(message.sender._id) === String(currentUser._id)) {
        return;
    }
    
    appendChatMessage(message);
});
```

---

### Modello Dati (`models/Message.js`)

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

// Indice composto per query efficienti
messageSchema.index({ event: 1, createdAt: -1 });
```

---

### API Endpoints

#### GET `/api/events/:id/messages`

**Scopo**: Recupera la cronologia dei messaggi chat di un evento.

**Autenticazione**: Richiesta (JWT nell'header `Authorization`).

**Parametri Query**:
- `limit` (opzionale, default 50): Numero massimo di messaggi da recuperare.

**Controllo di Accesso**: 
- Solo i partecipanti dell'evento possono recuperare i messaggi.
- Restituisce 403 se l'utente non è un partecipante.

**Risposta** (200 OK):
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

**Esempio**:
```bash
curl -X GET "http://localhost:5000/api/events/507f1f77bcf86cd799439012/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Considerazioni di Sicurezza

### Controllo di Accesso

1. **Autenticazione Socket**:
   - Il token JWT viene verificato su ogni connessione socket.
   - I token non validi/scaduti vengono rifiutati.

2. **Autorizzazione Room**:
   - Il server verifica l'iscrizione come partecipante prima di permettere `join_event`.
   - Solo i partecipanti registrati ricevono i messaggi trasmessi alla room.

3. **Persistenza Messaggi**:
   - Il mittente viene impostato automaticamente dall'utente socket autenticato.
   - Il controllo di iscrizione viene ri-verificato prima del salvataggio del messaggio.

### Validazione Dati

- Il testo del messaggio viene trimato e limitato a 2000 caratteri.
- I messaggi vuoti vengono rifiutati.
- Gli ID degli eventi vengono validati nel database.

---

## Flusso Utente

### Scenario: Due Utenti nello Stesso Evento

**Utente A**:
1. Accede e vede "I miei eventi" (creati) e "Eventi a cui sono iscritto" (iscrizioni).
2. Per un evento a cui è iscritto, clicca "💬 Chat".
3. Si apre il modal della chat; lo stato mostra "Connessione alla chat...".
4. Socket entra nella room; la cronologia viene caricata; lo stato si aggiorna a "Connesso alla chat. Puoi inviare messaggi."
5. Il campo input e il pulsante invio vengono abilitati.
6. Invia il messaggio "Ciao ragazzi!" → appare immediatamente sullo schermo.

**Utente B** (stesso evento):
1. Contemporaneamente apre la chat per lo stesso evento.
2. Entra nella room e riceve la cronologia chat (incluso il messaggio precedente se ci fosse).
3. Riceve il messaggio di Utente A in tempo reale quando arriva via socket.
4. Invia una risposta "Ciao!" → appare immediatamente sullo schermo, trasmesso a Utente A.

**Utente A** (aggiornamento live):
- Riceve il messaggio di Utente B in tempo reale.
- Se Utente B si iscrive/disiscrive dall'evento mentre la chat è aperta:
  - Utente A vede una notifica toast.
  - Lo stato della chat si aggiorna brevemente.
  - Gli elenchi degli eventi si aggiornano per mostrare il nuovo numero di partecipanti.

---

## Debug

### Problemi Comuni

1. **Errore "Token non valido"**:
   - Verifica che il JWT sia valido e non scaduto.
   - Assicurati che il token sia correttamente salvato in `localStorage`.

2. **Errore "Accesso negato: non sei iscritto a questo evento"**:
   - Verifica che l'utente attuale sia elencato nell'array `participants` dell'evento nel database.
   - Assicurati di aprire la chat da "Eventi a cui sono iscritto".

3. **I messaggi non compaiono nel destinatario**:
   - Controlla la console del browser per errori di connessione socket.
   - Verifica che entrambi gli utenti siano nella stessa room (controlla i log socket del server).
   - Assicurati che il messaggio sia stato correttamente persistito (controlla la collection `messages` in MongoDB).

4. **Campo chat input disabilitato**:
   - Lo stato dovrebbe mostrare "Connessione alla chat..." mentre entri.
   - Se mostra un errore, controlla la console JavaScript per dettagli.
   - Ricarica la pagina e riprova.

### Log Server

Abilita il debug Socket.IO in sviluppo settando `debug: true` nella configurazione di Socket.IO:

```javascript
const io = new SocketIOServer(server, {
  debug: true,
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
```

Controlla l'output della console Node.js per gli eventi socket:
```
join_event event:507f1f77bcf86cd799439012
chat_message: "Ciao a tutti!" from user 507f1f77bcf86cd799439013
```

---

## Miglioramenti Futuri

- **Reazioni Emoji**: Emoji reactions ai messaggi.
- **Indicatori di Digitazione**: Mostra "X sta scrivendo..." quando un partecipante compone.
- **Modifica/Eliminazione Messaggi**: Consenti agli utenti di modificare/eliminare i loro messaggi.
- **Condivisione File**: Carica e condividi immagini/documenti in chat.
- **Ricevute di Lettura**: Mostra lo stato di consegna e lettura dei messaggi.
- **Menzioni**: Tag utenti con `@username` e invia notifiche.
- **Ricerca Messaggi**: Ricerca full-text nella cronologia della chat.
- **Notifiche Offline**: Badge/contatore che mostri messaggi non letti quando la chat è chiusa.

---

## Riferimenti

- [Socket.IO Documentation](https://socket.io/)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [MongoDB Indexing](https://docs.mongodb.com/manual/indexes/)
- [JWT Authentication](https://jwt.io/)
- [EventHub NOTIFICHE.md](./NOTIFICHE.md) - Documentazione del sistema di notifiche
