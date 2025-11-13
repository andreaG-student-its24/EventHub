# Struttura Directory Public

La directory `public/` è stata riorganizzata per una migliore manutenibilità e organizzazione del codice.

## Struttura Attuale

```
public/
│
├── index.html                    # Homepage principale
│
├── css/
│   └── styles.css               # Tutti gli stili CSS
│
├── js/
│   ├── admin.js                 # Logica pannello admin
│   ├── dashboard.js             # Logica dashboard utente
│   │
│   └── auth/                    # Script di autenticazione
│       ├── login.js
│       ├── register.js
│       ├── forgot-password.js
│       └── reset-password.js
│
└── pages/
    ├── admin.html               # Pannello amministratore
    ├── dashboard.html           # Dashboard utente
    │
    └── auth/                    # Pagine di autenticazione
        ├── login.html
        ├── register.html
        ├── forgot-password.html
        └── reset-password.html
```

## Percorsi dei File

### Homepage (index.html)
- **CSS:** `css/styles.css`
- **Link:** 
  - Login: `pages/auth/login.html`
  - Register: `pages/auth/register.html`

### Pagine Auth (pages/auth/*.html)
- **CSS:** `../../css/styles.css`
- **JavaScript:** `../../js/auth/*.js`
- **Link interni:** percorsi relativi (es. `login.html`, `register.html`)

### Dashboard (pages/dashboard.html)
- **CSS:** `../css/styles.css`
- **JavaScript:** `../js/dashboard.js`
- **Link:**
  - Admin: `admin.html`
  - Login: `auth/login.html`

### Admin Panel (pages/admin.html)
- **CSS:** `../css/styles.css`
- **JavaScript:** `../js/admin.js`
- **Link:**
  - Dashboard: `dashboard.html`
  - Login: `auth/login.html`
   - Report segnalazioni: nuova tab "Segnalazioni" per consultare i report inviati dagli utenti

### Nuove interfacce e funzionalità front-end

- Dashboard utente (`dashboard.html` / `dashboard.js`):
   - Pulsante "🚩 Segnala" aggiunto alle card degli eventi (disponibile a tutti gli utenti).
   - Modal di segnalazione (`#reportModal`) per scegliere motivo (abuso, violenza, discriminazione, altro) e aggiungere dettagli.
   - Il client invia POST `/api/events/:id/report` con JWT; riceve conferma e mostra toast.

- Admin Panel (`admin.html` / `admin.js`):
   - Nuova tab "Segnalazioni" che mostra la lista dei report con data, evento, reporter, motivo, dettagli e stato.
   - Modal di dettaglio segnalazione con azioni: "Metti in Revisione" e "Segna come Risolta" (aggiornano lo status via API).
   - Gli admin connessi ricevono inoltre una notifica in tempo reale via Socket.IO all'arrivo di nuovi report (`report_event_activity`).

## Redirect JavaScript

Tutti i redirect nei file JavaScript utilizzano percorsi assoluti dalla root del server:

- Login: `/pages/auth/login.html`
- Dashboard: `/pages/dashboard.html`
- Admin: `/pages/admin.html`

## Vantaggi della Nuova Struttura

1. **Separazione delle Responsabilità**: 
   - CSS, JS e HTML sono separati in directory distinte
   - Script di autenticazione isolati dalla logica principale

2. **Manutenibilità**: 
   - Facile trovare e modificare file specifici
   - Struttura scalabile per futuri sviluppi

3. **Organizzazione Logica**:
   - File raggruppati per funzionalità (auth, admin, dashboard)
   - Chiara distinzione tra pagine pubbliche e autenticate

4. **Best Practices**:
   - Struttura comune in applicazioni web moderne
   - Facilita la collaborazione in team
