# Report di Sicurezza per l'Applicazione EventHub

Questo documento riassume le vulnerabilità di sicurezza identificate durante l'analisi del codice del progetto EventHub. Le vulnerabilità sono ordinate per livello di criticità, con raccomandazioni specifiche per la risoluzione.

---

## Riepilogo Esecutivo

L'applicazione presenta una solida base per quanto riguarda la gestione delle autorizzazioni a livello di route e la sicurezza degli upload di file. Tuttavia, sono state identificate diverse vulnerabilità critiche a livello di applicazione che richiedono un intervento immediato.

Le problematiche più gravi riguardano la **mancanza di validazione dell'input** e di **meccanismi di difesa contro attacchi automatizzati (rate limiting)**, che espongono l'applicazione a una vasta gamma di rischi.

---

## Vulnerabilità Identificate

### Livello: CRITICO

#### 1. Mancanza di Validazione dell'Input
- **Rischio:** Questa è la vulnerabilità più pervasiva e grave. L'assenza di controlli sui dati inviati dagli utenti (`req.body`, `req.params`) permette attacchi come **Stored XSS** (es. nel campo `name` di un utente), salvataggio di dati corrotti, e crash del server a causa di input inaspettati.
- **File Coinvolti:** `controllers/authController.js`, `controllers/eventController.js`
- **Raccomandazione:** Implementare un middleware di validazione come `express-validator` in tutte le rotte che accettano input.

  **Esempio (in `routes/authRoutes.js`):**
  ```javascript
  // 1. Installa express-validator: npm install express-validator
  import { body } from 'express-validator';

  // 2. Applica la validazione alla rotta di registrazione
  router.post(
    '/register',
    body('email').isEmail().normalizeEmail(),
    body('name').not().isEmpty().trim().escape(),
    body('password').isLength({ min: 8 }),
    register // Il controller verrà eseguito solo se la validazione passa
  );
  ```
  È necessario creare regole di validazione per **tutti** gli input dell'utente.

#### 2. Mancanza di Rate Limiting
- **Rischio:** L'assenza di un limite alle richieste permette attacchi di tipo **brute-force** sugli endpoint di autenticazione (un attaccante può provare migliaia di password al secondo) e **abuso via email** (inondando un utente di email di reset password).
- **File Coinvolti:** `server.js`, `routes/authRoutes.js`
- **Raccomandazione:** Introdurre un middleware come `express-rate-limit` per limitare le richieste sugli endpoint sensibili.

  **Esempio (in `server.js`):**
  ```javascript
  // 1. Installa: npm install express-rate-limit
  import rateLimit from 'express-rate-limit';

  // 2. Crea un limiter per le rotte di autenticazione
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // Limita ogni IP a 100 richieste per finestra
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Troppe richieste da questo IP, riprova tra 15 minuti.'
  });

  // 3. Applica il limiter alle rotte di autenticazione
  app.use('/api/auth', authLimiter, authRoutes);
  ```

#### 3. Configurazione CORS Insicura per Socket.IO
- **Rischio:** `origin: '*'` permette a **qualsiasi sito web** di connettersi al server WebSocket. Un sito malevolo può quindi interagire con gli utenti autenticati, inviare e ricevere messaggi, e potenzialmente rubare informazioni.
- **File Coinvolti:** `server.js`
- **Raccomandazione:** Limitare le origini autorizzate a una whitelist specificata nelle variabili d'ambiente.

  **Esempio (in `server.js`):**
  ```javascript
  // In .env: ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Non autorizzato da CORS'));
        }
      },
      methods: ['GET', 'POST']
    }
  });
  ```

### Livello: ALTO

#### 1. Mancanza di Header di Sicurezza HTTP
- **Rischio:** L'assenza di header come `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` rende l'applicazione più vulnerabile ad attacchi comuni come Cross-Site Scripting (XSS) e clickjacking.
- **File Coinvolti:** `server.js`
- **Raccomandazione:** Usare il middleware `helmet` per impostare automaticamente questi header.

  **Esempio (in `server.js`):**
  ```javascript
  // 1. Installa: npm install helmet
  import helmet from 'helmet';

  // 2. Applica il middleware all'inizio della catena
  app.use(helmet());
  ```

#### 2. Durata del Token JWT Eccessivamente Lunga
- **Rischio:** Un token JWT con scadenza a **30 giorni** è un rischio enorme. Se rubato, concede a un attaccante l'accesso per un mese intero, senza possibilità di revoca.
- **File Coinvolti:** `controllers/authController.js`
- **Raccomandazione:** Ridurre drasticamente la durata del token di accesso (es. 15-60 minuti) e implementare un sistema di **Refresh Token** per mantenere le sessioni a lungo termine in modo sicuro.

  **Esempio (in `authController.js`):**
  ```javascript
  // Modifica la scadenza
  const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
      expiresIn: '15m', // <-- RIDOTTO DA 30d
    });
  };
  ```
  *(Nota: l'implementazione completa di un sistema di refresh token è più complessa e richiede un endpoint dedicato).*

#### 3. Autorizzazione Incompleta in `updateEvent`
- **Rischio:** La funzione `updateEvent` permette solo al creatore di modificare un evento, ma **non agli amministratori**. Questo è un bug di autorizzazione che impedisce la corretta gestione della piattaforma.
- **File Coinvolti:** `controllers/eventController.js`
- **Raccomandazione:** Allineare la logica a quella di `deleteEvent`, permettendo l'azione anche agli admin.

  **Esempio (in `eventController.js`):**
  ```javascript
  // In updateEvent, modifica il controllo di autorizzazione
  if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Non sei autorizzato a modificare questo evento' });
  }
  ```

### Livello: MEDIO

#### 1. User Enumeration
- **Rischio:** Endpoint come `register` e `forgotPassword` rispondono in modo diverso a seconda che un'email esista o meno nel database. Questo permette a un attaccante di scoprire quali indirizzi email sono registrati sulla piattaforma.
- **File Coinvolti:** `controllers/authController.js`
- **Raccomandazione:** Restituire sempre una risposta generica e identica.

  **Esempio (in `forgotPassword`):**
  ```javascript
  // Trova l'utente, ma non restituire 404 se non esiste
  const user = await User.findOne({ email });

  // Se l'utente esiste, procedi con l'invio dell'email...

  // In ogni caso, restituisci sempre lo stesso messaggio
  res.json({ message: 'Se un account con questa email esiste, abbiamo inviato le istruzioni per il reset.' });
  ```

#### 2. Information Disclosure negli Errori 500
- **Rischio:** In caso di errore, l'API restituisce il messaggio di errore originale (`error.message`), che può contenere informazioni sensibili sulla struttura del database o del codice.
- **File Coinvolti:** Tutti i controller.
- **Raccomandazione:** Implementare un gestore di errori globale che nasconda i dettagli in produzione.

  **Esempio (in `server.js`):**
  ```javascript
  // Aggiungi alla fine, dopo tutte le rotte
  app.use((err, req, res, next) => {
    console.error(err.stack); // Logga l'errore per il debug
    res.status(500).json({ message: 'Si è verificato un errore interno del server.' });
  });
  ```

---

## Punti di Forza Rilevati

È importante riconoscere anche le pratiche di sicurezza già implementate correttamente:

- **Hashing Sicuro delle Password:** L'uso di `bcrypt` con un "pre-save hook" nel modello `User` è corretto e sicuro.
- **Protezione delle Rotte:** L'uso dei middleware `protect` e `admin` garantisce una buona separazione dei privilegi tra utenti non autenticati, utenti normali e amministratori.
- **Gestione Sicura degli Upload:** La configurazione di `multer` è eccellente: limita la dimensione dei file, valida il tipo MIME e genera nomi casuali per prevenire attacchi comuni.
- **Autorizzazione Granulare (IDOR):** Nella maggior parte dei casi (eliminazione eventi, accesso a chat e a eventi non approvati), i controlli per prevenire IDOR sono implementati correttamente.
- **Hashing dei Token di Reset:** I token per il reset della password vengono hashati prima di essere salvati, una pratica di sicurezza eccellente.

---
Fine del report.
