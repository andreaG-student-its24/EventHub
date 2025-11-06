// Verifica se l'utente è loggato
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/pages/auth/login.html';
}

// Variabile globale per lo stato utente
let currentUser = null;

// Carica i dati dell'utente
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            
            // Aggiorna l'interfaccia con i dati utente
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('displayName').textContent = currentUser.name;
            document.getElementById('displayEmail').textContent = currentUser.email;
            document.getElementById('displayRole').textContent = currentUser.role === 'admin' ? 'Amministratore' : 'Utente';
            
            // Mostra link admin se l'utente è admin
            if (currentUser.role === 'admin') {
                document.getElementById('adminLink').style.display = 'inline-block';
            }
            
            // Formatta la data
            const date = new Date(currentUser.createdAt);
            document.getElementById('displayDate').textContent = date.toLocaleDateString('it-IT');
            
            // Carica gli eventi
            loadUserEvents();
            loadAvailableEvents();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/auth/login.html';
        }
    } catch (error) {
        console.error('Errore nel caricamento del profilo:', error);
        window.location.href = '/pages/auth/login.html';
    }
}

// Carica eventi dell'utente (creati e iscrizioni)
async function loadUserEvents() {
    try {
        const response = await fetch('/api/events/my-events', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayCreatedEvents(data.createdEvents);
            displayRegisteredEvents(data.registeredEvents);
        }
    } catch (error) {
        console.error('Errore nel caricamento degli eventi:', error);
    }
}

// Carica tutti gli eventi disponibili con filtri opzionali
async function loadAvailableEvents(filters = {}) {
    try {
        // Costruisci query string con filtri
        const queryParams = new URLSearchParams();
        
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        if (filters.date) {
            queryParams.append('date', filters.date);
        }
        if (filters.location) {
            queryParams.append('location', filters.location);
        }
        
        const queryString = queryParams.toString();
        const url = queryString ? `/api/events?${queryString}` : '/api/events';
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const events = await response.json();
            console.log('Eventi caricati:', events.length);
            console.log('Eventi ricevuti:', events);
            displayAvailableEvents(events);
        } else {
            console.error('Errore risposta:', response.status);
            const error = await response.json();
            console.error('Dettagli errore:', error);
        }
    } catch (error) {
        console.error('Errore nel caricamento degli eventi:', error);
    }
}

// Mostra eventi creati dall'utente
function displayCreatedEvents(events) {
    const container = document.getElementById('createdEvents');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun evento creato ancora</p>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${event.title}</div>
                    <span class="event-category">${event.category}</span>
                </div>
                <span class="event-status status-${event.status}">${getStatusText(event.status)}</span>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-info">📅 ${formatDate(event.date)}</div>
            <div class="event-info">📍 ${event.location}</div>
            <div class="event-info">👥 ${event.participants.length}/${event.capacity} partecipanti</div>
            <div class="event-actions">
                <button onclick="editEvent('${event._id}')" class="btn btn-secondary">✏️ Modifica</button>
                <button onclick="deleteEvent('${event._id}')" class="btn btn-danger">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
}

// Mostra eventi a cui l'utente è iscritto
function displayRegisteredEvents(events) {
    const container = document.getElementById('registeredEvents');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessuna iscrizione ancora</p>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${event.title}</div>
                    <span class="event-category">${event.category}</span>
                </div>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-info">📅 ${formatDate(event.date)}</div>
            <div class="event-info">📍 ${event.location}</div>
            <div class="event-info">👤 Organizzatore: ${event.creator.name}</div>
            <div class="event-actions">
                <button onclick="unregisterFromEvent('${event._id}')" class="btn btn-danger">❌ Annulla iscrizione</button>
            </div>
        </div>
    `).join('');
}

// Mostra tutti gli eventi disponibili
function displayAvailableEvents(events) {
    const container = document.getElementById('availableEvents');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun evento disponibile</p>';
        return;
    }
    
    console.log('Utente corrente ID:', currentUser._id);
    
    // Filtra eventi già creati dall'utente o a cui è già iscritto
    const filteredEvents = events.filter(event => {
        const isCreator = event.creator._id.toString() === currentUser._id.toString();
        const isRegistered = event.participants.some(p => p._id.toString() === currentUser._id.toString());
        console.log(`Evento: ${event.title}, isCreator: ${isCreator}, isRegistered: ${isRegistered}`);
        return !isCreator && !isRegistered;
    });
    
    console.log('Eventi filtrati:', filteredEvents.length);
    
    // Aggiorna contatore
    const countContainer = document.getElementById('eventsCount');
    if (filteredEvents.length > 0) {
        countContainer.innerHTML = `${filteredEvents.length} evento${filteredEvents.length !== 1 ? 'i' : ''} disponibile${filteredEvents.length !== 1 ? 'i' : ''}`;
    } else {
        countContainer.innerHTML = '';
    }
    
    if (filteredEvents.length === 0) {
        // Controlla se ci sono filtri attivi
        const hasActiveFilters = document.getElementById('filterCategory').value || 
                                 document.getElementById('filterDate').value || 
                                 document.getElementById('filterLocation').value;
        
        if (hasActiveFilters) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p class="text-muted" style="font-size: 1.2em; margin-bottom: 15px;">🔍 Nessun evento trovato con i filtri selezionati</p>
                    <button onclick="document.getElementById('clearFiltersBtn').click()" class="btn btn-secondary">Rimuovi Filtri</button>
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-muted">Nessun nuovo evento disponibile</p>';
        }
        return;
    }
    
    container.innerHTML = filteredEvents.map(event => `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${event.title}</div>
                    <span class="event-category">${event.category}</span>
                </div>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-info">📅 ${formatDate(event.date)}</div>
            <div class="event-info">📍 ${event.location}</div>
            <div class="event-info">👤 Organizzatore: ${event.creator.name}</div>
            <div class="event-info">👥 ${event.participants.length}/${event.capacity} partecipanti</div>
            <div class="event-actions">
                ${event.isFull 
                    ? '<button class="btn btn-secondary" disabled>Evento al completo</button>' 
                    : `<button onclick="registerToEvent('${event._id}')" class="btn btn-primary">✅ Iscriviti</button>`
                }
            </div>
        </div>
    `).join('');
}

// Utility functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'In attesa',
        'approved': 'Approvato',
        'rejected': 'Rifiutato'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Modal gestione
const modal = document.getElementById('createEventModal');
const createBtn = document.getElementById('createEventBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelEventBtn');

createBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    document.getElementById('createEventForm').reset();
    document.getElementById('eventErrorMessage').style.display = 'none';
    document.getElementById('eventSuccessMessage').style.display = 'none';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Chiudi modal cliccando fuori (gestisce entrambi i modal)
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    if (event.target === document.getElementById('editEventModal')) {
        document.getElementById('editEventModal').style.display = 'none';
    }
});

// Form creazione evento
document.getElementById('createEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Usa FormData per gestire l'upload di file
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('date', document.getElementById('date').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('capacity', document.getElementById('capacity').value);
    
    // Aggiungi l'immagine se selezionata
    const imageInput = document.getElementById('imageFile');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // NON impostare Content-Type, sarà gestito automaticamente da FormData
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('eventSuccessMessage').textContent = 
                'Evento creato con successo! Sarà visibile dopo l\'approvazione da parte di un amministratore.';
            document.getElementById('eventSuccessMessage').style.display = 'block';
            document.getElementById('eventErrorMessage').style.display = 'none';
            
            document.getElementById('createEventForm').reset();
            
            setTimeout(() => {
                modal.style.display = 'none';
                loadUserEvents();
            }, 2000);
        } else {
            document.getElementById('eventErrorMessage').textContent = data.message || 'Errore nella creazione dell\'evento';
            document.getElementById('eventErrorMessage').style.display = 'block';
            document.getElementById('eventSuccessMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('eventErrorMessage').textContent = 'Errore di connessione al server';
        document.getElementById('eventErrorMessage').style.display = 'block';
    }
});

// Funzioni per gestione eventi
async function registerToEvent(eventId) {
    if (!confirm('Vuoi iscriverti a questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Iscrizione completata con successo!');
            loadUserEvents();
            loadAvailableEvents();
        } else {
            alert(data.message || 'Errore nell\'iscrizione');
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore di connessione al server');
    }
}

async function unregisterFromEvent(eventId) {
    if (!confirm('Vuoi annullare l\'iscrizione a questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}/unregister`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Iscrizione annullata con successo!');
            loadUserEvents();
            loadAvailableEvents();
        } else {
            alert(data.message || 'Errore nell\'annullamento');
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore di connessione al server');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Evento eliminato con successo!');
            loadUserEvents();
        } else {
            alert(data.message || 'Errore nell\'eliminazione');
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore di connessione al server');
    }
}

async function editEvent(eventId) {
    try {
        // Carica i dati dell'evento
        const response = await fetch(`/api/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            alert('Errore nel caricamento dell\'evento');
            return;
        }
        
        const event = await response.json();
        
        // Popola il form di modifica
        document.getElementById('editEventId').value = event._id;
        document.getElementById('editTitle').value = event.title;
        document.getElementById('editDescription').value = event.description;
        
        // Formatta la data per datetime-local (YYYY-MM-DDTHH:mm)
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toISOString().slice(0, 16);
        document.getElementById('editDate').value = formattedDate;
        
        document.getElementById('editCategory').value = event.category;
        document.getElementById('editLocation').value = event.location;
        document.getElementById('editCapacity').value = event.capacity;
        
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
        
        // Mostra il modal
        document.getElementById('editEventModal').style.display = 'block';
        document.getElementById('editEventErrorMessage').style.display = 'none';
        document.getElementById('editEventSuccessMessage').style.display = 'none';
        
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nel caricamento dell\'evento');
    }
}

// Modal modifica evento
const editModal = document.getElementById('editEventModal');
const closeEditBtn = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');

closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

cancelEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Form modifica evento
document.getElementById('editEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventId = document.getElementById('editEventId').value;
    
    // Usa FormData per gestire l'upload di file
    const formData = new FormData();
    formData.append('title', document.getElementById('editTitle').value);
    formData.append('description', document.getElementById('editDescription').value);
    formData.append('date', document.getElementById('editDate').value);
    formData.append('location', document.getElementById('editLocation').value);
    formData.append('category', document.getElementById('editCategory').value);
    formData.append('capacity', document.getElementById('editCapacity').value);
    
    // Aggiungi l'immagine solo se è stata selezionata una nuova
    const imageInput = document.getElementById('editImageFile');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // NON impostare Content-Type, sarà gestito automaticamente da FormData
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('editEventSuccessMessage').textContent = 
                'Evento modificato con successo! Sarà necessaria una nuova approvazione da parte di un amministratore.';
            document.getElementById('editEventSuccessMessage').style.display = 'block';
            document.getElementById('editEventErrorMessage').style.display = 'none';
            
            setTimeout(() => {
                editModal.style.display = 'none';
                loadUserEvents();
                loadAvailableEvents();
            }, 2000);
        } else {
            document.getElementById('editEventErrorMessage').textContent = data.message || 'Errore nella modifica dell\'evento';
            document.getElementById('editEventErrorMessage').style.display = 'block';
            document.getElementById('editEventSuccessMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('editEventErrorMessage').textContent = 'Errore di connessione al server';
        document.getElementById('editEventErrorMessage').style.display = 'block';
    }
});

// Gestione logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Errore durante il logout:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/auth/login.html';
});

// Gestione Filtri Eventi
document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    const filters = {
        category: document.getElementById('filterCategory').value,
        date: document.getElementById('filterDate').value,
        location: document.getElementById('filterLocation').value
    };
    
    // Rimuovi filtri vuoti
    Object.keys(filters).forEach(key => {
        if (!filters[key]) {
            delete filters[key];
        }
    });
    
    console.log('Applicazione filtri:', filters);
    loadAvailableEvents(filters);
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    // Reset dei campi filtro
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterLocation').value = '';
    
    // Ricarica tutti gli eventi
    console.log('Reset filtri');
    loadAvailableEvents();
});

// Permetti di filtrare premendo Enter nel campo location
document.getElementById('filterLocation').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('applyFiltersBtn').click();
    }
});

// Carica il profilo all'avvio
loadUserProfile();
