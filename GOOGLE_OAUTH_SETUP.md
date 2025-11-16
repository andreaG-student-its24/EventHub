# Configurazione Google OAuth per EventHub

## 📋 Prerequisiti
- Account Google
- Progetto EventHub in esecuzione

## 🔧 Passi per Configurare Google OAuth

### 1. Accedi a Google Cloud Console
Vai su: https://console.cloud.google.com/

### 2. Crea un Nuovo Progetto (o usa uno esistente)
1. Clicca su "Seleziona un progetto" in alto
2. Clicca su "NUOVO PROGETTO"
3. Nome progetto: `EventHub`
4. Clicca su "CREA"

### 3. Abilita Google+ API
1. Nel menu laterale, vai su: **API e servizi** > **Libreria**
2. Cerca "Google+ API"
3. Clicca su "Google+ API"
4. Clicca su "ABILITA"

### 4. Crea le Credenziali OAuth 2.0
1. Nel menu laterale, vai su: **API e servizi** > **Credenziali**
2. Clicca su "+ CREA CREDENZIALI"
3. Seleziona "ID client OAuth"

### 5. Configura la Schermata del Consenso
Se richiesto:
1. Clicca su "CONFIGURA SCHERMATA DEL CONSENSO"
2. Seleziona "Esterni" (o "Interni" se hai Google Workspace)
3. Compila i campi obbligatori:
   - **Nome app**: EventHub
   - **Email assistenza utente**: tua email
   - **Email contatto sviluppatore**: tua email
4. Clicca su "SALVA E CONTINUA"
5. In "Ambiti", clicca su "SALVA E CONTINUA"
6. In "Utenti test" (se esterni), aggiungi la tua email per i test
7. Clicca su "SALVA E CONTINUA"

### 6. Crea l'ID Client OAuth
1. Torna a **Credenziali**
2. Clicca su "+ CREA CREDENZIALI" > "ID client OAuth"
3. Tipo di applicazione: **Applicazione web**
4. Nome: `EventHub Web Client`
5. **Origini JavaScript autorizzate**:
   ```
   http://localhost:5000
   ```
6. **URI di reindirizzamento autorizzati**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Clicca su "CREA"

### 7. Copia le Credenziali
Apparirà un popup con:
- **ID client**: copia e incolla nel file `.env` come `GOOGLE_CLIENT_ID`
- **Segreto client**: copia e incolla nel file `.env` come `GOOGLE_CLIENT_SECRET`

### 8. Aggiorna il file .env
Modifica il file `.env` con le tue credenziali:

```env
GOOGLE_CLIENT_ID='IDclient'
GOOGLE_CLIENT_SECRET='secretclient'
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 9. Riavvia il Server
```bash
npm start
```

### 10. Testa il Login
1. Vai su: http://localhost:5000/pages/auth/login.html
2. Clicca su "Accedi con Google"
3. Autorizza l'applicazione
4. Verrai reindirizzato alla dashboard!

## 🚀 Per il Deployment (Produzione)

Quando fai il deploy su Render o altro servizio:

1. Torna su Google Cloud Console > Credenziali
2. Modifica l'ID Client OAuth
3. Aggiungi le URL di produzione:
   - **Origini JavaScript autorizzate**: `https://tuodominio.com`
   - **URI di reindirizzamento**: `https://tuodominio.com/api/auth/google/callback`
4. Aggiorna le variabili d'ambiente su Render con le stesse credenziali

## ⚠️ Note Importanti

- **NON condividere mai** le credenziali OAuth
- **NON committare** il file `.env` su GitHub (è già in `.gitignore`)
- Per test con più utenti in modalità "Esterni", devi pubblicare l'app o aggiungere gli utenti come "Utenti test"
- La modalità "Interni" funziona solo per organizzazioni Google Workspace

## 🔍 Troubleshooting

### Errore: "redirect_uri_mismatch"
- Verifica che l'URI in Google Console corrisponda esattamente a quello nel codice
- Controlla che non ci siano spazi o caratteri extra

### Errore: "Access blocked: This app's request is invalid"
- Completa la configurazione della schermata del consenso
- Verifica che gli ambiti richiesti siano corretti

### Utente non può accedere
- Se in modalità "Esterni" e non pubblicata, aggiungi l'email come "Utente test"
- Verifica che l'app non sia in modalità "In produzione" senza verifica Google

## 📚 Documentazione Ufficiale
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
