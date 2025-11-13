// Verifica se l'utente è loggato
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/pages/auth/login.html';
}

// Variabili globali
let currentUser = null;
let socket = null;
let activeChatEventId = null;

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
                <button onclick="openReportModal('${event._id}', '${event.title.replace(/'/g, "\'")}')" class="btn btn-warning">🚩 Segnala</button>
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
                <button onclick="openChat('${event._id}', '${event.title.replace(/'/g, "\'")}')" class="btn btn-primary">💬 Chat</button>
                <button onclick="unregisterFromEvent('${event._id}')" class="btn btn-danger">❌ Annulla iscrizione</button>
                <button onclick="openReportModal('${event._id}', '${event.title.replace(/'/g, "\'")}')" class="btn btn-warning">🚩 Segnala</button>
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
    
    // Filtra solo eventi a cui l'utente è già iscritto
    // NOTA: Ora il creatore può iscriversi al proprio evento!
    const filteredEvents = events.filter(event => {
        const isRegistered = event.participants.some(p => p._id.toString() === currentUser._id.toString());
        console.log(`Evento: ${event.title}, isRegistered: ${isRegistered}`);
        return !isRegistered; // Mostra solo eventi a cui NON è già iscritto
    });
    
    console.log('Eventi disponibili per iscrizione:', filteredEvents.length);
    
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
    
    container.innerHTML = filteredEvents.map(event => {
        const isMyEvent = event.creator._id.toString() === currentUser._id.toString();
        
        return `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${event.title}</div>
                    <span class="event-category">${event.category}</span>
                    ${isMyEvent ? '<span class="badge badge-creator">👤 Tuo Evento</span>' : ''}
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
                        <button onclick="openReportModal('${event._id}', '${event.title.replace(/'/g, "\'")}')" class="btn btn-warning">🚩 Segnala</button>
            </div>
        </div>
        `;
    }).join('');
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
// Selettore più specifico per evitare conflitti con il bottone close della chat
const closeBtn = document.querySelector('#createEventModal .close');
const cancelBtn = document.getElementById('cancelEventBtn');

createBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    document.getElementById('createEventForm').reset();
    hideMessage('eventErrorMessage');
    hideMessage('eventSuccessMessage');
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Helper per mostrare/nascondere messaggi con classi CSS
function showMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.remove('error', 'success', 'show');
    el.classList.add(isError ? 'error' : 'success', 'show');
}

function hideMessage(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove('show');
}

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
            showMessage('eventSuccessMessage',
                'Evento creato con successo! Sarà visibile dopo l\'approvazione da parte di un amministratore.');
            document.getElementById('createEventForm').reset();
            
            setTimeout(() => {
                modal.style.display = 'none';
                loadUserEvents();
            }, 2000);
        } else {
            showMessage('eventErrorMessage', data.message || 'Errore nella creazione dell\'evento', true);
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('eventErrorMessage', 'Errore di connessione al server', true);
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
        hideMessage('editEventErrorMessage');
        hideMessage('editEventSuccessMessage');
        
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
            showMessage('editEventSuccessMessage',
                'Evento modificato con successo! Sarà necessaria una nuova approvazione da parte di un amministratore.');
            
            setTimeout(() => {
                editModal.style.display = 'none';
                loadUserEvents();
                loadAvailableEvents();
            }, 2000);
        } else {
            showMessage('editEventErrorMessage', data.message || 'Errore nella modifica dell\'evento', true);
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('editEventErrorMessage', 'Errore di connessione al server', true);
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

// =====================
// Chat per evento
// =====================

function ensureSocket() {
    if (socket) return socket;
    // socket.io client è esposto su window.io (incluso nella pagina)
    socket = io({
        auth: { token }
    });

    socket.on('connect_error', (err) => {
        console.error('Errore connessione socket:', err.message);
        setChatStatus(`Errore connessione socket: ${err.message}`, true);
    });

    socket.on('chat_message', (message) => {
        // Mostra solo se la chat aperta è dello stesso evento
        const eventId = (message.event && (message.event._id || message.event)) || message.eventId;
        if (!activeChatEventId || eventId !== activeChatEventId) return;
        // Evita duplicati per il mittente: abbiamo già fatto render ottimistico
        const senderId = message && message.sender && (message.sender._id || message.sender);
        if (currentUser && senderId && String(senderId) === String(currentUser._id)) {
            return;
        }
        appendChatMessage(message);
    });

    socket.on('joined_event', ({ eventId }) => {
        if (activeChatEventId === eventId) {
            setChatStatus('Connesso alla chat. Puoi inviare messaggi.');
            toggleChatInput(true);
        }
    });

    socket.on('error_message', (msg) => {
        console.warn('Socket errore:', msg);
        setChatStatus(msg, true);
        toggleChatInput(false);
    });

    // Notifiche live iscrizione/disiscrizione
    socket.on('event_registration_activity', ({ eventId, type, user }) => {
        // Notifica testuale
        const action = type === 'register' ? 'si è iscritto' : 'ha annullato l\'iscrizione';
        showToast(`📣 ${user?.name || 'Utente'} ${action} ad un evento`);

        // Se la chat aperta è quella dell'evento, mostra stato
        if (activeChatEventId && String(activeChatEventId) === String(eventId)) {
            setChatStatus(`${user?.name || 'Un partecipante'} ${action}`, false);
        }

        // Aggiorna le liste per riflettere capacità e iscrizioni
        try {
            loadUserEvents();
            loadAvailableEvents();
        } catch {}
    });

    socket.on('event_participants_update', ({ eventId, participants }) => {
        // Potremmo aggiornare badge/contatori in tempo reale. Per ora ricarichiamo liste.
        try {
            loadUserEvents();
            loadAvailableEvents();
        } catch {}
    });

    // NUOVO: Listener globale per notifiche (non solo nella chat room)
    socket.on('global_registration_activity', ({ eventId, type, user }) => {
        // Notifica testuale globale
        const action = type === 'register' ? 'si è iscritto' : 'ha annullato l\'iscrizione';
        showToast(`📣 ${user?.name || 'Utente'} ${action} ad un evento`);

        // Aggiorna le liste
        try {
            loadUserEvents();
            loadAvailableEvents();
        } catch {}
    });

    // Listener per segnalazioni ricevute dagli admin
    socket.on('report_event_activity', (payload) => {
        // Solo gli admin devono vedere questa notifica; ma client riceve solo se server l'ha inviato
        const title = payload?.event?.title || 'Evento segnalato';
        const reporter = payload?.reporter?.name || 'Utente';
        const reason = payload?.reason || '';
        showToast(`🚨 Segnalazione: ${reporter} ha segnalato '${title}' (${reason})` , 8000);
        // Eventuale refresh per la lista amministrativa
        try {
            if (currentUser && currentUser.role === 'admin') {
                loadUserEvents();
                loadAvailableEvents();
            }
        } catch {}
    });

    return socket;
}

async function openChat(eventId, eventTitle) {
    activeChatEventId = eventId;
    document.getElementById('chatTitle').textContent = `Chat: ${eventTitle}`;
    const chatModal = document.getElementById('chatModal');
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '<div class="text-muted" style="text-align:center; padding: 10px;">Caricamento messaggi...</div>';
    chatModal.style.display = 'block';
    toggleChatInput(false);
    setChatStatus('Connessione alla chat...');

    const s = ensureSocket();
    // Unisciti alla stanza dell'evento
    s.emit('join_event', { eventId });

    // Carica la history
    try {
        const resp = await fetch(`/api/events/${eventId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (resp.ok) {
            const msgs = await resp.json();
            renderChatMessages(msgs);
            setChatStatus('Storico caricato. In attesa di nuovi messaggi...');
        } else {
            chatMessages.innerHTML = '<div class="text-muted" style="text-align:center; padding: 10px;">Impossibile caricare i messaggi</div>';
            setChatStatus('Impossibile caricare i messaggi', true);
        }
    } catch (e) {
        console.error('Errore caricamento messaggi:', e);
        chatMessages.innerHTML = '<div class="text-muted" style="text-align:center; padding: 10px;">Errore di connessione</div>';
        setChatStatus('Errore di connessione', true);
    }
}

function renderChatMessages(messages) {
    const list = document.getElementById('chatMessages');
    list.innerHTML = '';
    messages.forEach(m => appendChatMessage(m));
    // scroll alla fine
    list.scrollTop = list.scrollHeight;
}

function appendChatMessage(message) {
    const list = document.getElementById('chatMessages');
    const wrapper = document.createElement('div');
    const myId = currentUser?. _id;
    const senderId = message?.sender && (message.sender._id || message.sender);
    const isMine = myId && senderId ? (String(senderId) === String(myId)) : false;
    const senderName = message.sender && message.sender.name ? message.sender.name : (isMine ? 'Tu' : 'Partecipante');
    const time = message.createdAt ? new Date(message.createdAt) : new Date();
    const timeLabel = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    wrapper.className = `chat-message ${isMine ? 'mine' : 'theirs'}`;
    wrapper.innerHTML = `
        <div class="meta">
            <span class="sender">${senderName}</span>
            <span class="time">${timeLabel}</span>
        </div>
        <div class="bubble">${escapeHtml(message.text || '')}</div>
    `;
    list.appendChild(wrapper);
    list.scrollTop = list.scrollHeight;
}

// Escape base per sicurezza XSS nel client
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Gestione invio messaggi (con fallback di binding)
const chatFormEl = document.getElementById('chatForm');
if (chatFormEl) {
    chatFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text || !activeChatEventId) return;
        try {
            const s = ensureSocket();
            if (!s.connected) {
                setChatStatus('Non connesso alla chat. Riprova tra poco...', true);
                return;
            }
            s.emit('chat_message', { eventId: activeChatEventId, text });
        } catch (err) {
            console.error('Errore invio su socket:', err);
            setChatStatus('Errore nell\'invio del messaggio', true);
        }
        // Aggiunta ottimistica
        appendChatMessage({ sender: currentUser || { _id: 'me' }, text, createdAt: new Date().toISOString(), event: activeChatEventId });
        input.value = '';
    });
} else {
    console.warn('Elemento chatForm non trovato in DOM');
}

// Chiusura modal chat
document.getElementById('closeChatModal').addEventListener('click', () => {
    document.getElementById('chatModal').style.display = 'none';
    activeChatEventId = null;
});

// Chiudi chat cliccando fuori
window.addEventListener('click', (event) => {
    const chatModal = document.getElementById('chatModal');
    if (event.target === chatModal) {
        chatModal.style.display = 'none';
        activeChatEventId = null;
        setChatStatus('');
        toggleChatInput(false);
    }
});

function setChatStatus(message, isError = false) {
    const el = document.getElementById('chatStatus');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.style.background = isError ? '#fff0f0' : '#fffaf0';
    el.style.borderColor = isError ? '#ffcdd2' : '#ffecb3';
}

function toggleChatInput(enabled) {
    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    if (input) input.disabled = !enabled;
    if (btn) btn.disabled = !enabled;
}

// =====================
// Toast notifications
// =====================

function ensureToastContainer() {
    let ct = document.getElementById('toastContainer');
    if (!ct) {
        ct = document.createElement('div');
        ct.id = 'toastContainer';
        ct.className = 'toast-container';
        document.body.appendChild(ct);
    }
    return ct;
}

function showToast(message, timeout = 3500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    // trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

// Carica il profilo all'avvio
loadUserProfile();

// Inizializza socket immediatamente per notification listeners
ensureSocket();

// =====================
// Report modal handling
// =====================

function openReportModal(eventId, eventTitle) {
    document.getElementById('reportEventId').value = eventId;
    document.getElementById('reportReason').value = '';
    document.getElementById('reportDetails').value = '';
    hideMessage('reportErrorMessage');
    hideMessage('reportSuccessMessage');
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

document.getElementById('closeReportModal').addEventListener('click', () => {
    document.getElementById('reportModal').style.display = 'none';
});

document.getElementById('cancelReportBtn').addEventListener('click', () => {
    document.getElementById('reportModal').style.display = 'none';
});

// Submit report form
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventId = document.getElementById('reportEventId').value;
    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value;

    if (!reason) {
        showMessage('reportErrorMessage', 'Seleziona una motivazione', true);
        return;
    }

    try {
        const resp = await fetch(`/api/events/${eventId}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason, details })
        });

        const data = await resp.json();
        if (resp.ok) {
            showMessage('reportSuccessMessage', 'Segnalazione inviata con successo');
            showToast('Segnalazione inviata agli amministratori', 4000);
            setTimeout(() => {
                document.getElementById('reportModal').style.display = 'none';
            }, 1200);
        } else {
            showMessage('reportErrorMessage', data.message || 'Errore invio segnalazione', true);
        }
    } catch (err) {
        console.error('Errore report:', err);
        showMessage('reportErrorMessage', 'Errore di connessione al server', true);
    }
});
