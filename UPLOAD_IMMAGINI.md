# Sistema Upload Immagini Eventi - EventHub

## 📸 Funzionalità Implementata

È stato implementato un sistema completo di upload immagini per gli eventi, permettendo agli utenti di caricare foto durante la creazione e modifica degli eventi.

## ✅ Componenti Implementati

### 1. **Backend - Configurazione Multer** (`config/multer.js`)
- **Storage configurato**: Salvataggio file in `public/uploads/events/`
- **Naming convention**: `event-{timestamp}-{random}.{ext}`
- **Filtri di sicurezza**: Solo formati immagine (JPG, JPEG, PNG, GIF, WEBP)
- **Limite dimensione**: Massimo 5MB per immagine
- **Creazione automatica directory**: Se non esiste, viene creata automaticamente

```javascript
// Formati accettati
const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Limite dimensione
limits: { fileSize: 5 * 1024 * 1024 } // 5MB
```

### 2. **Routes Aggiornate** (`routes/eventRoutes.js`)
- Middleware `upload.single('image')` aggiunto a POST e PUT
- Gestione automatica del multipart/form-data

```javascript
router.post('/', protect, upload.single('image'), createEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
```

### 3. **Controller Aggiornato** (`controllers/eventController.js`)

#### **Creazione Evento**
- Salvataggio del path dell'immagine nel database
- Gestione errori con eliminazione file in caso di fallimento

#### **Modifica Evento**
- Eliminazione automatica della vecchia immagine quando viene caricata una nuova
- Gestione errori con rollback del file system

#### **Eliminazione Evento**
- Eliminazione automatica dell'immagine associata all'evento

### 4. **Frontend Dashboard** (`public/js/dashboard.js`)

#### **Form Creazione/Modifica**
- Uso di `FormData` invece di JSON per supportare file upload
- Rimozione del header `Content-Type` (gestito automaticamente da FormData)

```javascript
const formData = new FormData();
formData.append('title', document.getElementById('title').value);
formData.append('image', imageInput.files[0]); // File upload
```

#### **Visualizzazione Immagini**
- Aggiunta automatica tag `<img>` nelle card degli eventi
- Visualizzazione in tutti e tre i contesti:
  - Eventi creati dall'utente
  - Eventi a cui l'utente è iscritto
  - Eventi disponibili

### 5. **Frontend Admin** (`public/js/admin.js`)
- Visualizzazione thumbnail (100x60px) nella tabella eventi
- Immagini mostrate nella colonna del titolo evento

### 6. **HTML Aggiornato** (`public/pages/dashboard.html`)
- Campo input cambiato da `<input type="url">` a `<input type="file">`
- Attributo `accept` per filtrare solo immagini
- Messaggio informativo sui formati supportati e limiti

```html
<input type="file" id="imageFile" name="image" 
       accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
<small>Formati supportati: JPG, PNG, GIF, WEBP (max 5MB)</small>
```

### 7. **CSS Aggiornato** (`public/css/styles.css`)
- Nuovo stile `.event-image`:
  - Larghezza: 100%
  - Altezza fissa: 200px
  - Object-fit: cover (mantiene proporzioni)
- Card aggiornate con padding differenziato

```css
.event-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
}
```

### 8. **Gestione Repository** (`.gitignore`)
- Aggiunta cartella `public/uploads/` per evitare di versionare immagini caricate
- File `.gitkeep` nella directory uploads per mantenerla nel repository

## 🔒 Sicurezza

### **Validazione File**
- ✅ Solo formati immagine consentiti
- ✅ Limite dimensione 5MB
- ✅ Nomi file univoci (timestamp + random)
- ✅ Path injection prevention

### **Gestione Errori**
- ✅ Rollback file upload su errore di creazione evento
- ✅ Eliminazione vecchia immagine su aggiornamento
- ✅ Eliminazione immagine su cancellazione evento
- ✅ Try-catch su tutte le operazioni file system

## 📂 Struttura Directory

```
EventHub/
├── config/
│   └── multer.js                    # ✨ NUOVO - Configurazione upload
├── public/
│   └── uploads/
│       └── events/                  # ✨ NUOVO - Directory immagini
│           ├── .gitkeep             # ✨ NUOVO - Mantiene dir nel repo
│           └── event-*.jpg          # Immagini caricate
├── controllers/
│   └── eventController.js           # ✏️ AGGIORNATO - Gestione immagini
├── routes/
│   └── eventRoutes.js               # ✏️ AGGIORNATO - Middleware upload
└── public/
    ├── css/
    │   └── styles.css               # ✏️ AGGIORNATO - Stili immagini
    ├── js/
    │   ├── dashboard.js             # ✏️ AGGIORNATO - FormData upload
    │   └── admin.js                 # ✏️ AGGIORNATO - Visualizzazione img
    └── pages/
        └── dashboard.html           # ✏️ AGGIORNATO - Input file
```

## 🚀 Utilizzo

### **Creazione Evento con Immagine**
1. Clicca su "Crea Evento" nella dashboard
2. Compila i campi del form
3. Clicca su "Scegli file" nel campo "Immagine Evento"
4. Seleziona un'immagine (JPG, PNG, GIF, WEBP - max 5MB)
5. Clicca "Crea Evento"

### **Modifica Evento con Nuova Immagine**
1. Clicca su "Modifica" su un evento creato
2. Modifica i campi desiderati
3. Se vuoi cambiare l'immagine, seleziona un nuovo file
4. Clicca "Salva Modifiche"
5. La vecchia immagine viene eliminata automaticamente

### **Approvazione Admin**
1. Gli admin vedono le thumbnail delle immagini nella tabella eventi
2. Possono approvare/rifiutare eventi con immagini

## 🎨 Aspetto Visivo

### **Card Eventi**
```
┌─────────────────────────┐
│                         │
│   IMMAGINE EVENTO       │
│   (200px altezza)       │
│                         │
├─────────────────────────┤
│ 🎉 Titolo Evento        │
│ Badge: Categoria        │
├─────────────────────────┤
│ Descrizione...          │
│ 📅 Data                 │
│ 📍 Luogo                │
│ 👥 Partecipanti         │
├─────────────────────────┤
│ [Bottoni Azione]        │
└─────────────────────────┘
```

## 📊 Statistiche Implementazione

- **File modificati**: 8
- **File creati**: 2
- **Linee di codice aggiunte**: ~150
- **Dipendenze aggiunte**: 1 (multer)
- **Funzionalità di sicurezza**: 4
- **Test manuali richiesti**: Upload, Visualizzazione, Modifica, Eliminazione

## ✨ Miglioramenti Futuri Possibili

1. **Compressione automatica immagini** (sharp, jimp)
2. **Generazione thumbnail multiple** (small, medium, large)
3. **CDN integration** (AWS S3, Cloudinary)
4. **Crop/resize UI** prima dell'upload
5. **Multiple images per evento** (gallery)
6. **Lazy loading immagini**
7. **Placeholder mentre carica**
8. **Progressive image loading**

## 🧪 Testing Checklist

- [ ] Upload immagine in creazione evento
- [ ] Visualizzazione immagine nella dashboard
- [ ] Modifica evento con nuova immagine
- [ ] Verifica eliminazione vecchia immagine
- [ ] Eliminazione evento con immagine
- [ ] Tentativo upload file non immagine (deve fallire)
- [ ] Tentativo upload file > 5MB (deve fallire)
- [ ] Visualizzazione immagine nel pannello admin
- [ ] Eventi senza immagine (devono funzionare normalmente)

## 📝 Note Tecniche

### **Path delle Immagini**
- **Salvataggio DB**: `/uploads/events/event-123456789-987654321.jpg`
- **File system**: `./public/uploads/events/event-123456789-987654321.jpg`
- **URL browser**: `http://localhost:5000/uploads/events/event-123456789-987654321.jpg`

### **Gestione FormData**
```javascript
// ❌ NON FARE
headers: { 'Content-Type': 'application/json' }

// ✅ FARE
// Non specificare Content-Type, sarà multipart/form-data automaticamente
```

---

**Implementazione completata con successo! 🎉**

*Ultima modifica: 6 Novembre 2025*
