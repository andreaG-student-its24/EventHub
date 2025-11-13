# 🎉 EventHub

**EventHub** è una piattaforma web completa per la gestione di eventi, con sistema di autenticazione, chat in tempo reale, segnalazioni e pannello di amministrazione.

![Node.js](https://img.shields.io/badge/Node.js-v22-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-orange)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Architettura](#-architettura)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Utilizzo](#-utilizzo)
- [Documentazione API](#-documentazione-api)
- [Funzionalità](#-funzionalità)
- [Struttura del Progetto](#-struttura-del-progetto)
- [Autenticazione e Autorizzazione](#-autenticazione-e-autorizzazione)
- [WebSocket e Chat](#-websocket-e-chat)
- [Screenshots](#-screenshots)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)

---

## ✨ Caratteristiche

- 🔐 **Autenticazione JWT** - Sistema completo di registrazione, login e recupero password
- 👥 **Gestione Utenti** - Profili utente con ruoli (user/admin)
- 📅 **Gestione Eventi** - Creazione, modifica, eliminazione eventi con upload immagini
- 🎫 **Sistema di Iscrizioni** - Registrazione e cancellazione da eventi
- 💬 **Chat in Tempo Reale** - Chat per ogni evento con Socket.IO
- 🚨 **Sistema di Segnalazioni** - Possibilità di segnalare eventi inappropriati
- 🛡️ **Pannello Admin** - Approvazione eventi, gestione segnalazioni, blocco utenti
- 📱 **Design Responsive** - Interfaccia desktop-first ottimizzata per mobile
- 📚 **API REST Complete** - 24 endpoint REST documentati con Swagger
- 🔄 **Aggiornamenti Live** - Notifiche real-time tramite WebSocket

---

## 🛠 Tecnologie Utilizzate

### Backend
- **Node.js v22** - Runtime JavaScript
- **Express 5.x** - Web framework
- **MongoDB Atlas** - Database NoSQL cloud
- **Mongoose 7.x** - ODM per MongoDB
- **Socket.IO** - Comunicazione real-time bidirezionale
- **JWT (jsonwebtoken)** - Autenticazione token-based
- **bcrypt.js** - Hashing password
- **Multer** - Upload file/immagini
- **Nodemailer** - Invio email
- **Swagger UI Express** - Documentazione API interattiva

### Frontend
- **HTML5 / CSS3** - Struttura e stili
- **JavaScript Vanilla** - Logica client-side
- **Socket.IO Client** - WebSocket client
- **Responsive Design** - Mobile-first approach

---

## 🏗 Architettura

```
EventHub/
├── config/           # Configurazioni (DB, Multer, Swagger)
├── controllers/      # Business logic
├── middleware/       # Auth e Admin middleware
├── models/           # Schema Mongoose (User, Event, Message, Report)
├── routes/           # Route Express
├── public/           # Frontend statico
│   ├── pages/       # HTML pages
│   ├── js/          # JavaScript client
│   └── css/         # Stili CSS
└── uploads/         # Immagini eventi
```

### Pattern MVC
- **Model**: Mongoose schemas (User, Event, Message, Report)
- **View**: HTML statico in `/public`
- **Controller**: Logica di business in `/controllers`

---

## 📦 Installazione

### Prerequisiti
- Node.js v22 o superiore
- Account MongoDB Atlas (o MongoDB locale)
- npm o yarn

### Procedura

1. **Clona il repository**
```bash
git clone https://github.com/andreaG-student-its24/EventHub.git
cd EventHub
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura le variabili d'ambiente**
Crea un file `.env` nella root del progetto:
```env
PORT=5000
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/eventhub
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

4. **Avvia il server**
```bash
npm start
```

5. **Accedi all'applicazione**
- **Web App**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

---

## ⚙️ Configurazione

### MongoDB Atlas
1. Crea un account su [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Configura le credenziali di accesso
4. Ottieni la connection string e inseriscila in `MONGO_URI`

### Email (Nodemailer)
Per il reset password è necessario configurare un account Gmail:
1. Abilita l'autenticazione a 2 fattori
2. Genera una password per app
3. Inserisci email e password in `EMAIL_USER` e `EMAIL_PASS`

### JWT Secret
Genera una chiave segreta forte per JWT:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 Utilizzo

### Utente Standard

1. **Registrazione**
   - Vai su `/pages/auth/register.html`
   - Inserisci nome, email e password
   - Ricevi il token JWT

2. **Login**
   - Vai su `/pages/auth/login.html`
   - Inserisci credenziali
   - Accedi alla dashboard

3. **Gestione Eventi**
   - **Dashboard Principale**: Scopri eventi disponibili
   - **I Miei Eventi**: Visualizza eventi creati e iscrizioni
   - **Crea Evento**: Compila form con titolo, descrizione, data, luogo, categoria, capienza e immagine
   - **Iscriviti**: Registrati agli eventi che ti interessano
   - **Chat**: Comunica con altri partecipanti

4. **Segnalazioni**
   - Segnala eventi inappropriati con motivo e dettagli

### Amministratore

1. **Pannello Admin**
   - Accedi a `/pages/admin.html`
   - Visualizza tutti gli eventi (pending, approved, rejected)

2. **Approvazione Eventi**
   - Approva o rifiuta eventi in pending

3. **Gestione Segnalazioni**
   - Visualizza tutte le segnalazioni
   - Cambia status (open → in_review → resolved)

4. **Gestione Utenti**
   - Visualizza lista utenti
   - Blocca/sblocca utenti
   - Promuovi utenti ad admin

---

## 📚 Documentazione API

La documentazione completa delle API REST è disponibile tramite **Swagger UI**:

### Accesso
```
http://localhost:5000/api-docs
```

### Endpoint Principali

#### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Profilo utente
- `POST /api/auth/forgot-password` - Richiedi reset password
- `PUT /api/auth/reset-password/:token` - Reset password

#### Eventi
- `GET /api/events` - Lista eventi
- `POST /api/events` - Crea evento
- `GET /api/events/:id` - Dettaglio evento
- `PUT /api/events/:id` - Modifica evento
- `DELETE /api/events/:id` - Elimina evento
- `GET /api/events/my-events` - Dashboard personale

#### Partecipazioni
- `POST /api/events/:id/register` - Iscriviti
- `DELETE /api/events/:id/unregister` - Cancella iscrizione

#### Chat
- `GET /api/events/:id/messages` - Storico messaggi

#### Segnalazioni
- `POST /api/events/:id/report` - Segnala evento

#### Admin
- `GET /api/events/admin/users` - Lista utenti
- `GET /api/events/admin/reports` - Lista segnalazioni
- `PUT /api/events/:id/approve` - Approva evento
- `PUT /api/events/:id/reject` - Rifiuta evento
- `PUT /api/events/users/:userId/block` - Blocca utente
- `PUT /api/events/users/:userId/unblock` - Sblocca utente

### Autenticazione API
Tutte le API protette richiedono un header Authorization:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🎯 Funzionalità

### Sistema di Ruoli

| Ruolo | Permessi |
|-------|----------|
| **User** | Crea eventi (in pending), iscriviti, chat, segnala |
| **Admin** | Tutti i permessi + approva/rifiuta eventi, gestisci segnalazioni, blocca utenti |

### Workflow Eventi

1. **User crea evento** → Status: `pending`
2. **Admin approva** → Status: `approved` → Visibile a tutti
3. **Admin rifiuta** → Status: `rejected` → Non visibile

### Sistema di Segnalazioni

1. **User segnala evento** → Report con motivo (abuse, violence, discrimination, other)
2. **Admin riceve notifica real-time** via WebSocket
3. **Admin gestisce** → Status: `open` → `in_review` → `resolved`

### Chat Real-time

- **Socket.IO rooms**: Ogni evento ha una room dedicata
- **Autenticazione WebSocket**: JWT token verificato su connection
- **Eventi supportati**:
  - `joinEventRoom` - Entra nella chat evento
  - `sendMessage` - Invia messaggio
  - `newMessage` - Ricevi messaggio
  - `newReport` - Notifica admin (solo admin ricevono)

---

## 📁 Struttura del Progetto

```
EventHub/
│
├── config/
│   ├── db.js                 # Connessione MongoDB
│   ├── multer.js            # Config upload immagini
│   └── swagger.js           # Config Swagger/OpenAPI
│
├── controllers/
│   ├── authController.js    # Login, register, password reset
│   └── eventController.js   # CRUD eventi, registrazioni, admin
│
├── middleware/
│   ├── authMiddleware.js    # Verifica JWT
│   └── adminMiddleware.js   # Verifica ruolo admin
│
├── models/
│   ├── User.js              # Schema utente
│   ├── Event.js             # Schema evento
│   ├── Message.js           # Schema messaggio chat
│   └── Report.js            # Schema segnalazione
│
├── routes/
│   ├── authRoutes.js        # Route autenticazione
│   └── eventRoutes.js       # Route eventi
│
├── public/
│   ├── index.html           # Homepage
│   ├── pages/
│   │   ├── dashboard.html   # Dashboard principale
│   │   ├── my-events.html   # Dashboard personale
│   │   ├── admin.html       # Pannello admin
│   │   └── auth/            # Pagine autenticazione
│   ├── js/
│   │   ├── dashboard.js     # Logica dashboard
│   │   ├── my-events.js     # Logica eventi personali
│   │   ├── admin.js         # Logica pannello admin
│   │   └── auth/            # Logica autenticazione
│   └── css/
│       └── styles.css       # Stili globali responsive
│
├── uploads/                 # Immagini eventi (generato)
├── server.js               # Entry point applicazione
├── package.json            # Dipendenze npm
├── .env                    # Variabili d'ambiente (da creare)
└── README.md              # Questo file
```

---

## 🔐 Autenticazione e Autorizzazione

### JWT (JSON Web Token)
- **Token generato** al login/registrazione
- **Payload**: `{ id: userId, role: 'user'|'admin' }`
- **Validità**: Configurabile (default: 30 giorni)
- **Storage**: LocalStorage client-side

### Password
- **Hashing**: bcrypt con salt rounds = 10
- **Validazione**: Minimo 6 caratteri
- **Reset**: Token temporaneo inviato via email

### Middleware
```javascript
// Protegge route autenticate
protect(req, res, next)

// Protegge route solo admin
admin(req, res, next)
```

---

## 🔌 WebSocket e Chat

### Eventi Socket.IO

#### Client → Server
| Evento | Payload | Descrizione |
|--------|---------|-------------|
| `joinEventRoom` | `{ eventId }` | Entra nella chat evento |
| `sendMessage` | `{ eventId, text }` | Invia messaggio |

#### Server → Client
| Evento | Payload | Descrizione |
|--------|---------|-------------|
| `newMessage` | `{ message }` | Nuovo messaggio in chat |
| `newReport` | `{ report }` | Nuova segnalazione (solo admin) |
| `eventApproved` | `{ eventId }` | Evento approvato |
| `eventRejected` | `{ eventId }` | Evento rifiutato |

### Rooms
Ogni evento ha una room dedicata: `event-${eventId}`

---

## 📸 Screenshots

### Dashboard Principale
Dashboard per la scoperta di nuovi eventi con filtri per categoria e location.

### I Miei Eventi
Visualizzazione eventi creati e iscrizioni con statistiche personali.

### Pannello Admin
Interfaccia completa per gestione eventi, segnalazioni e utenti.

### Chat Evento
Chat real-time per ogni evento con storico messaggi.

---

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Linee Guida
- Segui lo stile di codice esistente
- Aggiungi test per nuove funzionalità
- Aggiorna la documentazione
- Documenta le API con JSDoc/Swagger

---

## 🐛 Bug e Problemi

Hai trovato un bug? [Apri una issue](https://github.com/andreaG-student-its24/EventHub/issues)

---

## 📝 TODO / Roadmap

- [ ] Test automatici (Jest/Mocha)
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Paginazione eventi
- [ ] Ricerca full-text
- [ ] Notifiche push
- [ ] Sistema di recensioni eventi
- [ ] Export calendario (ICS)
- [ ] Integrazione Google Maps
- [ ] Multi-lingua (i18n)

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **ISC**.

```
Copyright (c) 2024 Andrea Giovene - ITS ICT Piemonte

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

---

## 👨‍💻 Autore

**Andrea Giovene**  
Studente ITS ICT Piemonte  
Corso: Node.js Backend Development

---

## 🙏 Ringraziamenti

- ITS ICT Piemonte per la formazione
- MongoDB Atlas per il database cloud gratuito
- La community open source per gli strumenti utilizzati

---

## 📞 Contatti

Per domande o supporto:
- 📧 Email: support@eventhub.com
- 🐙 GitHub: [@andreaG-student-its24](https://github.com/andreaG-student-its24)

---

<div align="center">

**Fatto con ❤️ e ☕ durante il corso Node.js @ ITS ICT Piemonte**

[⬆ Torna all'inizio](#-eventhub)

</div>
