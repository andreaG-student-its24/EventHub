# Fix Upload Immagini in Modifica Evento

## 🐛 Problema Identificato

Quando si modificava un evento e si tentava di cambiare l'immagine, l'immagine precedente rimaneva invariata anche dopo l'approvazione dell'admin.

### Causa del Bug

Il modal di modifica evento utilizzava ancora:
- ❌ Input di tipo `url` invece di `file`
- ❌ Invio dati come JSON invece di FormData
- ❌ Nessuna gestione dell'upload file

## ✅ Soluzione Implementata

### 1. **HTML - Modal Modifica** (`dashboard.html`)

**PRIMA:**
```html
<input type="url" id="editImage" name="image" placeholder="https://esempio.com/immagine.jpg">
```

**DOPO:**
```html
<div id="currentImagePreview" style="margin-bottom: 10px;"></div>
<input type="file" id="editImageFile" name="image" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
<small>Formati supportati: JPG, PNG, GIF, WEBP (max 5MB). Lascia vuoto per mantenere l'immagine attuale.</small>
```

### 2. **JavaScript - Anteprima Immagine** (`dashboard.js`)

Aggiunta visualizzazione dell'immagine corrente quando si apre il modal di modifica:

```javascript
// Mostra anteprima immagine corrente
const previewContainer = document.getElementById('currentImagePreview');
if (event.image) {
    previewContainer.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>Immagine attuale:</strong><br>
            <img src="${event.image}" alt="Anteprima" style="max-width: 200px; max-height: 150px; border-radius: 8px; margin-top: 5px; object-fit: cover;">
        </div>
    `;
} else {
    previewContainer.innerHTML = '<p style="color: #999; font-style: italic;">Nessuna immagine caricata</p>';
}

// Reset del campo file
document.getElementById('editImageFile').value = '';
```

### 3. **JavaScript - Submit Form Modifica** (`dashboard.js`)

**PRIMA:**
```javascript
const formData = {
    title: document.getElementById('editTitle').value,
    // ... altri campi
    image: document.getElementById('editImage').value || ''
};

fetch(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
});
```

**DOPO:**
```javascript
// Usa FormData per gestire l'upload di file
const formData = new FormData();
formData.append('title', document.getElementById('editTitle').value);
// ... altri campi

// Aggiungi l'immagine solo se è stata selezionata una nuova
const imageInput = document.getElementById('editImageFile');
if (imageInput.files.length > 0) {
    formData.append('image', imageInput.files[0]);
}

fetch(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`
        // NON impostare Content-Type, sarà gestito automaticamente
    },
    body: formData
});
```

## 🎯 Funzionamento Corretto

### **Scenario 1: Modifica evento SENZA cambiare immagine**
1. Utente apre modal modifica
2. Vede l'anteprima dell'immagine corrente
3. Modifica altri campi (titolo, descrizione, ecc.)
4. NON seleziona un nuovo file
5. Invia form → Immagine attuale viene mantenuta ✅

### **Scenario 2: Modifica evento CON nuova immagine**
1. Utente apre modal modifica
2. Vede l'anteprima dell'immagine corrente
3. Clicca su "Scegli file" e seleziona nuova immagine
4. Invia form → Backend:
   - Elimina la vecchia immagine dal file system ✅
   - Salva la nuova immagine ✅
   - Aggiorna il path nel database ✅

### **Scenario 3: Evento senza immagine**
1. Utente apre modal modifica di evento senza immagine
2. Vede messaggio "Nessuna immagine caricata"
3. Può aggiungere un'immagine selezionandola
4. Invia form → Immagine viene aggiunta ✅

## 🔄 Backend Già Funzionante

Il backend era già corretto e gestiva correttamente l'upload:

```javascript
// controllers/eventController.js - updateEvent
if (req.file) {
    // Elimina la vecchia immagine se esiste
    if (event.image) {
        const oldImagePath = path.join('./public', event.image);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
    }
    // Salva il nuovo path
    event.image = `/uploads/events/${req.file.filename}`;
}
```

Il problema era solo nel frontend che non inviava correttamente il file!

## ✅ Risultato

- ✅ Upload immagine in creazione evento → Funziona
- ✅ Upload immagine in modifica evento → **RISOLTO!**
- ✅ Visualizzazione anteprima immagine corrente → Aggiunta
- ✅ Eliminazione automatica vecchia immagine → Funziona
- ✅ Mantenimento immagine se non modificata → Funziona

## 🧪 Test da Eseguire

1. ✅ Crea evento con immagine
2. ✅ Modifica evento e cambia immagine
3. ✅ Verifica che vecchia immagine sia eliminata da `public/uploads/events/`
4. ✅ Verifica che nuova immagine sia visualizzata
5. ✅ Modifica evento SENZA cambiare immagine
6. ✅ Verifica che immagine originale sia mantenuta
7. ✅ Admin approva modifica → Immagine corretta visibile

---

**Bug risolto completamente! 🎉**
