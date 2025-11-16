# 🚀 EventHub - Ready for Deployment Checklist

## ✅ File Preparati per Deploy

### Configurazione Deploy
- ✅ `render.yaml` - Configurazione Render
- ✅ `.env.example` - Template variabili d'ambiente
- ✅ `.gitignore` - File esclusi da git (aggiornato)
- ✅ `package.json` - Script e engines aggiornati

### Documentazione
- ✅ `README.md` - Documentazione completa progetto
- ✅ `DEPLOY_RENDER.md` - Guida deploy passo-passo
- ✅ `GOOGLE_OAUTH_SETUP.md` - Configurazione OAuth

### Codice
- ✅ CORS configurato per produzione
- ✅ OAuth Google implementato
- ✅ Dotenv con flag `-r dotenv/config`
- ✅ Server pronto per PORT dinamica

---

## 📝 Prossimi Passi (DA FARE)

### 1. Commit e Push su GitHub

```bash
# Controlla status
git status

# Aggiungi tutti i file
git add .

# Commit
git commit -m "feat: Add OAuth Google and prepare for Render deployment

- Implement Google OAuth 2.0 authentication
- Add Passport.js strategy
- Create OAuth routes and success page
- Update User model with googleId and avatar
- Add Google login button to UI
- Configure dotenv preload
- Add render.yaml for deployment
- Update CORS for production
- Add deployment documentation
- Create .env.example template"

# Push su GitHub
git push origin main
```

### 2. Deploy su Render

Segui la guida completa: **DEPLOY_RENDER.md**

**Quick Steps:**
1. Vai su https://render.com
2. Sign up con GitHub
3. New Web Service → Connetti repository EventHub
4. Configura:
   - **Name**: eventhub
   - **Build**: npm install
   - **Start**: npm start
   - **Plan**: Free
5. Aggiungi 9 variabili d'ambiente (vedi tabella sotto)
6. Create Web Service → Deploy automatico!

---

## 🔐 Variabili d'Ambiente Render

Copia questi valori dal tuo `.env` locale:

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Nuovo |
| `PORT` | `10000` | Default Render |
| `MONGODB_URI` | `mongodb+srv://...` | Copia da .env |
| `JWT_SECRET` | `EgZjaHJvbWU...` | Copia da .env |
| `SESSION_SECRET` | `eventhub-session...` | Copia da .env |
| `EMAIL_USER` | `andrea.giovene@...` | Copia da .env |
| `EMAIL_PASSWORD` | `dwiwljyzxp...` | Copia da .env |
| `GOOGLE_CLIENT_ID` | `1073071322186...` | Copia da .env |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-JQ8NEY...` | Copia da .env |
| `GOOGLE_CALLBACK_URL` | `https://TUO-URL.onrender.com/api/auth/google/callback` | ⚠️ Aggiorna! |

---

## 🔄 Dopo il Deploy

### 1. Ottieni URL Render

Render ti assegnerà un URL tipo:
```
https://eventhub-xxxx.onrender.com
```

### 2. Aggiorna Google OAuth

**Google Cloud Console** → Credenziali → Modifica OAuth Client:

**Aggiungi Origini JavaScript:**
```
https://eventhub-xxxx.onrender.com
```

**Aggiungi URI Redirect:**
```
https://eventhub-xxxx.onrender.com/api/auth/google/callback
```

**Aggiorna su Render:**
- Vai su Environment → `GOOGLE_CALLBACK_URL`
- Cambia in: `https://eventhub-xxxx.onrender.com/api/auth/google/callback`

### 3. Testa Tutto

- [ ] Homepage carica
- [ ] Registrazione funziona
- [ ] Email verifica arriva
- [ ] Login email/password ok
- [ ] Login Google OAuth ok
- [ ] Creazione evento ok
- [ ] Upload immagine ok
- [ ] Iscrizione evento ok
- [ ] Chat real-time ok
- [ ] Pannello admin ok

---

## 🎯 URL Importanti

Una volta deployed:

| Risorsa | URL |
|---------|-----|
| **Homepage** | https://TUO-URL.onrender.com |
| **Dashboard** | https://TUO-URL.onrender.com/pages/dashboard.html |
| **Login** | https://TUO-URL.onrender.com/pages/auth/login.html |
| **API Docs** | https://TUO-URL.onrender.com/api-docs |
| **Render Dashboard** | https://dashboard.render.com |
| **Google Console** | https://console.cloud.google.com |
| **MongoDB Atlas** | https://cloud.mongodb.com |

---

## ⚠️ Note Importanti

### Piano Free Render

- **Sleep**: Server dorme dopo 15 min inattività
- **Cold Start**: Primo caricamento ~30-60 secondi
- **750h/mese**: Sufficiente per test/demo
- **512MB RAM**: Limitata ma ok per il progetto

### Mantieni Server Attivo (Opzionale)

Usa **UptimeRobot** (gratuito):
1. Crea account su https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://TUO-URL.onrender.com`
4. Interval: 5 minuti
5. Render non dormirà mai! ✅

### MongoDB Atlas

Verifica che Network Access includa:
```
IP: 0.0.0.0/0
Description: Render/All IPs
```

---

## 🚨 Troubleshooting Comune

### Deploy Fallisce

**Log**: "npm ERR! missing script: build"
**Soluzione**: Ignora, è normale. Render usa `npm install` + `npm start`

### "Application failed to respond"

**Causa**: Server non parte
**Soluzione**: Controlla Logs Render per errori

### OAuth Non Funziona

**Causa**: URL callback sbagliato
**Fix**: Verifica Google Console + variabile Render

### Socket.IO Errori CORS

**Causa**: Origin non permesso
**Fix**: Verifica `allowedOrigins` in server.js

---

## 📊 Metriche da Monitorare

Render Dashboard → Metrics:

- **CPU Usage**: Max 0.1 CPU (piano free)
- **Memory**: Max 512MB
- **HTTP Requests**: Traffico app
- **Response Time**: Performance

Se superi limiti → Considera upgrade a Starter ($7/mese)

---

## ✨ Fatto!

Una volta completati questi passi, EventHub sarà:

✅ **LIVE** e pubblicamente accessibile  
✅ **Auto-deploy** su ogni push GitHub  
✅ **Scalabile** (upgrade piano quando serve)  
✅ **Monitorato** via Render dashboard  
✅ **Documentato** con Swagger pubblico  

---

**Pronto per il deploy? Segui i passi e buona fortuna! 🚀**

Per qualsiasi problema, consulta: `DEPLOY_RENDER.md`
