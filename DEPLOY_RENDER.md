# 🚀 Guida Deploy EventHub su Render

## 📋 Prerequisiti

- Account GitHub con repository EventHub
- Account Render (gratuito): https://render.com
- MongoDB Atlas configurato (già fatto)
- Credenziali Google OAuth configurate

---

## 🔧 Passo 1: Preparazione Repository

### 1.1 Verifica che tutti i file siano committati

```bash
git status
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Verifica .gitignore

Assicurati che `.env` sia in `.gitignore` (già configurato ✅)

---

## 🌐 Passo 2: Configurazione Render

### 2.1 Crea Account su Render

1. Vai su: https://render.com
2. Clicca su **Sign Up**
3. Scegli **Sign up with GitHub**
4. Autorizza Render ad accedere al tuo GitHub

### 2.2 Crea Nuovo Web Service

1. Dalla Dashboard, clicca su **New +** → **Web Service**
2. Autorizza Render ad accedere ai tuoi repository (se richiesto)
3. Cerca e seleziona il repository **EventHub**
4. Clicca su **Connect**

### 2.3 Configura il Web Service

Compila i seguenti campi:

- **Name**: `eventhub` (o nome a tua scelta)
- **Region**: `Frankfurt (EU Central)` (o Oregon/Singapore)
- **Branch**: `main`
- **Root Directory**: lascia vuoto
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (0€/mese, con limitazioni)

---

## 🔐 Passo 3: Configurazione Variabili d'Ambiente

### 3.1 Aggiungi le Variabili

Nella sezione **Environment**, clicca su **Add Environment Variable** per ognuna:

| Key | Value | Note |
|-----|-------|------|
| `NODE_ENV` | `production` | Ambiente di produzione |
| `PORT` | `10000` | Porta di default Render |
| `MONGODB_URI` | `mongodb+srv://andreagiovene:LvV76nQtJQ.ADbx@andreagcluster.e43vw.mongodb.net/eventhub` | Copia dal tuo .env |
| `JWT_SECRET` | (copia dal tuo .env) | Chiave firma JWT |
| `SESSION_SECRET` | (copia dal tuo .env) | Chiave sessione |
| `EMAIL_USER` | `andrea.giovene@edu-its.it` | Email Gmail |
| `EMAIL_PASSWORD` | (copia dal tuo .env) | Password app Gmail |
| `GOOGLE_CLIENT_ID` | (copia dal tuo .env) | Client ID OAuth |
| `GOOGLE_CLIENT_SECRET` | (copia dal tuo .env) | Secret OAuth |
| `GOOGLE_CALLBACK_URL` | `https://eventhub-1oat.onrender.com/api/auth/google/callback` | URL callback OAuth produzione |

### 3.2 URL del Servizio Deployato

L'URL assegnato da Render è: **`https://eventhub-1oat.onrender.com`**

Aggiorna `GOOGLE_CALLBACK_URL` con questo URL:
```
https://eventhub-1oat.onrender.com/api/auth/google/callback
```

---

## 🔄 Passo 4: Aggiorna Google OAuth

### 4.1 Vai su Google Cloud Console

1. https://console.cloud.google.com/apis/credentials
2. Seleziona il tuo progetto **EventHub**
3. Clicca sul tuo **ID Client OAuth**

### 4.2 Aggiungi URL di Produzione

**Origini JavaScript autorizzate**:
```
https://eventhub-1oat.onrender.com
```

**URI di reindirizzamento autorizzati**:
```
https://eventhub-1oat.onrender.com/api/auth/google/callback
```

4. Clicca su **SALVA**

---

## 🚀 Passo 5: Deploy

1. Clicca su **Create Web Service** in fondo alla pagina
2. Render inizierà il deploy automaticamente
3. Attendi 2-5 minuti per il completamento

### 5.1 Verifica il Deploy

Nel log dovresti vedere:
```
Server in esecuzione sulla porta 10000
MongoDB Connesso: andreagcluster-shard-00-01...
```

---

## ✅ Passo 6: Test dell'Applicazione

### 6.1 Apri l'applicazione

Vai su: `https://eventhub-1oat.onrender.com`

### 6.2 Testa le funzionalità

1. **Registrazione**: Crea nuovo account
2. **Login tradizionale**: Verifica email/password
3. **Login Google**: Testa OAuth
4. **Creazione eventi**: Verifica CRUD eventi
5. **Chat**: Testa Socket.IO (importante!)

---

## ⚠️ Limitazioni Piano Free

- **Sleep dopo 15 minuti** di inattività
- **750 ore/mese** di runtime (sufficiente per test)
- **Primo avvio lento** dopo sleep (30-60 secondi)
- **512MB RAM** e **0.1 CPU**

### Soluzione Sleep:
Puoi usare un servizio come **UptimeRobot** per fare ping ogni 10 minuti e mantenere attivo il servizio.

---

## 🔍 Troubleshooting

### Errore: "Application failed to respond"

**Causa**: La porta non è configurata correttamente

**Soluzione**: Verifica che `process.env.PORT || 5000` sia in `server.js`

```javascript
const PORT = process.env.PORT || 5000;
```

### Errore: "MongoDB connection failed"

**Causa**: MONGODB_URI non configurato o IP non whitelistato

**Soluzione**:
1. Vai su MongoDB Atlas
2. Network Access → Add IP Address
3. Aggiungi: `0.0.0.0/0` (tutti gli IP)

### Errore OAuth: "redirect_uri_mismatch"

**Causa**: URL callback non corretto in Google Console

**Soluzione**: Verifica che l'URI in Google Console corrisponda ESATTAMENTE a quello in produzione

### Socket.IO non funziona

**Causa**: CORS non configurato per dominio produzione

**Soluzione**: Aggiorna server.js:

```javascript
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://eventhub-1oat.onrender.com' 
      : '*',
    methods: ['GET', 'POST']
  }
});
```

---

## 📊 Monitoraggio

### Logs

1. Dashboard Render → Seleziona il tuo servizio
2. Tab **Logs** → Vedi log in tempo reale
3. Cerca errori o warning

### Metriche

1. Tab **Metrics** → CPU, RAM, traffico
2. Verifica che non superi i limiti del piano free

---

## 🔄 Aggiornamenti Futuri

Ogni volta che fai modifiche al codice:

```bash
git add .
git commit -m "Descrizione modifiche"
git push origin main
```

Render farà **auto-deploy automatico** 🎉

---

## 🎯 Prossimi Passi (Opzionali)

### 1. Dominio Personalizzato

Render Free permette domini custom:
1. Settings → Custom Domain
2. Aggiungi il tuo dominio
3. Configura DNS (CNAME o A record)

### 2. Piano a Pagamento

Se hai traffico consistente, considera l'upgrade:
- **Starter** (7$/mese): No sleep, 512MB RAM
- **Standard** (25$/mese): 2GB RAM, scalabilità

### 3. CDN per Immagini

Per upload immagini, usa:
- **Cloudinary** (gratis fino a 25GB)
- **AWS S3** (pay-per-use)

---

## 📚 Documentazione Utile

- [Render Docs](https://render.com/docs)
- [Deploy Node.js](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

---

## ✅ Checklist Finale

Prima di considerare il deploy completo:

- [ ] Repository pushato su GitHub
- [ ] Web Service creato su Render
- [ ] Tutte le variabili d'ambiente configurate
- [ ] Google OAuth aggiornato con URL produzione
- [ ] Deploy completato con successo
- [ ] Homepage accessibile
- [ ] Registrazione funzionante
- [ ] Login (email + Google) funzionante
- [ ] CRUD eventi funzionante
- [ ] Chat real-time funzionante
- [ ] Upload immagini funzionante
- [ ] Email di verifica funzionante

---

## 🎉 Congratulazioni!

Il tuo EventHub è ora **LIVE** e accessibile pubblicamente! 🚀

**Link Produzione:** https://eventhub-1oat.onrender.com

**Documentazione API:** https://eventhub-1oat.onrender.com/api-docs
