# Struttura Backend EventHub

Documentazione completa dell'architettura backend del progetto EventHub.

## Struttura Directory

```
EventHub/
│
├── server.js                    # Entry point dell'applicazione
├── package.json                 # Dipendenze e script npm
├── .env                         # Variabili d'ambiente (non versionato)
├── promoteAdmin.js              # Script utility per promuovere utenti ad admin
│
├── config/
│   └── db.js                    # Configurazione connessione MongoDB
│
├── models/
│   ├── User.js                  # Schema MongoDB per utenti
│   └── Event.js                 # Schema MongoDB per eventi
│
├── controllers/
│   ├── authController.js        # Logica autenticazione
│   └── eventController.js       # Logica gestione eventi
│
├── middleware/
│   ├── authMiddleware.js        # Verifica JWT token
│   └── adminMiddleware.js       # Verifica ruolo admin
│
└── routes/
    ├── authRoutes.js            # Endpoint autenticazione
    └── eventRoutes.js           # Endpoint gestione eventi
```

## Tecnologie Utilizzate

### Core
- **Node.js**: Runtime JavaScript
- **Express 5.1.0**: Framework web
- **MongoDB**: Database NoSQL
- **Mongoose 7.6.0**: ODM per MongoDB

### Autenticazione & Sicurezza
- **jsonwebtoken 9.0.2**: Generazione e verifica JWT
- **bcrypt 6.0.0**: Hashing password
- **crypto**: Generazione token reset password (built-in Node.js)

### Email
- **nodemailer**: Invio email per reset password

### Utilities
- **dotenv 17.2.3**: Gestione variabili d'ambiente
- **cors 2.8.5**: Cross-Origin Resource Sharing

## Modelli Dati

### User Model (models/User.js)

```javascript
{
  name: String,                    // Nome utente
  email: String,                   // Email (unique, lowercase)
  password: String,                // Password hashata con bcrypt
  role: String,                    // Enum: ['user', 'admin']
  isBlocked: Boolean,              // Stato blocco utente
  blockedReason: String,           // Motivo del blocco
  resetPasswordToken: String,      // Token per reset password
  resetPasswordExpire: Date,       // Scadenza token reset
  createdAt: Date,                 // Data creazione (auto)
  updatedAt: Date                  // Data ultima modifica (auto)
}
```

**Features:**
- Pre-save hook per hash automatico password
- Index su email per query veloci
- Validazione email format

### Event Model (models/Event.js)

```javascript
{
  title: String,                   // Titolo evento
  description: String,             // Descrizione dettagliata
  date: Date,                      // Data evento
  location: String,                // Luogo evento
  category: String,                // Enum: ['workshop', 'conferenza', 'networking', 'formazione', 'altro']
  capacity: Number,                // Capacità massima
  creator: ObjectId,               // Riferimento a User
  participants: [ObjectId],        // Array riferimenti a User
  status: String,                  // Enum: ['pending', 'approved', 'rejected']
  createdAt: Date,                 // Data creazione (auto)
  updatedAt: Date                  // Data ultima modifica (auto)
}
```

**Virtual Fields:**
- `availableSpots`: Posti disponibili (capacity - participants.length)
- `isFull`: Boolean, true se evento pieno

## API Endpoints

### Autenticazione (routes/authRoutes.js)

| Metodo | Endpoint | Protezione | Descrizione |
|--------|----------|------------|-------------|
| POST | `/api/auth/register` | Nessuna | Registrazione nuovo utente |
| POST | `/api/auth/login` | Nessuna | Login e generazione JWT |
| GET | `/api/auth/profile` | JWT | Ottieni profilo utente loggato |
| POST | `/api/auth/logout` | Nessuna | Logout (client-side) |
| POST | `/api/auth/forgot-password` | Nessuna | Richiesta reset password |
| PUT | `/api/auth/reset-password/:resetToken` | Nessuna | Reset password con token |

### Eventi (routes/eventRoutes.js)

#### Endpoint Utente (Protetti con JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/events` | Lista eventi (filtrati per ruolo) |
| GET | `/api/events/:id` | Dettagli singolo evento |
| POST | `/api/events` | Crea nuovo evento |
| PUT | `/api/events/:id` | Modifica evento proprio |
| DELETE | `/api/events/:id` | Elimina evento proprio |
| POST | `/api/events/:id/register` | Iscriviti a evento |
| DELETE | `/api/events/:id/unregister` | Disiscriviti da evento |

#### Endpoint Admin (Protetti con JWT + Admin)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| PUT | `/api/events/:id/approve` | Approva evento |
| PUT | `/api/events/:id/reject` | Rifiuta evento |
| GET | `/api/events/admin/users` | Lista tutti gli utenti |
| PUT | `/api/events/admin/users/:id/block` | Blocca utente |
| PUT | `/api/events/admin/users/:id/unblock` | Sblocca utente |

## Middleware

### authMiddleware.js (protect)

Verifica la presenza e validità del JWT token:

```javascript
// Utilizzo
router.get('/profile', protect, getProfile);
```

**Funzionalità:**
- Estrae token da header `Authorization: Bearer <token>`
- Verifica validità token con JWT_SECRET
- Aggiunge `req.user` con dati utente decodificati
- Restituisce 401 se token mancante/invalido

### adminMiddleware.js (admin)

Verifica che l'utente abbia ruolo admin:

```javascript
// Utilizzo (sempre dopo protect)
router.put('/:id/approve', protect, admin, approveEvent);
```

**Funzionalità:**
- Controlla `req.user.role === 'admin'`
- Restituisce 403 se non admin
- Deve essere usato dopo `protect`

## Controllers

### authController.js

**Funzioni:**

1. **register**: Crea nuovo utente
   - Valida input
   - Hash password automatico (pre-save hook)
   - Genera JWT con ruolo
   - Blocca utenti bloccati

2. **login**: Autentica utente
   - Verifica email e password
   - Genera JWT (exp: 30 giorni)
   - Controlla se utente bloccato

3. **getProfile**: Restituisce dati utente loggato
   - Usa `req.user` da middleware protect

4. **logout**: Placeholder per logout
   - Logout gestito client-side (rimozione token)

5. **forgotPassword**: Richiesta reset password
   - Genera token crypto random
   - Salva hash token in DB
   - Invia email con link reset
   - Token valido 10 minuti

6. **resetPassword**: Reset password con token
   - Verifica token valido e non scaduto
   - Aggiorna password
   - Rimuove token reset da DB

**Email Configuration:**
```javascript
// Gmail SMTP
host: 'smtp.gmail.com'
port: 587
secure: false
auth: { user: EMAIL_USER, pass: EMAIL_PASS }
```

### eventController.js

**Funzioni Utente:**

1. **getEvents**: Lista eventi
   - Admin: tutti gli eventi
   - User: solo eventi approvati

2. **getEventById**: Dettagli evento singolo
   - Popola creator e participants

3. **createEvent**: Crea nuovo evento
   - Status: 'pending' di default
   - Creator: utente loggato

4. **updateEvent**: Modifica evento
   - Solo creator può modificare
   - Admin può modificare tutti

5. **deleteEvent**: Elimina evento
   - Solo creator può eliminare
   - Admin può eliminare tutti

6. **registerToEvent**: Iscrizione a evento
   - Verifica utente non bloccato
   - Verifica posti disponibili
   - Verifica non già iscritto

7. **unregisterFromEvent**: Disiscrizione da evento
   - Rimuove da participants array

**Funzioni Admin:**

8. **approveEvent**: Approva evento pending
   - Cambia status in 'approved'

9. **rejectEvent**: Rifiuta evento pending
   - Cambia status in 'rejected'

10. **getAllUsers**: Lista completa utenti
    - Solo per admin

11. **blockUser**: Blocca utente
    - Imposta isBlocked: true
    - Salva motivo blocco

12. **unblockUser**: Sblocca utente
    - Imposta isBlocked: false
    - Rimuove motivo blocco

## Configurazione

### File .env

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/eventhub
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

### Database Connection (config/db.js)

```javascript
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

## Script Utility

### promoteAdmin.js

Script per promuovere utenti a ruolo admin:

```bash
node promoteAdmin.js
```

**Funzionalità:**
- Connette a MongoDB
- Cerca utente per email
- Cambia role da 'user' a 'admin'
- Chiude connessione

## Server Configuration (server.js)

```javascript
// Middleware
app.use(express.json())
app.use(cors())
app.use(express.static('public'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)

// Port
const PORT = process.env.PORT || 5000
```

## Flussi di Lavoro Principali

### 1. Registrazione e Login

```
User → POST /register → Hash Password → Save to DB → Return JWT
User → POST /login → Verify Password → Return JWT → Store in localStorage
```

### 2. Reset Password

```
User → POST /forgot-password → Generate Token → Send Email
User → Click Link → PUT /reset-password/:token → Verify Token → Update Password
```

### 3. Gestione Eventi

```
User → POST /events → Status: pending → Admin Dashboard
Admin → PUT /events/:id/approve → Status: approved → Visible to Users
User → POST /events/:id/register → Add to participants → Update capacity
```

### 4. Sistema Permessi

```
Request → protect middleware → Verify JWT → req.user
Admin Route → admin middleware → Check role → Allow/Deny
```

## Best Practices Implementate

1. **Sicurezza:**
   - Password hashate con bcrypt (salt rounds: 10)
   - JWT con scadenza
   - Token reset password hash con crypto
   - Middleware di protezione su route sensibili

2. **Validazione:**
   - Email unique e lowercase
   - Enum per role, status, category
   - Required fields su campi essenziali
   - Verifica capacità eventi

3. **Error Handling:**
   - Try-catch in tutti i controller
   - Messaggi errore descrittivi
   - Status code appropriati (400, 401, 403, 404, 500)

4. **Database:**
   - Index su email per performance
   - Timestamps automatici
   - Popolazione di riferimenti (populate)
   - Virtual fields per calcoli

5. **Architettura:**
   - MVC pattern
   - Separazione concerns (routes/controllers/models)
   - Middleware riutilizzabili
   - Codice modulare

## Possibili Sviluppi Futuri

- [ ] Socket.io per notifiche real-time
- [ ] Upload immagini eventi
- [ ] Sistema commenti/recensioni
- [ ] Export calendario (iCal)
- [ ] Dashboard analytics
- [ ] API rate limiting
- [ ] Logging avanzato
- [ ] Test automatizzati
- [ ] Docker containerization
- [ ] CI/CD pipeline
