# 📚 EventHub - Documentazione API REST

Tutte le funzionalità sono accessibili tramite API REST. Questa documentazione descrive tutti gli endpoint disponibili.

**Base URL**: `http://localhost:5000/api`

---

## 🔐 Autenticazione

Tutte le richieste (eccetto login e register) richiedono un token JWT nell'header:
```
Authorization: Bearer <your-jwt-token>
```

### **POST** `/auth/register`
Registra un nuovo utente.

**Body**:
```json
{
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "_id": "...",
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **POST** `/auth/login`
Effettua il login.

**Body**:
```json
{
  "email": "mario@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "_id": "...",
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **GET** `/auth/profile`
Ottiene il profilo dell'utente autenticato.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "...",
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "role": "user",
  "createdAt": "2025-11-13T10:00:00.000Z"
}
```

---

### **POST** `/auth/logout`
Logout (lato client elimina il token, questo endpoint è informativo).

**Response** (200):
```json
{
  "message": "Logout effettuato"
}
```

---

### **POST** `/auth/forgot-password`
Richiede reset password via email.

**Body**:
```json
{
  "email": "mario@example.com"
}
```

**Response** (200):
```json
{
  "message": "Email di reset inviata"
}
```

---

### **PUT** `/auth/reset-password/:token`
Reset password con token.

**Body**:
```json
{
  "password": "newPassword123"
}
```

**Response** (200):
```json
{
  "message": "Password aggiornata con successo"
}
```

---

## 🎉 Eventi

### **GET** `/events`
Ottiene tutti gli eventi (con filtri opzionali).

**Query Params**:
- `category` (string): Filtra per categoria
- `date` (date): Filtra per data
- `location` (string): Filtra per luogo
- `status` (string): pending|approved|rejected (solo admin vede tutti)

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "...",
    "title": "Workshop Node.js",
    "description": "Impara Node.js da zero",
    "date": "2025-11-20T14:00:00.000Z",
    "location": "Torino",
    "category": "Workshop",
    "capacity": 30,
    "participants": [...],
    "creator": {
      "_id": "...",
      "name": "Mario Rossi"
    },
    "status": "approved",
    "image": "/uploads/events/..."
  }
]
```

---

### **GET** `/events/my-events`
Ottiene eventi creati dall'utente e iscrizioni.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "createdEvents": [...],
  "registeredEvents": [...]
}
```

---

### **GET** `/events/:id`
Ottiene dettagli di un evento specifico.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "...",
  "title": "Workshop Node.js",
  "description": "...",
  "date": "2025-11-20T14:00:00.000Z",
  "location": "Torino",
  "category": "Workshop",
  "capacity": 30,
  "participants": [...],
  "creator": {...},
  "status": "approved"
}
```

---

### **POST** `/events`
Crea un nuovo evento.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body** (FormData):
```
title: "Workshop Node.js"
description: "Impara Node.js da zero"
date: "2025-11-20T14:00:00.000Z"
location: "Torino"
category: "Workshop"
capacity: 30
image: <file> (opzionale)
```

**Response** (201):
```json
{
  "_id": "...",
  "title": "Workshop Node.js",
  "status": "pending",
  ...
}
```

---

### **PUT** `/events/:id`
Modifica un evento (solo creator).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body** (FormData): Stesso di POST

**Response** (200):
```json
{
  "_id": "...",
  "title": "Workshop Node.js Aggiornato",
  ...
}
```

---

### **DELETE** `/events/:id`
Elimina un evento (creator o admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Evento eliminato con successo"
}
```

---

### **POST** `/events/:id/register`
Iscriviti a un evento.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Iscrizione completata",
  "event": {...}
}
```

---

### **DELETE** `/events/:id/unregister`
Annulla iscrizione.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Iscrizione cancellata",
  "event": {...}
}
```

---

### **GET** `/events/:id/messages`
Ottiene la cronologia chat di un evento (solo partecipanti).

**Headers**: `Authorization: Bearer <token>`

**Query Params**:
- `limit` (number, default: 50): Numero massimo di messaggi

**Response** (200):
```json
[
  {
    "_id": "...",
    "event": "...",
    "sender": {
      "_id": "...",
      "name": "Mario Rossi"
    },
    "text": "Ciao a tutti!",
    "createdAt": "2025-11-13T10:30:00.000Z"
  }
]
```

---

### **POST** `/events/:id/report`
Segnala un evento.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "reason": "abuse|violence|discrimination|other",
  "details": "Descrizione problema (opzionale)"
}
```

**Response** (201):
```json
{
  "message": "Segnalazione inviata",
  "report": {...}
}
```

---

## 👑 Admin - Gestione Eventi

### **PUT** `/events/:id/approve`
Approva un evento (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Evento approvato",
  "event": {...}
}
```

---

### **PUT** `/events/:id/reject`
Rifiuta un evento (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Evento rifiutato",
  "event": {...}
}
```

---

## 👥 Admin - Gestione Utenti

### **GET** `/events/admin/users`
Lista tutti gli utenti (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "...",
    "name": "Mario Rossi",
    "email": "mario@example.com",
    "role": "user",
    "isBlocked": false,
    "createdAt": "2025-11-13T10:00:00.000Z"
  }
]
```

---

### **PUT** `/events/users/:userId/block`
Blocca un utente (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "reason": "Comportamento inappropriato"
}
```

**Response** (200):
```json
{
  "message": "Utente bloccato",
  "user": {...}
}
```

---

### **PUT** `/events/users/:userId/unblock`
Sblocca un utente (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Utente sbloccato",
  "user": {...}
}
```

---

## 🚩 Admin - Gestione Segnalazioni

### **GET** `/events/admin/reports`
Lista tutte le segnalazioni (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "...",
    "event": {
      "_id": "...",
      "title": "Workshop Node.js"
    },
    "reporter": {
      "_id": "...",
      "name": "Mario Rossi"
    },
    "reason": "abuse",
    "details": "Contenuto inappropriato",
    "status": "open|in_review|resolved",
    "createdAt": "2025-11-13T10:00:00.000Z"
  }
]
```

---

### **GET** `/events/admin/reports/:reportId`
Dettagli di una segnalazione (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "...",
  "event": {...},
  "reporter": {...},
  "reason": "abuse",
  "details": "...",
  "status": "open"
}
```

---

### **PUT** `/events/admin/reports/:reportId/status`
Aggiorna status di una segnalazione (solo admin).

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "status": "in_review|resolved",
  "handledBy": "admin_user_id"
}
```

**Response** (200):
```json
{
  "message": "Report aggiornato",
  "report": {...}
}
```

---

## 💬 WebSocket - Chat in Tempo Reale

**Connessione**: `ws://localhost:5000` (Socket.IO)

### **Autenticazione**
Passa il token JWT durante la connessione:
```javascript
const socket = io({
  auth: { token: 'your-jwt-token' }
});
```

### **Eventi Client → Server**

#### `join_event`
Unisciti alla chat di un evento.
```javascript
socket.emit('join_event', { eventId: '...' });
```

#### `chat_message`
Invia un messaggio.
```javascript
socket.emit('chat_message', {
  eventId: '...',
  text: 'Ciao a tutti!'
});
```

---

### **Eventi Server → Client**

#### `joined_event`
Conferma ingresso nella chat.
```javascript
socket.on('joined_event', (data) => {
  console.log('Joined event:', data.eventId);
});
```

#### `chat_message`
Nuovo messaggio ricevuto.
```javascript
socket.on('chat_message', (message) => {
  console.log(message.sender.name, ':', message.text);
});
```

#### `event_participants_update`
Aggiornamento partecipanti.
```javascript
socket.on('event_participants_update', (data) => {
  console.log('Partecipanti:', data.participants);
});
```

#### `event_registration_activity`
Notifica iscrizione/cancellazione nella room evento.
```javascript
socket.on('event_registration_activity', (data) => {
  console.log(data.type, ':', data.user.name);
});
```

#### `global_registration_activity`
Notifica globale per creatore e partecipanti.
```javascript
socket.on('global_registration_activity', (data) => {
  // Solo creatore + partecipanti ricevono
});
```

#### `report_event_activity`
Notifica segnalazione (solo admin).
```javascript
socket.on('report_event_activity', (report) => {
  // Solo utenti con role='admin' ricevono
});
```

#### `error_message`
Errore durante operazioni socket.
```javascript
socket.on('error_message', (errorMsg) => {
  console.error(errorMsg);
});
```

---

## 📊 Codici di Stato HTTP

- **200** OK - Richiesta completata con successo
- **201** Created - Risorsa creata
- **400** Bad Request - Dati non validi
- **401** Unauthorized - Token mancante o non valido
- **403** Forbidden - Permessi insufficienti
- **404** Not Found - Risorsa non trovata
- **500** Internal Server Error - Errore del server

---

## 🔒 Livelli di Autorizzazione

| Endpoint | Pubblico | User | Admin |
|----------|----------|------|-------|
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| GET /auth/profile | ❌ | ✅ | ✅ |
| GET /events | ❌ | ✅ | ✅ |
| POST /events | ❌ | ✅ | ✅ |
| PUT /events/:id | ❌ | ✅ (creator) | ✅ |
| DELETE /events/:id | ❌ | ✅ (creator) | ✅ |
| POST /events/:id/register | ❌ | ✅ | ✅ |
| POST /events/:id/report | ❌ | ✅ | ✅ |
| PUT /events/:id/approve | ❌ | ❌ | ✅ |
| GET /events/admin/users | ❌ | ❌ | ✅ |
| GET /events/admin/reports | ❌ | ❌ | ✅ |
| PUT /events/users/:id/block | ❌ | ❌ | ✅ |

---

## 📝 Note Importanti

1. **File Upload**: Usa `multipart/form-data` per eventi con immagini
2. **Token JWT**: Include sempre `Authorization: Bearer <token>` negli header
3. **WebSocket**: Richiede token JWT durante la connessione
4. **Filtri Eventi**: Gli utenti normali vedono solo eventi `approved`
5. **Chat**: Accessibile solo ai partecipanti iscritti all'evento
6. **Segnalazioni**: Notifiche live solo agli admin connessi
7. **Utenti Bloccati**: Non possono creare eventi o iscriversi

---

## 🧪 Esempi di Utilizzo

### cURL - Registrazione
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Mario Rossi","email":"mario@test.com","password":"test123"}'
```

### cURL - Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mario@test.com","password":"test123"}'
```

### cURL - Ottieni Eventi
```bash
curl http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### cURL - Crea Evento con Immagine
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Workshop Node.js" \
  -F "description=Corso completo" \
  -F "date=2025-11-20T14:00:00.000Z" \
  -F "location=Torino" \
  -F "category=Workshop" \
  -F "capacity=30" \
  -F "image=@/path/to/image.jpg"
```

### JavaScript - Fetch con Token
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/events', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const events = await response.json();
```

---

**Versione**: 1.0  
**Ultimo aggiornamento**: 13 Novembre 2025  
**Server**: http://localhost:5000
