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

// Carica tutti gli eventi disponibili
async function loadAvailableEvents() {
    try {
        const response = await fetch('/api/events', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const events = await response.json();
            displayAvailableEvents(events);
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
    
    // Filtra eventi già creati dall'utente o a cui è già iscritto
    const filteredEvents = events.filter(event => {
        const isCreator = event.creator._id === currentUser._id;
        const isRegistered = event.participants.some(p => p._id === currentUser._id);
        return !isCreator && !isRegistered;
    });
    
    if (filteredEvents.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun nuovo evento disponibile</p>';
        return;
    }
    
    container.innerHTML = filteredEvents.map(event => `
        <div class="event-card">
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

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Form creazione evento
document.getElementById('createEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        category: document.getElementById('category').value,
        capacity: parseInt(document.getElementById('capacity').value),
        image: document.getElementById('image').value || ''
    };
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
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

function editEvent(eventId) {
    alert('Funzionalità modifica in arrivo! ID: ' + eventId);
    // TODO: Implementare modifica evento
}

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

// Carica il profilo all'avvio
loadUserProfile();
